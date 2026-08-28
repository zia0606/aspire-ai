"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Profile } from "./career-data";

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

function isProfileV2(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<Profile>;
  const breakdown = profile.matchBreakdown;
  return (
    profile.version === 2 &&
    typeof profile.education === "string" &&
    typeof profile.career === "string" &&
    typeof profile.experience === "string" &&
    Array.isArray(profile.skills) &&
    Array.isArray(profile.interests) &&
    typeof profile.matchPercentage === "number" &&
    Number.isFinite(profile.matchPercentage) &&
    Boolean(breakdown) &&
    typeof breakdown?.education === "number" &&
    typeof breakdown?.skills === "number" &&
    typeof breakdown?.interests === "number" &&
    typeof breakdown?.experience === "number"
  );
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
  const value = JSON.stringify(profile);
  localStorage.setItem(PROFILE_KEY, value);
  localStorage.setItem(LEGACY_PROFILE_KEY, value);
  window.dispatchEvent(new Event(PROFILE_EVENT));
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
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event(ROADMAP_EVENT));
  }

  return { completed, setCompleted };
}

export function resetRoadmapProgress(career: string) {
  localStorage.removeItem(progressKey(career));
  window.dispatchEvent(new Event(ROADMAP_EVENT));
}
