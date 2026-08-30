"use client";

import { useMemo, useSyncExternalStore } from "react";

export type InterviewCategory = "Introduction" | "Role" | "Technical" | "Project" | "Behavioral";

export type InterviewPracticeRecord = {
  id: string;
  career: string;
  questionId: string;
  question: string;
  category: InterviewCategory;
  answer: string;
  confidence: number;
  practicedAt: string;
};

const INTERVIEW_KEY = "aspire-interview-practice-v1";
const INTERVIEW_EVENT = "aspire-interview-practice-changed";

export const interviewCategories: InterviewCategory[] = [
  "Introduction",
  "Role",
  "Technical",
  "Project",
  "Behavioral",
];

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === INTERVIEW_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(INTERVIEW_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(INTERVIEW_EVENT, onCustom);
  };
}

function isCategory(value: unknown): value is InterviewCategory {
  return typeof value === "string" && interviewCategories.includes(value as InterviewCategory);
}

export function isInterviewPracticeRecord(value: unknown): value is InterviewPracticeRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<InterviewPracticeRecord>;
  return (
    typeof item.id === "string" &&
    typeof item.career === "string" &&
    typeof item.questionId === "string" &&
    typeof item.question === "string" &&
    isCategory(item.category) &&
    typeof item.answer === "string" &&
    typeof item.confidence === "number" &&
    Number.isInteger(item.confidence) &&
    item.confidence >= 1 && item.confidence <= 5 &&
    typeof item.practicedAt === "string"
  );
}

function parse(raw: string) {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isInterviewPracticeRecord) : [];
  } catch {
    return [];
  }
}

function snapshot() {
  return localStorage.getItem(INTERVIEW_KEY) ?? "[]";
}

function postCloud(practice: InterviewPracticeRecord[]) {
  void fetch("/api/data/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "interview", practice }),
  }).catch(() => {
    // Interview practice remains available locally when cloud sync is offline.
  });
}

export function readInterviewPracticeLocal() {
  if (typeof window === "undefined") return [];
  return parse(localStorage.getItem(INTERVIEW_KEY) ?? "[]");
}

export function hydrateInterviewPractice(practice: InterviewPracticeRecord[]) {
  localStorage.setItem(INTERVIEW_KEY, JSON.stringify(practice));
  window.dispatchEvent(new Event(INTERVIEW_EVENT));
}

export function saveInterviewPractice(practice: InterviewPracticeRecord[]) {
  const trimmed = practice.slice(0, 300);
  hydrateInterviewPractice(trimmed);
  postCloud(trimmed);
}

export function useInterviewPractice() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const practice = useMemo(() => parse(raw), [raw]);
  return { practice, saveInterviewPractice };
}
