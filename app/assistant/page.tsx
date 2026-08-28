"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { careerCatalog } from "../_lib/career-data";
import { useProfile, useRoadmapProgress } from "../_lib/profile-store";

type Message = {
  role: "assistant" | "user";
  text: string;
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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi — I’m your Aspire AI career coach. I use the same profile and roadmap as your dashboard. Ask me what to learn, build or improve next.",
    },
  ]);

  const career = profile ? careerCatalog[profile.career] : null;
  const missingSkills = profile && career
    ? career.skills.filter((skill) => !profile.skills.includes(skill))
    : [];

  function answer(question: string) {
    if (!profile || !career) {
      return "Complete the career assessment first. Then I can use your saved career, score, skills, interests and roadmap progress.";
    }

    const lower = question.toLowerCase();
    const validCompleted = completed.filter((index) => index >= 0 && index < career.roadmap.length);
    const nextPhase = career.roadmap.find((_, index) => !validCompleted.includes(index));

    if (lower.includes("learn") || lower.includes("next") || lower.includes("study")) {
      if (nextPhase) {
        return `Your next roadmap phase is “${nextPhase.title}”. Focus first on ${nextPhase.topics.slice(0, 3).join(", ")}. A good milestone is: ${nextPhase.project}.`;
      }
      return `You have completed every current ${profile.career} roadmap phase. Your next move is to deepen your strongest projects, improve documentation, practise interviews and start applying for real opportunities.`;
    }

    if (lower.includes("missing") || lower.includes("gap") || lower.includes("weak") || lower.includes("skill")) {
      if (!missingSkills.length) {
        return `Your profile already contains all of the core skills Aspire AI tracks for ${profile.career}. Now focus on depth: build stronger projects and prove those skills in real work.`;
      }
      return `Your current core skill gaps are: ${missingSkills.join(", ")}. Start with ${missingSkills.slice(0, 2).join(" and ")} instead of trying to learn everything at once.`;
    }

    if (lower.includes("project") || lower.includes("portfolio") || lower.includes("build")) {
      const project = nextPhase?.project ?? career.roadmap[career.roadmap.length - 1]?.project;
      return `Build this next: ${project}. Keep the portfolio case study simple: problem → your approach → tools → screenshots/demo → what you learned → measurable result.`;
    }

    if (lower.includes("match") || lower.includes("score") || lower.includes("percent") || lower.includes("improve")) {
      const biggestGap = missingSkills.slice(0, 3);
      return `Your saved assessment match is ${profile.matchPercentage}%. Dashboard, Roadmap and Assistant do not recalculate it. To improve a future reassessment, build evidence around ${biggestGap.length ? biggestGap.join(", ") : "deeper projects and experience"}, then retake the assessment when your real profile has changed.`;
    }

    if (lower.includes("interview") || lower.includes("job") || lower.includes("internship") || lower.includes("apply")) {
      return `For ${profile.career}, prepare four things: 1) a one-page focused resume, 2) 2–3 strong projects, 3) short explanations of your technical or business decisions, and 4) repeated mock interview practice. Apply to internships and entry-level roles while continuing the roadmap.`;
    }

    if (lower.includes("resume") || lower.includes("cv")) {
      return `For a ${profile.career} resume, lead with relevant skills and projects. For each project, write what you built, the tools you used, and the result. Remove unrelated filler and keep the resume easy to scan.`;
    }

    if (lower.includes("roadmap") || lower.includes("progress")) {
      const progress = career.roadmap.length ? Math.round((validCompleted.length / career.roadmap.length) * 100) : 0;
      return `Your ${profile.career} roadmap is ${progress}% complete: ${validCompleted.length} of ${career.roadmap.length} phases. ${nextPhase ? `Your next phase is “${nextPhase.title}”.` : "You have completed the current roadmap."}`;
    }

    return `For your ${profile.career} goal, the most useful next action is to follow your roadmap in order and turn each phase into visible evidence. Ask me about your next skill, project, match score, roadmap progress, resume or interviews.`;
  }

  function send(question: string) {
    const clean = question.trim();
    if (!clean) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: clean },
      { role: "assistant", text: answer(clean) },
    ]);
    setInput("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(input);
  }

  return (
    <main className="min-h-screen bg-[#050708] px-6 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="brand-mark">A</span>
            <span>Aspire AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white">Dashboard</Link>
            <Link href="/roadmap" className="text-sm text-white/50 hover:text-white">Roadmap</Link>
          </div>
        </header>

        <section className="mt-10 grid flex-1 gap-6 lg:grid-cols-[.72fr_1.28fr]">
          <aside className="card self-start p-6">
            <p className="eyebrow">Career context</p>
            {profile && career ? (
              <>
                <h1 className="mt-3 text-2xl font-bold">{profile.career}</h1>
                <p className="mt-3 text-sm leading-6 text-white/45">{career.summary}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <ContextMetric label="Match" value={`${profile.matchPercentage}%`} />
                  <ContextMetric label="Skills" value={String(profile.skills.length)} />
                  <ContextMetric label="Experience" value={profile.experience} wide />
                  <ContextMetric label="Education" value={profile.education} wide />
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

          <section className="card flex min-h-[650px] flex-col overflow-hidden">
            <div className="border-b border-white/10 p-6">
              <p className="eyebrow">Aspire AI Assistant</p>
              <h2 className="mt-2 text-2xl font-bold">Your career co-pilot</h2>
              <p className="mt-2 text-sm text-white/40">Personalized from the same saved profile used everywhere else.</p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <p className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-cyan-300 text-black" : "border border-white/10 bg-white/[0.04] text-white/75"}`}>
                    {message.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55 transition hover:border-cyan-300/25 hover:text-cyan-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <form onSubmit={submit} className="flex gap-3">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask what you should do next..."
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/40"
                />
                <button type="submit" className="button-primary px-6 py-3">Send</button>
              </form>
            </div>
          </section>
        </section>
      </div>
    </main>
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
