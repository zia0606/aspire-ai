"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Profile } from "./career-data";
import { isProfileV2 } from "./profile-validation";

const PROFILE_KEY = "aspire-profile-v2";
const LEGACY_PROFILE_KEY = "aspire-profile";
const PROFILE_EVENT = "aspire-profile-changed";
const ROADMAP_EVENT = "aspire-roadmap-changed";

function subscribeProfile(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === PROFILE_KEY || event.key === LEGACY_PROFILE_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(PROFILE_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PROFILE_EVENT, onCustom);
  };
}

function getProfileSnapshot() {
  return localStorage.getItem(PROFILE_KEY) ?? localStorage.getItem(LEGACY_PROFILE_KEY) ?? "";
}

function postCloud(payload: unknown) {
  void fetch("/api/data/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Local mode is authoritative when cloud sync is unavailable.
  });
}

export function readProfileLocal() {
  if (typeof window === "undefined") return null;
  const raw = getProfileSnapshot();
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isProfileV2(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function hydrateProfile(profile: Profile) {
  const value = JSON.stringify(profile);
  localStorage.setItem(PROFILE_KEY, value);
  localStorage.setItem(LEGACY_PROFILE_KEY, value);
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

export function useProfile() {
  const raw = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => "");
  return useMemo(() => {
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isProfileV2(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [raw]);
}

export function saveProfile(profile: Profile) {
  hydrateProfile(profile);
  postCloud({ type: "profile", profile });
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(LEGACY_PROFILE_KEY);
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

function progressKey(career: string) {
  return `aspire-roadmap-progress-v2:${career}`;
}

function subscribeRoadmap(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith("aspire-roadmap-progress-v2:")) callback();
  };
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(ROADMAP_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ROADMAP_EVENT, onCustom);
  };
}

export function readRoadmapProgressLocal(career: string) {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(progressKey(career)) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is number => Number.isInteger(item))
      : [];
  } catch {
    return [];
  }
}

export function hydrateRoadmapProgress(career: string, completed: number[]) {
  localStorage.setItem(progressKey(career), JSON.stringify(completed));
  window.dispatchEvent(new Event(ROADMAP_EVENT));
}

export function useRoadmapProgress(career: string) {
  const key = progressKey(career);
  const raw = useSyncExternalStore(
    subscribeRoadmap,
    () => localStorage.getItem(key) ?? "[]",
    () => "[]",
  );

  const completed = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is number => Number.isInteger(item))
        : [];
    } catch {
      return [];
    }
  }, [raw]);

  function setCompleted(next: number[]) {
    hydrateRoadmapProgress(career, next);
    postCloud({ type: "roadmap", career, completed: next });
  }

  return { completed, setCompleted };
}

export function resetRoadmapProgress(career: string) {
  localStorage.removeItem(progressKey(career));
  window.dispatchEvent(new Event(ROADMAP_EVENT));
  postCloud({ type: "roadmap", career, completed: [] });
}
