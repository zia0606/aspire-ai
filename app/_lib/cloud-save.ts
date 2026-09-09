"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getActiveWorkspaceUser } from "./workspace-identity";

export type CloudSaveStatus = "idle" | "saving" | "saved" | "failed" | "local";
export type CloudSavePayload = { type: string; [key: string]: unknown };
export type CloudSaveState = {
  status: CloudSaveStatus;
  pending: number;
  message: string;
  updatedAt: number;
};
export type FlushResult = {
  ok: boolean;
  pending: number;
  localOnly?: boolean;
};

type QueueItem = {
  id: string;
  key: string;
  ownerId: string;
  payload: CloudSavePayload;
  attempts: number;
  createdAt: number;
  lastError?: string;
};

const QUEUE_KEY = "aspire-cloud-save-queue-v1";
const STATUS_EVENT = "aspire-cloud-save-status-changed";
const RETRY_DELAYS = [1_500, 5_000, 15_000, 30_000];

let runtimeState: CloudSaveState = {
  status: "idle",
  pending: 0,
  message: "No pending cloud changes.",
  updatedAt: 0,
};
let activeFlush: Promise<FlushResult> | null = null;
let retryTimer: number | null = null;
let onlineListenerInstalled = false;

function safeRandomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is QueueItem => {
      if (!item || typeof item !== "object") return false;
      const value = item as Partial<QueueItem>;
      return (
        typeof value.id === "string" &&
        typeof value.key === "string" &&
        typeof value.ownerId === "string" &&
        Boolean(value.payload) && typeof value.payload === "object" &&
        typeof value.attempts === "number" &&
        typeof value.createdAt === "number"
      );
    });
  } catch {
    return [];
  }
}

function writeQueue(queue: QueueItem[]) {
  if (typeof window === "undefined") return;
  try {
    if (queue.length) window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    else window.localStorage.removeItem(QUEUE_KEY);
  } catch {
    // Browser storage can be unavailable in restricted/private environments.
  }
}

function pendingFor(userId: string | null) {
  if (!userId) return 0;
  return readQueue().filter((item) => item.ownerId === userId).length;
}

function emitStatus() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STATUS_EVENT));
}

function setState(status: CloudSaveStatus, message: string, userId = getActiveWorkspaceUser()) {
  runtimeState = {
    status,
    pending: pendingFor(userId),
    message,
    updatedAt: Date.now(),
  };
  emitStatus();
}

function saveKey(payload: CloudSavePayload) {
  switch (payload.type) {
    case "profile": return "profile";
    case "roadmap": return `roadmap:${String(payload.career ?? "")}`;
    case "applications": return "applications";
    case "portfolio": return "portfolio";
    case "interview": return "interview";
    case "resume": return `resume:${String(payload.requestId ?? "")}`;
    default: return `${payload.type}:${safeRandomId()}`;
  }
}

function normalizePayload(payload: CloudSavePayload): CloudSavePayload {
  if (payload.type === "resume" && typeof payload.requestId !== "string") {
    return { ...payload, requestId: safeRandomId() };
  }
  return payload;
}

function scheduleRetry(userId: string) {
  if (typeof window === "undefined" || retryTimer !== null) return;
  const queue = readQueue().filter((item) => item.ownerId === userId);
  if (!queue.length) return;

  const maxAttempts = Math.max(...queue.map((item) => item.attempts), 0);
  const delay = RETRY_DELAYS[Math.min(maxAttempts, RETRY_DELAYS.length - 1)];
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      scheduleRetry(userId);
      return;
    }
    void flushPendingCloudSaves(userId);
  }, delay);
}

function ensureOnlineListener() {
  if (typeof window === "undefined" || onlineListenerInstalled) return;
  onlineListenerInstalled = true;
  window.addEventListener("online", () => {
    const userId = getActiveWorkspaceUser();
    if (userId && pendingFor(userId)) void flushPendingCloudSaves(userId);
  });
}

async function send(item: QueueItem) {
  try {
    const response = await fetch("/api/data/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item.payload),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: response.status === 401
          ? "Your cloud session is no longer active."
          : `Cloud save returned ${response.status}.`,
      };
    }

    const data = (await response.json()) as { saved?: boolean };
    return data.saved === true
      ? { ok: true as const, error: "" }
      : { ok: false as const, error: "Cloud did not confirm the save." };
  } catch {
    return { ok: false as const, error: "Cloud connection failed." };
  }
}

async function flushOnce(userId: string): Promise<FlushResult> {
  const batch = readQueue().filter((item) => item.ownerId === userId);
  if (!batch.length) {
    setState("saved", "Everything is saved to cloud.", userId);
    return { ok: true, pending: 0 };
  }

  setState("saving", `Saving ${batch.length} cloud change${batch.length === 1 ? "" : "s"}…`, userId);

  for (const item of batch) {
    const result = await send(item);
    const latest = readQueue();
    const current = latest.find((candidate) => candidate.id === item.id);
    if (!current) continue;

    if (result.ok) {
      writeQueue(latest.filter((candidate) => candidate.id !== item.id));
    } else {
      writeQueue(latest.map((candidate) => candidate.id === item.id
        ? { ...candidate, attempts: candidate.attempts + 1, lastError: result.error }
        : candidate));
    }
  }

  const remaining = pendingFor(userId);
  if (!remaining) {
    if (retryTimer !== null && typeof window !== "undefined") {
      window.clearTimeout(retryTimer);
      retryTimer = null;
    }
    setState("saved", "Saved to Neon cloud.", userId);
    return { ok: true, pending: 0 };
  }

  const lastError = readQueue().find((item) => item.ownerId === userId)?.lastError;
  setState("failed", lastError || "Some changes have not reached cloud yet.", userId);
  scheduleRetry(userId);
  return { ok: false, pending: remaining };
}

async function runFlush(userId: string, attempts: number): Promise<FlushResult> {
  let result: FlushResult = { ok: true, pending: 0 };
  const rounds = Math.max(1, Math.min(attempts, 4));

  for (let round = 0; round < rounds; round += 1) {
    result = await flushOnce(userId);
    if (result.ok) return result;
    if (round < rounds - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (round + 1)));
    }
  }

  return result;
}

export async function queueCloudSave(payload: CloudSavePayload): Promise<FlushResult> {
  ensureOnlineListener();
  const ownerId = getActiveWorkspaceUser();
  if (!ownerId) {
    setState("local", "Saved in this browser. Sign in to sync with Neon.", null);
    return { ok: false, pending: 0, localOnly: true };
  }

  const normalized = normalizePayload(payload);
  const key = saveKey(normalized);
  const next: QueueItem = {
    id: safeRandomId(),
    key,
    ownerId,
    payload: normalized,
    attempts: 0,
    createdAt: Date.now(),
  };

  const queue = readQueue().filter((item) => !(item.ownerId === ownerId && item.key === key));
  writeQueue([...queue, next]);
  setState("saving", "Saving to Neon cloud…", ownerId);

  if (activeFlush) {
    await activeFlush;
  }
  return flushPendingCloudSaves(ownerId);
}

export function flushPendingCloudSaves(
  userId = getActiveWorkspaceUser(),
  options: { attempts?: number } = {},
): Promise<FlushResult> {
  ensureOnlineListener();
  if (!userId) {
    setState("local", "No signed-in cloud workspace.", null);
    return Promise.resolve({ ok: true, pending: 0, localOnly: true });
  }

  if (activeFlush) return activeFlush;
  activeFlush = runFlush(userId, options.attempts ?? 1).finally(() => {
    activeFlush = null;
  });
  return activeFlush;
}

export function hasPendingCloudSaves(userId = getActiveWorkspaceUser()) {
  return pendingFor(userId) > 0;
}

export function pendingCloudSaveCount(userId = getActiveWorkspaceUser()) {
  return pendingFor(userId);
}

export function discardPendingCloudSaves(userId = getActiveWorkspaceUser()) {
  if (!userId) return;
  writeQueue(readQueue().filter((item) => item.ownerId !== userId));
  setState("idle", "No pending cloud changes.", userId);
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === QUEUE_KEY) callback();
  };
  window.addEventListener(STATUS_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(STATUS_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

function snapshot() {
  const userId = getActiveWorkspaceUser();
  const pending = pendingFor(userId);
  let status = runtimeState.status;
  let message = runtimeState.message;

  if (pending > 0 && (status === "idle" || status === "saved")) {
    status = "failed";
    message = "Changes are waiting to be synced.";
  } else if (pending === 0 && status === "failed") {
    status = "idle";
    message = "No pending cloud changes.";
  }

  return JSON.stringify({ ...runtimeState, status, message, pending });
}

export function useCloudSaveStatus() {
  ensureOnlineListener();
  const raw = useSyncExternalStore(subscribe, snapshot, () => JSON.stringify(runtimeState));
  return useMemo(() => JSON.parse(raw) as CloudSaveState, [raw]);
}

export function cloudSaveLabel(state: CloudSaveState, signedIn: boolean) {
  if (!signedIn) return "Local only";
  if (state.status === "saving") return "Saving…";
  if (state.status === "failed") return state.pending ? `Save failed · ${state.pending} pending` : "Save failed";
  if (state.status === "saved") return "Saved";
  return "Cloud ready";
}
