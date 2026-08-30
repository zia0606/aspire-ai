"use client";

import { useMemo, useSyncExternalStore } from "react";

export type ApplicationStage =
  | "Saved"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export type ApplicationRecord = {
  id: string;
  company: string;
  role: string;
  stage: ApplicationStage;
  location: string;
  url: string;
  source: string;
  nextAction: string;
  dueDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const APPLICATIONS_KEY = "aspire-applications-v1";
const APPLICATIONS_EVENT = "aspire-applications-changed";

export const applicationStages: ApplicationStage[] = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === APPLICATIONS_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(APPLICATIONS_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(APPLICATIONS_EVENT, onCustom);
  };
}

function isStage(value: unknown): value is ApplicationStage {
  return typeof value === "string" && applicationStages.includes(value as ApplicationStage);
}

export function isApplicationRecord(value: unknown): value is ApplicationRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ApplicationRecord>;
  return (
    typeof item.id === "string" &&
    typeof item.company === "string" &&
    typeof item.role === "string" &&
    isStage(item.stage) &&
    typeof item.location === "string" &&
    typeof item.url === "string" &&
    typeof item.source === "string" &&
    typeof item.nextAction === "string" &&
    typeof item.dueDate === "string" &&
    typeof item.notes === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function parse(raw: string) {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isApplicationRecord) : [];
  } catch {
    return [];
  }
}

function snapshot() {
  return localStorage.getItem(APPLICATIONS_KEY) ?? "[]";
}

function postCloud(applications: ApplicationRecord[]) {
  void fetch("/api/data/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "applications", applications }),
  }).catch(() => {
    // Local application tracking remains available if cloud sync is offline.
  });
}

export function readApplicationsLocal() {
  if (typeof window === "undefined") return [];
  return parse(localStorage.getItem(APPLICATIONS_KEY) ?? "[]");
}

export function hydrateApplications(applications: ApplicationRecord[]) {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
  window.dispatchEvent(new Event(APPLICATIONS_EVENT));
}

export function saveApplications(applications: ApplicationRecord[]) {
  hydrateApplications(applications);
  postCloud(applications);
}

export function useApplications() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const applications = useMemo(() => parse(raw), [raw]);
  return { applications, saveApplications };
}
