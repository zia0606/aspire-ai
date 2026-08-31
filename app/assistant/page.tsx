"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import AppNav from "../_components/app-nav";
import { useApplications } from "../_lib/application-store";
import { careerCatalog } from "../_lib/career-data";
import { useInterviewPractice } from "../_lib/interview-store";
import { usePortfolioEvidence } from "../_lib/portfolio-store";
import { useProfile, useRoadmapProgress } from "../_lib/profile-store";

type Message = {
  role: "assistant" | "user";
  text: string;
};

type AssistantMode = "ai" | "local" | null;

type AssistantResponse = {
  answer?: string;
  mode?: "ai" | "local";
  error?: string;
};

const suggestions = [
  "What should I do next?",
  "I feel confused about my career",
  "Make me a 30-day plan",
  "How do I get an internship with no experience?",
  "I got rejected. What should I improve?",
  "Should I switch careers?",
  "Help me explain a project in an interview",
  "How should I improve my resume?",
];

export default function AssistantPage() {
  const profile = useProfile();
  const { completed } = useRoadmapProgress(profile?.career ?? "");
  const { applications } = useApplications();
  const { evidence } = usePortfolioEvidence();
  const { practice } = useInterviewPractice();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mode, setMode] = useState<AssistantMode>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Tell me what is happening in your career journey—even if it is messy. I can help with direction, switching careers, study plans, skills, projects, portfolio proof, resumes, internships, applications, rejection, offers, networking and interviews.",
    },
  ]);

  const career = profile ? careerCatalog[profile.career] : null;
  const validCompleted = career
    ? completed.filter((index) => index >= 0 && index < career.roadmap.length)
    : [];
  const roadmapProgress = career?.roadmap.length
    ? Math.round((validCompleted.length / career.roadmap.length) * 100)
    : 0;
  const nextPhase = career?.roadmap.find((_, index) => !validCompleted.includes(index));
  const currentPortfolio = profile
    ? evidence.filter((item) => item.career === profile.career)
    : evidence;
  const activeApplications = applications.filter(
    (item) => !["Rejected", "Withdrawn"].includes(item.stage),
  );
  const currentPractice = profile
    ? practice.filter((item) => item.career === profile.career)
    : practice;
  const averageConfidence = currentPractice.length
    ? currentPractice.reduce((sum, item) => sum + item.confidence, 0) / currentPractice.length
    : 0;

  async function send(question: string) {
    const clean = question.trim();
    if (!clean || isSending) return;

    const history = messages.slice(-10);
    setMessages((current) => [...current, { role: "user", text: clean }]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          completed: validCompleted,
          portfolio: evidence.slice(0, 60),
          applications: applications.slice(0, 100),
          interviewPractice: practice.slice(0, 100),
          messages: history,
          question: clean,
        }),
      });

      const data = (await response.json()) as AssistantResponse;
      if (!response.ok || !data.answer) {
        throw new Error(data.error || "Assistant request failed.");
      }

      setMode(data.mode ?? null);
      setMessages((current) => [...current, { role: "assistant", text: data.answer as string }]);
    } catch (error) {
      console.error("Aspire career coach request failed:", error);
      setMode(null);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "The coach service could not be reached just now. Your Aspire data is unchanged. Try again in a moment.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <main className="page-shell">
      <AppNav active="assistant" />

      <section className="page-container py-10 md:py-14">
        <div className="flex flex-col justify-between gap-5 border-b border-[var(--line-strong)] pb-7 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Aspire Coach</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
              Ask about the whole career journey.
            </h1>
            <p className="text-muted mt-3 max-w-3xl leading-7">
              Direction, study plans, career switches, projects, resume, internships, applications, rejection, interviews and offers. The Coach uses your Aspire workspace when it exists, but it can also answer general career questions before an assessment.
            </p>
          </div>
          <ModeStatus mode={mode} isSending={isSending} />
        </div>

        <div className="grid gap-8 py-8 lg:grid-cols-[310px_1fr]">
          <aside className="self-start lg:sticky lg:top-28">
            {profile && career ? (
              <div className="panel p-5">
                <p className="section-kicker">Live workspace context</p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">{profile.career}</h2>
                <p className="text-muted mt-2 text-sm leading-6">{career.summary}</p>

                <dl className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
                  <ContextRow label="Career match" value={`${profile.matchPercentage}%`} />
                  <ContextRow label="Roadmap" value={`${roadmapProgress}%`} />
                  <ContextRow label="Portfolio" value={`${currentPortfolio.length} records`} />
                  <ContextRow label="Applications" value={`${activeApplications.length} active`} />
                  <ContextRow
                    label="Interview"
                    value={currentPractice.length ? `${averageConfidence.toFixed(1)}/5 avg` : "Not practised"}
                  />
                </dl>

                <div className="mt-5">
                  <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Next learning phase</p>
                  <p className="mt-2 text-sm font-semibold">{nextPhase?.title ?? "All current phases complete"}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link href="/dashboard" className="button-secondary">Dashboard</Link>
                  <Link href="/interview" className="button-secondary">Interview</Link>
                </div>
              </div>
            ) : (
              <div className="panel p-5">
                <p className="section-kicker">General coach mode</p>
                <h2 className="mt-3 text-xl font-semibold">You can ask before choosing a career.</h2>
                <p className="text-muted mt-2 text-sm leading-6">
                  Ask about career confusion, comparing roles, internships, study choices or what a career actually requires. Completing Assessment later adds personalized skills and roadmap context.
                </p>
                <Link href="/assessment" className="button-primary mt-5 w-full">Add my career context</Link>
              </div>
            )}

            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <p className="text-faint text-xs leading-5">
                Career Match stays assessment-owned. Coach advice never silently rewrites it. When an external AI key is configured, Aspire sends only the workspace context needed for the answer from the server; otherwise the built-in local coach handles the question.
              </p>
            </div>
          </aside>

          <section className="panel flex min-h-[680px] flex-col overflow-hidden">
            <div className="border-b border-[var(--line)] px-5 py-4 md:px-6">
              <p className="text-sm font-semibold">Career conversation</p>
              <p className="text-faint mt-1 text-xs">
                Ask naturally. You do not need to know which Aspire module your problem belongs to.
              </p>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`grid gap-2 ${message.role === "user" ? "justify-items-end" : "justify-items-start"}`}
                >
                  <span className="text-faint text-[11px] font-bold uppercase tracking-[.07em]">
                    {message.role === "user" ? "You" : "Aspire coach"}
                  </span>
                  <p
                    className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-[var(--ink)] text-white"
                        : "border border-[var(--line)] bg-[#f8f6f0] text-[var(--ink)]"
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              ))}

              {isSending && (
                <div className="grid justify-items-start gap-2">
                  <span className="text-faint text-[11px] font-bold uppercase tracking-[.07em]">Aspire coach</span>
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[#f8f6f0] px-4 py-3 text-sm text-muted">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
                    Reading your workspace and working on the answer…
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[var(--line)] bg-[#faf8f3] p-4 md:p-5">
              <p className="text-faint mb-2 text-[11px] font-bold uppercase tracking-[.07em]">Try a situation</p>
              <div className="mb-4 flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={isSending}
                    onClick={() => void send(suggestion)}
                    className="status-pill transition hover:border-[var(--line-strong)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="flex gap-2">
                <input
                  value={input}
                  disabled={isSending}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Tell Aspire Coach what is happening…"
                  className="min-w-0 flex-1 rounded-[.65rem] border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="button-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function ModeStatus({ mode, isSending }: { mode: AssistantMode; isSending: boolean }) {
  const text = isSending
    ? "Thinking…"
    : mode === "ai"
      ? "AI service connected"
      : mode === "local"
        ? "Smart local coach"
        : "Ready";
  return <span className="status-pill">{text}</span>;
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 py-3">
      <dt className="text-faint">{label}</dt>
      <dd className="m-0 text-right font-medium">{value}</dd>
    </div>
  );
}
