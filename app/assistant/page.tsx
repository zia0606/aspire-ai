"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import AppNav from "../_components/app-nav";
import { careerCatalog } from "../_lib/career-data";
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
  "What should I learn next?",
  "Which skill gap matters most?",
  "Give me a project idea",
  "How should I improve my resume?",
  "How should I prepare for interviews?",
];

export default function AssistantPage() {
  const profile = useProfile();
  const { completed } = useRoadmapProgress(profile?.career ?? "");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mode, setMode] = useState<AssistantMode>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Ask me about your next skill, roadmap phase, project, resume or interview preparation. I’ll use the career profile and progress already saved in Aspire as context.",
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

  async function send(question: string) {
    const clean = question.trim();
    if (!clean || isSending) return;

    const history = messages.slice(-8);
    setMessages((current) => [...current, { role: "user", text: clean }]);
    setInput("");

    if (!profile || !career) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "Complete the assessment first so I have a saved career, score, skills, interests and roadmap to work from.",
        },
      ]);
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          completed: validCompleted,
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
          text: "The coach service could not be reached just now. Your saved profile and roadmap are unchanged. Try again in a moment.",
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
            <p className="eyebrow">Career coach</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">Ask a focused question.</h1>
            <p className="text-muted mt-3 max-w-2xl leading-7">
              The coach uses the profile and roadmap already in Aspire. It does not create a new career-match score or overwrite your assessment.
            </p>
          </div>
          <ModeStatus mode={mode} isSending={isSending} />
        </div>

        <div className="grid gap-8 py-8 lg:grid-cols-[300px_1fr]">
          <aside className="self-start lg:sticky lg:top-28">
            {profile && career ? (
              <div className="panel p-5">
                <p className="section-kicker">Context in this conversation</p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">{profile.career}</h2>
                <p className="text-muted mt-2 text-sm leading-6">{career.summary}</p>

                <dl className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
                  <ContextRow label="Career match" value={`${profile.matchPercentage}%`} />
                  <ContextRow label="Roadmap" value={`${roadmapProgress}%`} />
                  <ContextRow label="Skills" value={`${profile.skills.length} selected`} />
                  <ContextRow label="Experience" value={profile.experience} />
                </dl>

                <div className="mt-5">
                  <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Next phase</p>
                  <p className="mt-2 text-sm font-semibold">{nextPhase?.title ?? "All current phases complete"}</p>
                </div>

                <div className="mt-5 flex gap-2">
                  <Link href="/roadmap" className="button-secondary flex-1">Roadmap</Link>
                  <Link href="/assessment" className="button-quiet">Edit</Link>
                </div>
              </div>
            ) : (
              <div className="panel p-5">
                <p className="section-kicker">No saved context</p>
                <h2 className="mt-3 text-xl font-semibold">Complete the assessment first.</h2>
                <p className="text-muted mt-2 text-sm leading-6">The coach is most useful when it can see the same career profile as the rest of the workspace.</p>
                <Link href="/assessment" className="button-primary mt-5 w-full">Open assessment</Link>
              </div>
            )}

            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <p className="text-faint text-xs leading-5">
                AI mode is used when a server key is configured. Otherwise Aspire falls back to its local career guidance rules.
              </p>
            </div>
          </aside>

          <section className="panel flex min-h-[650px] flex-col overflow-hidden">
            <div className="border-b border-[var(--line)] px-5 py-4 md:px-6">
              <p className="text-sm font-semibold">Conversation</p>
              <p className="text-faint mt-1 text-xs">Keep questions specific to get more useful next steps.</p>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6" aria-live="polite">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`grid gap-2 ${message.role === "user" ? "justify-items-end" : "justify-items-start"}`}>
                  <span className="text-faint text-[11px] font-bold uppercase tracking-[.07em]">
                    {message.role === "user" ? "You" : "Aspire coach"}
                  </span>
                  <p
                    className={`max-w-[88%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 ${
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
                    Working on your answer…
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[var(--line)] bg-[#faf8f3] p-4 md:p-5">
              <div className="mb-3 flex flex-wrap gap-2">
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
                  placeholder="Ask about your next move…"
                  className="min-w-0 flex-1 rounded-[.65rem] border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)] disabled:opacity-50"
                />
                <button type="submit" disabled={isSending || !input.trim()} className="button-primary disabled:cursor-not-allowed disabled:opacity-40">
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
  const text = isSending ? "Working…" : mode === "ai" ? "AI service connected" : mode === "local" ? "Local guidance mode" : "Ready";
  return <span className="status-pill">{text}</span>;
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[95px_1fr] gap-3 py-3">
      <dt className="text-faint">{label}</dt>
      <dd className="m-0 text-right font-medium">{value}</dd>
    </div>
  );
}
