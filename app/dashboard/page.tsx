"use client";

import Link from "next/link";
import { careerCatalog, getMatchLabel } from "../_lib/career-data";
import { useProfile, useRoadmapProgress } from "../_lib/profile-store";

export default function DashboardPage() {
  const profile = useProfile();
  const { completed } = useRoadmapProgress(profile?.career ?? "");

  if (!profile) {
    return <EmptyProfile />;
  }

  const career = careerCatalog[profile.career];
  if (!career) {
    return <EmptyProfile />;
  }

  const score = profile.matchPercentage;
  const matchingSkills = career.skills.filter((skill) => profile.skills.includes(skill));
  const missingSkills = career.skills.filter((skill) => !profile.skills.includes(skill));
  const validCompleted = completed.filter((index) => index >= 0 && index < career.roadmap.length);
  const roadmapProgress = career.roadmap.length
    ? Math.round((validCompleted.length / career.roadmap.length) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-[#050708] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Header />

        <section className="mt-12 md:mt-16">
          <p className="eyebrow">Career dashboard</p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Your direction is clear.</h1>
              <p className="mt-4 max-w-2xl leading-7 text-white/50">
                One profile powers everything below. Your assessment score is never recalculated by this page.
              </p>
            </div>
            <Link href="/assessment" className="button-secondary px-6 py-3">Retake assessment</Link>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <article className="card overflow-hidden p-7 md:p-10">
            <div className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-2 text-sm font-semibold text-cyan-200">
              Best-fit career
            </div>
            <h2 className="mt-6 text-4xl font-bold md:text-6xl">{profile.career}</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/50">{career.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/roadmap" className="button-primary px-7 py-3">View my roadmap →</Link>
              <Link href="/assistant" className="button-secondary px-7 py-3">Ask Aspire AI</Link>
            </div>
          </article>

          <article className="card flex flex-col items-center justify-center p-8 text-center">
            <div
              className="flex h-48 w-48 items-center justify-center rounded-full"
              style={{
                background: `radial-gradient(circle, #090d10 61%, transparent 63%), conic-gradient(#67e8f9 ${score}%, rgba(255,255,255,.07) 0)`,
              }}
            >
              <div>
                <div className="text-5xl font-bold text-cyan-300">{score}%</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-white/35">Career match</div>
              </div>
            </div>
            <p className="mt-5 font-semibold text-cyan-200">{getMatchLabel(score)}</p>
            <p className="mt-2 text-sm text-white/35">Saved by your assessment</p>
          </article>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-4">
          <Metric label="Education" value={profile.education} />
          <Metric label="Experience" value={profile.experience} />
          <Metric label="Skills selected" value={String(profile.skills.length)} />
          <Metric label="Interests selected" value={String(profile.interests.length)} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <SkillCard
            title="Matching skills"
            subtitle={`${matchingSkills.length} core skills already aligned`}
            skills={matchingSkills}
            empty="You are starting from the foundation — that is okay."
            positive
          />
          <SkillCard
            title="Skills to build next"
            subtitle={`${missingSkills.length} gaps from your target career`}
            skills={missingSkills}
            empty="You already cover the core skill list."
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <article className="card p-7">
            <p className="eyebrow">Score breakdown</p>
            <div className="mt-6 space-y-5">
              <ScoreRow label="Education fit" value={profile.matchBreakdown.education} max={25} />
              <ScoreRow label="Relevant skills" value={profile.matchBreakdown.skills} max={45} />
              <ScoreRow label="Interest alignment" value={profile.matchBreakdown.interests} max={20} />
              <ScoreRow label="Experience" value={profile.matchBreakdown.experience} max={10} />
            </div>
          </article>

          <article className="card p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Roadmap progress</p>
                <h2 className="mt-3 text-3xl font-bold">{roadmapProgress}% complete</h2>
                <p className="mt-2 text-white/40">{validCompleted.length} of {career.roadmap.length} phases finished</p>
              </div>
              <Link href="/roadmap" className="button-primary px-6 py-3">Continue roadmap →</Link>
            </div>
            <div className="mt-7 h-3 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all" style={{ width: `${roadmapProgress}%` }} />
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {career.roadmap.map((item, index) => (
                <div key={item.title} className={`rounded-2xl border p-4 ${validCompleted.includes(index) ? "border-cyan-300/15 bg-cyan-300/[0.05]" : "border-white/10 bg-white/[0.02]"}`}>
                  <div className="text-xs text-white/30">Phase {index + 1}</div>
                  <div className="mt-1 font-semibold">{item.title}</div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <footer className="mt-12 border-t border-white/5 py-8 text-center text-sm text-white/30">
          Aspire AI · One profile · One score · One roadmap
        </footer>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3 font-semibold">
        <span className="brand-mark">A</span>
        <span>Aspire AI</span>
      </Link>
      <nav className="flex items-center gap-3">
        <Link href="/roadmap" className="text-sm text-white/50 hover:text-white">Roadmap</Link>
        <Link href="/assistant" className="text-sm text-white/50 hover:text-white">Assistant</Link>
      </nav>
    </header>
  );
}

function EmptyProfile() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050708] px-6 text-white">
      <section className="card max-w-xl p-10 text-center">
        <div className="brand-mark mx-auto">A</div>
        <p className="eyebrow mt-6">No profile yet</p>
        <h1 className="mt-4 text-3xl font-bold">Complete your assessment first.</h1>
        <p className="mt-4 leading-7 text-white/45">The dashboard only works from one saved Aspire AI profile.</p>
        <Link href="/assessment" className="button-primary mt-8 px-7 py-3">Start assessment →</Link>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="card p-5">
      <p className="text-xs uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-2 font-semibold text-white/85">{value}</p>
    </article>
  );
}

function SkillCard({
  title,
  subtitle,
  skills,
  empty,
  positive = false,
}: {
  title: string;
  subtitle: string;
  skills: string[];
  empty: string;
  positive?: boolean;
}) {
  return (
    <article className="card p-7">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-white/35">{subtitle}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {skills.length ? skills.map((skill) => (
          <span key={skill} className={`rounded-full border px-3 py-2 text-sm ${positive ? "border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-100" : "border-violet-300/15 bg-violet-300/[0.06] text-violet-100"}`}>
            {positive ? "✓" : "+"} {skill}
          </span>
        )) : <p className="text-sm text-white/35">{empty}</p>}
      </div>
    </article>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/50">{label}</span>
        <strong>{value}/{max}</strong>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-cyan-300" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
