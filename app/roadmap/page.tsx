"use client";

import Link from "next/link";
import { careerCatalog } from "../_lib/career-data";
import { useProfile, useRoadmapProgress } from "../_lib/profile-store";

export default function RoadmapPage() {
  const profile = useProfile();
  const { completed, setCompleted } = useRoadmapProgress(profile?.career ?? "");

  if (!profile) {
    return <NoProfile />;
  }

  const career = careerCatalog[profile.career];
  if (!career) {
    return <NoProfile />;
  }

  const validCompleted = completed.filter((index) => index >= 0 && index < career.roadmap.length);
  const progress = career.roadmap.length
    ? Math.round((validCompleted.length / career.roadmap.length) * 100)
    : 0;

  function togglePhase(index: number) {
    const next = validCompleted.includes(index)
      ? validCompleted.filter((item) => item !== index)
      : [...validCompleted, index].sort((a, b) => a - b);
    setCompleted(next);
  }

  return (
    <main className="min-h-screen bg-[#050708] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="brand-mark">A</span>
            <span>Aspire AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white">Dashboard</Link>
            <Link href="/assistant" className="text-sm text-white/50 hover:text-white">Assistant</Link>
          </div>
        </header>

        <section className="mt-12 md:mt-16">
          <p className="eyebrow">Personalized roadmap</p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{profile.career}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-white/50">{career.summary}</p>
            </div>
            <div className="card min-w-56 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Career match</span>
                <strong className="text-cyan-300">{profile.matchPercentage}%</strong>
              </div>
              <p className="mt-2 text-xs text-white/30">Read directly from your assessment</p>
            </div>
          </div>
        </section>

        <section className="card mt-8 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Roadmap progress</p>
              <h2 className="mt-2 text-3xl font-bold">{progress}% complete</h2>
              <p className="mt-2 text-sm text-white/40">{validCompleted.length} of {career.roadmap.length} phases completed</p>
            </div>
            {progress === 100 ? (
              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-sm font-semibold text-cyan-200">Roadmap completed ✓</div>
            ) : (
              <div className="text-sm text-white/35">Keep going — one phase at a time.</div>
            )}
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <SkillPanel title="Skills already in your profile" skills={career.skills.filter((skill) => profile.skills.includes(skill))} positive />
          <SkillPanel title="Skills to develop" skills={career.skills.filter((skill) => !profile.skills.includes(skill))} />
        </section>

        <section className="mt-12">
          <p className="eyebrow">Learning journey</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Follow the phases in order.</h2>
          <div className="mt-7 space-y-5">
            {career.roadmap.map((item, index) => {
              const done = validCompleted.includes(index);
              return (
                <article key={item.title} className={`card p-6 transition md:p-8 ${done ? "border-cyan-300/25 bg-cyan-300/[0.05]" : ""}`}>
                  <div className="flex flex-col gap-6 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => togglePhase(index)}
                      aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${item.title}`}
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border font-bold transition ${done ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/10 bg-white/[0.03] text-cyan-300"}`}
                    >
                      {done ? "✓" : index + 1}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Phase {index + 1}</p>
                          <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
                        </div>
                        <span className="text-sm text-white/35">{item.duration}</span>
                      </div>
                      <p className="mt-4 max-w-3xl leading-7 text-white/45">{item.description}</p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {item.topics.map((topic) => (
                          <span key={topic} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/55">{topic}</span>
                        ))}
                      </div>

                      <div className="mt-5 rounded-2xl border border-violet-300/10 bg-violet-300/[0.04] p-4">
                        <p className="text-xs uppercase tracking-wider text-violet-200/70">Portfolio project</p>
                        <p className="mt-2 font-medium text-white/80">{item.project}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => togglePhase(index)}
                        className={`mt-5 rounded-full px-5 py-2.5 text-sm font-semibold transition ${done ? "border border-cyan-300/20 bg-cyan-300/10 text-cyan-200" : "bg-cyan-300 text-black hover:bg-cyan-200"}`}
                      >
                        {done ? "Completed ✓" : "Mark phase complete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-violet-300/15 bg-violet-300/[0.04] p-7 md:p-9">
          <p className="eyebrow">Need guidance?</p>
          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Ask Aspire AI what to do next.</h2>
              <p className="mt-2 text-white/45">The assistant reads this same career, score, skills and progress.</p>
            </div>
            <Link href="/assistant" className="button-primary px-7 py-3">Open Assistant →</Link>
          </div>
        </section>

        <footer className="mt-12 border-t border-white/5 py-8 text-center text-sm text-white/30">
          Assessment match: {profile.matchPercentage}% · Roadmap progress: {progress}% · These are intentionally separate.
        </footer>
      </div>
    </main>
  );
}

function SkillPanel({ title, skills, positive = false }: { title: string; skills: string[]; positive?: boolean }) {
  return (
    <article className="card p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        {skills.length ? skills.map((skill) => (
          <span key={skill} className={`rounded-full border px-3 py-2 text-sm ${positive ? "border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-100" : "border-violet-300/15 bg-violet-300/[0.06] text-violet-100"}`}>
            {positive ? "✓" : "+"} {skill}
          </span>
        )) : <span className="text-sm text-white/35">None right now.</span>}
      </div>
    </article>
  );
}

function NoProfile() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050708] px-6 text-white">
      <section className="card max-w-xl p-10 text-center">
        <div className="brand-mark mx-auto">A</div>
        <p className="eyebrow mt-6">Roadmap unavailable</p>
        <h1 className="mt-4 text-3xl font-bold">Create your career profile first.</h1>
        <p className="mt-4 leading-7 text-white/45">Your roadmap is generated from the career selected in the assessment.</p>
        <Link href="/assessment" className="button-primary mt-8 px-7 py-3">Start assessment →</Link>
      </section>
    </main>
  );
}
