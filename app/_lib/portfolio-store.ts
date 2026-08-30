"use client";

import { useMemo, useSyncExternalStore } from "react";

export type PortfolioStatus = "Planned" | "Building" | "Ready" | "Published";

export type PortfolioEvidence = {
  id: string;
  career: string;
  phaseIndex: number;
  phaseTitle: string;
  projectTitle: string;
  status: PortfolioStatus;
  problem: string;
  approach: string;
  outcome: string;
  repoUrl: string;
  demoUrl: string;
  skills: string[];
  createdAt: string;
  updatedAt: string;
};

const PORTFOLIO_KEY = "aspire-portfolio-evidence-v1";
const PORTFOLIO_EVENT = "aspire-portfolio-evidence-changed";

export const portfolioStatuses: PortfolioStatus[] = ["Planned", "Building", "Ready", "Published"];

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === PORTFOLIO_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(PORTFOLIO_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PORTFOLIO_EVENT, onCustom);
  };
}

function isStatus(value: unknown): value is PortfolioStatus {
  return typeof value === "string" && portfolioStatuses.includes(value as PortfolioStatus);
}

export function isPortfolioEvidence(value: unknown): value is PortfolioEvidence {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PortfolioEvidence>;
  return (
    typeof item.id === "string" &&
    typeof item.career === "string" &&
    typeof item.phaseIndex === "number" && Number.isInteger(item.phaseIndex) && item.phaseIndex >= 0 &&
    typeof item.phaseTitle === "string" &&
    typeof item.projectTitle === "string" &&
    isStatus(item.status) &&
    typeof item.problem === "string" &&
    typeof item.approach === "string" &&
    typeof item.outcome === "string" &&
    typeof item.repoUrl === "string" &&
    typeof item.demoUrl === "string" &&
    Array.isArray(item.skills) && item.skills.every((skill) => typeof skill === "string") &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function parse(raw: string) {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isPortfolioEvidence) : [];
  } catch {
    return [];
  }
}

function snapshot() {
  return localStorage.getItem(PORTFOLIO_KEY) ?? "[]";
}

function postCloud(evidence: PortfolioEvidence[]) {
  void fetch("/api/data/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "portfolio", evidence }),
  }).catch(() => {
    // Portfolio evidence remains available locally when cloud sync is offline.
  });
}

export function readPortfolioLocal() {
  if (typeof window === "undefined") return [];
  return parse(localStorage.getItem(PORTFOLIO_KEY) ?? "[]");
}

export function hydratePortfolio(evidence: PortfolioEvidence[]) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(evidence));
  window.dispatchEvent(new Event(PORTFOLIO_EVENT));
}

export function savePortfolio(evidence: PortfolioEvidence[]) {
  hydratePortfolio(evidence);
  postCloud(evidence);
}

export function usePortfolioEvidence() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const evidence = useMemo(() => parse(raw), [raw]);
  return { evidence, savePortfolio };
}
