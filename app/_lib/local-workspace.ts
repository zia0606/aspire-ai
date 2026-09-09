"use client";

const ASPIRE_STORAGE_PREFIX = "aspire-";

const WORKSPACE_EVENTS = [
  "aspire-profile-changed",
  "aspire-roadmap-changed",
  "aspire-applications-changed",
  "aspire-portfolio-evidence-changed",
  "aspire-interview-practice-changed",
];

function clearPrefixedStorage(storage: Storage) {
  const keys: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(ASPIRE_STORAGE_PREFIX)) keys.push(key);
  }

  for (const key of keys) storage.removeItem(key);
}

export function clearLocalAspireWorkspace() {
  if (typeof window === "undefined") return;

  clearPrefixedStorage(window.localStorage);
  clearPrefixedStorage(window.sessionStorage);

  for (const eventName of WORKSPACE_EVENTS) {
    window.dispatchEvent(new Event(eventName));
  }
}
