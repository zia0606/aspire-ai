"use client";

import Link from "next/link";
import { useProfile } from "./_lib/profile-store";

const features = [
  ["01", "Career assessment", "Build a structured profile from your education, skills, career goal, experience and interests."],
  ["02", "One match score", "Your assessment calculates one score. Dashboard, Roadmap and Assistant all read that exact saved result."],
  ["03", "Skill-gap analysis", "See which core skills already align with your target career and which ones deserve attention next."],
  ["04", "Personal roadmap", "Follow practical phases, portfolio projects and progress tracking for your selected career."],
  ["05", "Career assistant", "Ask what to learn next, what to build, how to improve and how to prepare for opportunities."],
  ["06", "Persistent progress", "Your profile and roadmap progress stay connected across the app on the same browser."],
];

export default function HomePage() {
  const profile = useProfile();

  return (
    <main className="min-h-screen overflow-hidden bg-[#050708] text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="brand-mark">A</span>
          <span>
            <span className="block font-semibold">Aspire AI</span>
            <span className="block text-[10px] tracking-[0.25em] text-white/35">CAREER INTELLIGENCE</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <a href="#features" className="text-sm text-white/55 hover:text-white">Features</a>
          <a href="#flow" className="text-sm text-white/55 hover:text-white">How it works</a>
          {profile && <Link href="/roadmap" className="text-sm text-white/55 hover:text-white">Roadmap</Link>}
          <Link href={profile ? "/dashboard" : "/assessment"} className="button-primary px-6 py-3 text-sm">
            {profile ? "Open dashboard →" : "Start assessment →"}
          </Link>
        </nav>

        <Link href={profile ? "/dashboard" : "/assessment"} className="button-primary px-5 py-2.5 text-sm md:hidden">
          {profile ? "Dashboard" : "Get started"}
        </Link>
      </header>

      <section className="relative">
        <div className="grid-background pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[540px] w-[760px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[130px]" />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:px-10 md:pb-32 md:pt-28">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              One profile. One score. One connected career system.
            </div>

            <h1 className="mt-8 text-5xl font-bold leading-[1.03] tracking-tight md:text-7xl lg:text-8xl">
              Stop guessing.
              <br />
              <span className="gradient-text">Build your future.</span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/50 md:text-xl">
              Aspire AI turns your real profile into a career match, skill-gap analysis, practical learning roadmap and personalized career guidance — all using the same connected data.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href={profile ? "/dashboard" : "/assessment"} className="button-primary px-8 py-4 text-center">
                {profile ? `Continue as ${profile.career} →` : "Start your assessment →"}
              </Link>
              <a href="#flow" className="button-secondary px-8 py-4 text-center">See how it works</a>
            </div>
          </div>

          <div className="mt-20 grid max-w-4xl gap-4 sm:grid-cols-3">
            <div className="card p-6">
              <div className="text-3xl font-bold text-cyan-300">5</div>
              <div className="mt-2 text-sm text-white/40">Profile dimensions</div>
            </div>
            <div className="card p-6">
              <div className="text-3xl font-bold text-cyan-300">1</div>
              <div className="mt-2 text-sm text-white/40">Permanent match result</div>
            </div>
            <div className="card p-6">
              <div className="text-3xl font-bold text-cyan-300">4</div>
              <div className="mt-2 text-sm text-white/40">Connected career phases</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-white/5 bg-white/[0.012]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <p className="eyebrow">Platform features</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">Everything follows the same source of truth.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-white/45">No duplicate score logic. No separate roadmap profile. No disconnected assistant.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(([number, title, text]) => (
              <article key={number} className="card p-7">
                <div className="text-sm font-bold text-cyan-300">{number}</div>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-white/45">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="flow" className="mx-auto max-w-7xl px-6 py-24 md:px-10">
        <div className="text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">One clean flow from start to finish.</h2>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-4">
          {[
            ["01", "Assessment", "Choose your education, skills, career, experience and interests."],
            ["02", "Dashboard", "See the exact saved match score, strengths, gaps and roadmap progress."],
            ["03", "Roadmap", "Complete career-specific learning phases and portfolio projects."],
            ["04", "Assistant", "Get guidance using the same saved profile and roadmap progress."],
          ].map(([number, title, text]) => (
            <article key={number} className="card p-7">
              <div className="text-sm font-bold text-cyan-300">{number}</div>
              <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
              <p className="mt-4 leading-7 text-white/45">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:px-10">
          <div className="rounded-[2rem] border border-cyan-300/10 bg-gradient-to-br from-cyan-300/[0.06] to-violet-400/[0.04] p-10 md:p-16">
            <p className="eyebrow">Aspire AI</p>
            <h2 className="mt-5 text-4xl font-bold md:text-5xl">
              {profile ? "Your career journey is waiting." : "Your future needs a plan."}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/45">
              {profile ? `Continue your ${profile.career} roadmap, review your ${profile.matchPercentage}% match, or ask the assistant what to do next.` : "Build your profile once and let every part of Aspire AI work from the same result."}
            </p>
            <Link href={profile ? "/dashboard" : "/assessment"} className="button-primary mt-8 px-8 py-4">
              {profile ? "Continue my journey →" : "Build my career profile →"}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-white/30">
        © 2026 Aspire AI · Career intelligence for your next move.
      </footer>
    </main>
  );
}
