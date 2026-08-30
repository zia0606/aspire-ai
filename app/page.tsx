"use client";

import Link from "next/link";
import { useProfile } from "./_lib/profile-store";

const modules = [
  {
    label: "Assessment",
    title: "Build a career profile that has context.",
    text: "Education, current skills, experience, interests and the direction you want to explore.",
    href: "/assessment",
  },
  {
    label: "Explore",
    title: "Compare career directions before you commit.",
    text: "Browse the career catalog, compare two paths and see profile overlap without changing your saved match.",
    href: "/explore",
  },
  {
    label: "Dashboard",
    title: "Understand the result instead of staring at one score.",
    text: "See your saved career match, skill coverage, readiness, gaps and the next actions worth taking.",
    href: "/dashboard",
  },
  {
    label: "Roadmap",
    title: "Turn the recommendation into a learning plan.",
    text: "Follow practical phases, track progress and build a portfolio project at each stage.",
    href: "/roadmap",
  },
  {
    label: "Resume",
    title: "Check whether your resume supports your target role.",
    text: "Review structure, career keywords, evidence and missing skills without changing your career match.",
    href: "/resume",
  },
  {
    label: "Coach",
    title: "Ask for help when you actually need it.",
    text: "Use your saved profile and roadmap progress as context for practical career guidance.",
    href: "/assistant",
  },
];

export default function HomePage() {
  const profile = useProfile();

  return (
    <main className="page-shell">
      <header className="border-b border-[var(--line)]">
        <div className="page-container flex min-h-[72px] items-center justify-between gap-5">
          <Link href="/" className="brand-lockup">
            <span className="brand-mark">A</span>
            <span className="brand-copy">
              <strong>Aspire</strong>
              <small>career workspace</small>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <a href="#how" className="product-link">How it works</a>
            <Link href="/explore" className="product-link">Explore careers</Link>
            <Link href="/assessment" className="product-link">Assessment</Link>
            {profile && <Link href="/dashboard" className="product-link">Dashboard</Link>}
          </nav>

          <Link href="/assessment" className="button-primary">
            Take assessment
          </Link>
        </div>
      </header>

      <section className="page-container grid gap-12 py-16 md:py-24 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
        <div>
          <p className="eyebrow">Career planning, without the guesswork</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] md:text-7xl">
            Work out where you fit. Then build toward it.
          </h1>
          <p className="text-muted mt-7 max-w-2xl text-lg leading-8 md:text-xl">
            Aspire connects a structured assessment with career exploration, a learning roadmap, resume review and career coach. The tools share your profile, but each signal keeps a clear meaning.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/assessment" className="button-primary px-6 py-3.5">
              Start or review assessment
            </Link>
            <Link href="/explore" className="button-secondary px-6 py-3.5">
              Explore careers
            </Link>
          </div>

          <p className="text-faint mt-5 text-sm">
            Browse freely. Explorer never changes your saved assessment result.
          </p>
        </div>

        <aside className="border-l border-[var(--line-strong)] pl-0 lg:pl-10">
          <p className="section-kicker">The workflow</p>
          <ol className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {[
              ["01", "Assess", "Describe your current position and target direction."],
              ["02", "Explore", "Compare alternatives without rewriting your saved profile."],
              ["03", "Understand", "See fit, strengths, gaps and readiness separately."],
              ["04", "Build", "Follow the roadmap and turn progress into proof."],
            ].map(([number, title, text]) => (
              <li key={number} className="grid grid-cols-[48px_1fr] gap-4 py-5">
                <span className="text-faint text-sm font-semibold">{number}</span>
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="text-muted mt-1 text-sm leading-6">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      {profile && (
        <section className="border-y border-[var(--line)] bg-[var(--surface)]">
          <div className="page-container flex flex-col justify-between gap-6 py-7 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
              <div>
                <p className="text-sm font-semibold">You already have a saved profile</p>
                <p className="text-muted mt-1 text-sm">
                  {profile.career} · {profile.matchPercentage}% saved career match · {profile.skills.length} selected skills
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/explore" className="button-secondary">Compare directions</Link>
              <Link href="/assessment" className="button-secondary">Review assessment</Link>
              <Link href="/dashboard" className="button-primary">Open dashboard</Link>
            </div>
          </div>
        </section>
      )}

      <section id="how" className="page-container py-20 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="eyebrow">How Aspire works</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] md:text-4xl">
              One profile. Several tools. No mystery hand-offs.
            </h2>
          </div>

          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {[
              ["Assessment creates the profile", "Your five assessment dimensions are the only source for the saved career-match result."],
              ["Explorer stays exploratory", "Profile overlap helps compare alternatives, but it is never stored as a second career-match score."],
              ["Progress stays separate", "Roadmap completion and readiness can change as you work. They do not rewrite your assessment score."],
              ["Resume analysis is its own signal", "Your resume score checks the document itself. It is not treated as a new career match."],
              ["The coach reads context", "The coach can use your saved career, skills and roadmap state, but it does not own the underlying profile."],
            ].map(([title, text], index) => (
              <article key={title} className="grid gap-3 py-6 sm:grid-cols-[42px_1fr]">
                <span className="text-faint text-sm font-semibold">0{index + 1}</span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-muted mt-2 max-w-2xl leading-7">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workspace" className="border-y border-[var(--line)] bg-[var(--surface)]">
        <div className="page-container py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">Your workspace</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] md:text-4xl">
              Six focused tools, each with a clear job.
            </h2>
          </div>

          <div className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {modules.map((module) => (
              <Link
                key={module.label}
                href={module.href}
                className="group grid gap-3 py-6 text-left no-underline transition sm:grid-cols-[150px_1fr_auto] sm:items-center"
              >
                <span className="text-accent text-sm font-bold">{module.label}</span>
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.02em] group-hover:text-[var(--accent)]">{module.title}</h3>
                  <p className="text-muted mt-1 max-w-2xl text-sm leading-6">{module.text}</p>
                </div>
                <span className="text-faint hidden text-xl transition group-hover:translate-x-1 sm:block">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-20 md:py-24">
        <div className="grid gap-8 border-t border-[var(--line-strong)] pt-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow">Explore, then decide</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-4xl">
              Comparing a path should not silently choose it for you.
            </h2>
            <p className="text-muted mt-4 max-w-xl leading-7">
              Use Career Explorer to inspect alternatives. Use Assessment when you want to make a target direction official across the dashboard, roadmap, resume and coach.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/explore" className="button-secondary px-6 py-3.5">Explore careers</Link>
            <Link href="/assessment" className="button-primary px-6 py-3.5">Open assessment</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)]">
        <div className="page-container flex flex-col justify-between gap-3 py-7 text-sm sm:flex-row">
          <span className="font-semibold">Aspire AI</span>
          <span className="text-faint">Career planning workspace · 2026</span>
        </div>
      </footer>
    </main>
  );
}
