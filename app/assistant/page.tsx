"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
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
  "Which skills am I missing?",
  "Give me a project idea",
  "How can I improve my match?",
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
      text: "Hi — I am your Aspire AI career coach. I use the same saved profile, match score and roadmap as your dashboard. Ask me what to learn, build or improve next.",
    },
  ]);

  const career = profile ? careerCatalog[profile.career] : null;
  const validCompleted = career
    ? completed.filter((index) => index >= 0 && index < career.roadmap.length)
    : [];
  const roadmapProgress = career?.roadmap.length
    ? Math.round((validCompleted.length / career.roadmap.length) * 100)
    : 0;

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
          text: "Complete the career assessment first. Then I can use your saved career, score, skills, interests and roadmap progress.",
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
      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.answer as string },
      ]);
    } catch (error) {
      console.error("Aspire AI assistant request failed:", error);
      setMode(null);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I could not reach the assistant service just now. Your saved profile and roadmap are safe. Try the question again in a moment.",
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
    <main className="min-h-screen bg-[#050708] px-6 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="brand-mark">A</span>
            <span>Aspire AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white">Dashboard</Link>
            <Link href="/roadmap" className="text-sm text-white/50 hover:text-white">Roadmap</Link>
          </div>
        </header>

        <section className="mt-10 grid flex-1 gap-6 lg:grid-cols-[.72fr_1.28fr]">
          <aside className="card self-start p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">Career context</p>
              <ModeBadge mode={mode} />
            </div>

            {profile && career ? (
              <>
                <h1 className="mt-4 text-2xl font-bold">{profile.career}</h1>
                <p className="mt-3 text-sm leading-6 text-white/45">{career.summary}</p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <ContextMetric label="Career match" value={`${profile.matchPercentage}%`} />
                  <ContextMetric label="Roadmap" value={`${roadmapProgress}%`} />
                  <ContextMetric label="Skills" value={String(profile.skills.length)} />
                  <ContextMetric label="Interests" value={String(profile.interests.length)} />
                  <ContextMetric label="Experience" value={profile.experience} wide />
                  <ContextMetric label="Education" value={profile.education} wide />
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-xs uppercase tracking-wider text-white/30">Next roadmap phase</p>
                  <p className="mt-2 text-sm font-semibold text-cyan-100">
                    {career.roadmap.find((_, index) => !validCompleted.includes(index))?.title ?? "All current phases complete"}
                  </p>
                </div>

                <Link href="/assessment" className="button-secondary mt-6 w-full px-5 py-3">Update profile</Link>
              </>
            ) : (
              <>
                <h1 className="mt-3 text-2xl font-bold">No profile yet</h1>
                <p className="mt-3 text-sm leading-6 text-white/45">Complete the assessment before asking for personalized guidance.</p>
                <Link href="/assessment" className="button-primary mt-6 w-full px-5 py-3">Start assessment →</Link>
              </>
            )}
          </aside>

          <section className="card flex min-h-[680px] flex-col overflow-hidden">
            <div className="border-b border-white/10 p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="eyebrow">Aspire AI Assistant</p>
                  <h2 className="mt-2 text-2xl font-bold">Your career co-pilot</h2>
                  <p className="mt-2 text-sm text-white/40">
                    Uses the exact profile, match score and roadmap shown across Aspire AI.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/45">
                  {isSending ? "Thinking..." : mode === "ai" ? "AI connected" : mode === "local" ? "Smart local mode" : "Ready"}
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6" aria-live="polite">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-cyan-300 text-black"
                        : "border border-white/10 bg-white/[0.04] text-white/75"
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/45">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                    Aspire AI is thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={isSending}
                    onClick={() => void send(suggestion)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55 transition hover:border-cyan-300/25 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="flex gap-3">
                <input
                  value={input}
                  disabled={isSending}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask what you should do next..."
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/40 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="button-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function ModeBadge({ mode }: { mode: AssistantMode }) {
  if (!mode) return null;
  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
      mode === "ai"
        ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200"
        : "border-violet-300/20 bg-violet-300/[0.08] text-violet-200"
    }`}>
      {mode === "ai" ? "AI" : "Local"}
    </span>
  );
}

function ContextMetric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.025] p-4 ${wide ? "col-span-2" : ""}`}>
      <p className="text-xs uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white/80">{value}</p>
    </div>
  );
}
