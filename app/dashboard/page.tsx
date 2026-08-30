"use client";

import Link from "next/link";
import AppNav from "../_components/app-nav";
import { careerCatalog, getMatchLabel } from "../_lib/career-data";
import { useProfile, useRoadmapProgress } from "../_lib/profile-store";

export default function DashboardPage() {
  const profile = useProfile();
  const { completed } = useRoadmapProgress(profile?.career ?? "");

  if (!profile) return <EmptyProfile />;

  const career = careerCatalog[profile.career];
  if (!career) return <EmptyProfile />;

  const matchingSkills = career.skills.filter((skill) => profile.skills.includes(skill));
  const missingSkills = career.skills.filter((skill) => !profile.skills.includes(skill));
  const validCompleted = completed.filter((index) => index >= 0 && index < career.roadmap.length);
  const roadmapProgress = career.roadmap.length
    ? Math.round((validCompleted.length / career.roadmap.length) * 100)
    : 0;
  const skillCoverage = career.skills.length
    ? Math.round((matchingSkills.length / career.skills.length) * 100)
    : 0;
  const experienceReadiness = Math.round((profile.matchBreakdown.experience / 10) * 100);
  const interestAlignment = Math.round((profile.matchBreakdown.interests / 20) * 100);
  const readinessIndex = Math.min(
    100,
    Math.round(skillCoverage * 0.45 + roadmapProgress * 0.35 + experienceReadiness * 0.2),
  );
  const nextPhaseIndex = career.roadmap.findIndex((_, index) => !validCompleted.includes(index));
  const nextPhase = nextPhaseIndex >= 0 ? career.roadmap[nextPhaseIndex] : null;
  const actions = buildActions({
    career: profile.career,
    missingSkills,
    nextPhaseTitle: nextPhase?.title,
    nextProject: nextPhase?.project,
    roadmapProgress,
  });

  return (
    <main className="page-shell">
      <AppNav active="dashboard" />

      <section className="page-container py-10 md:py-14">
        <div className="flex flex-col justify-between gap-6 border-b border-[var(--line-strong)] pb-8 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Career dashboard</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] md:text-6xl">
              {profile.career}
            </h1>
            <p className="text-muted mt-4 max-w-3xl text-lg leading-8">{career.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/assessment" className="button-secondary">Review assessment</Link>
            <Link href="/roadmap" className="button-primary">Continue roadmap</Link>
          </div>
        </div>

        <section className="grid border-b border-[var(--line)] md:grid-cols-4">
          <Signal
            label="Career match"
            value={`${profile.matchPercentage}%`}
            note={`${getMatchLabel(profile.matchPercentage)} · saved by assessment`}
            stable
          />
          <Signal
            label="Readiness"
            value={`${readinessIndex}%`}
            note="Skills + roadmap + experience"
          />
          <Signal
            label="Skill coverage"
            value={`${skillCoverage}%`}
            note={`${matchingSkills.length} of ${career.skills.length} tracked skills`}
          />
          <Signal
            label="Roadmap"
            value={`${roadmapProgress}%`}
            note={`${validCompleted.length} of ${career.roadmap.length} phases complete`}
          />
        </section>

        <section className="grid gap-10 py-10 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Priority briefing</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] md:text-3xl">What to do next</h2>
              </div>
              <Link href="/assistant" className="text-accent text-sm font-semibold no-underline">Ask the coach →</Link>
            </div>

            <div className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {actions.map((action, index) => (
                <article key={action.title} className="grid gap-4 py-5 sm:grid-cols-[46px_1fr_auto] sm:items-start">
                  <span className="text-faint text-sm font-semibold">0{index + 1}</span>
                  <div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-muted mt-1 max-w-2xl text-sm leading-6">{action.text}</p>
                  </div>
                  <Link href={action.href} className="text-accent text-sm font-semibold no-underline">Open →</Link>
                </article>
              ))}
            </div>
          </div>

          <aside className="panel p-6">
            <p className="section-kicker">Profile snapshot</p>
            <dl className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
              <SnapshotRow label="Education" value={profile.education} />
              <SnapshotRow label="Experience" value={profile.experience} />
              <SnapshotRow label="Interests" value={`${profile.interests.length} selected`} />
              <SnapshotRow label="Skills" value={`${profile.skills.length} selected`} />
              <SnapshotRow label="Last updated" value={formatDate(profile.updatedAt)} />
            </dl>
            <p className="text-faint mt-5 text-xs leading-5">
              The saved career match only changes when you finish and save the assessment again.
            </p>
          </aside>
        </section>

        <section className="grid gap-10 border-t border-[var(--line-strong)] py-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Skill map</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">What already aligns</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {matchingSkills.length ? matchingSkills.map((skill) => (
                <span key={skill} className="status-pill status-pill-success">✓ {skill}</span>
              )) : <p className="text-muted text-sm">No tracked core skills match yet.</p>}
            </div>
          </div>

          <div>
            <p className="eyebrow">Skill gaps</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">What would strengthen the profile</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {missingSkills.length ? missingSkills.map((skill) => (
                <span key={skill} className="status-pill">+ {skill}</span>
              )) : <p className="text-muted text-sm">All tracked core skills are already represented.</p>}
            </div>
          </div>
        </section>

        <section className="grid gap-10 border-t border-[var(--line-strong)] py-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="eyebrow">Assessment evidence</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Why the saved match is {profile.matchPercentage}%</h2>
            <p className="text-muted mt-3 text-sm leading-6">
              These four values were saved when the assessment was completed. Dashboard progress does not rewrite them.
            </p>

            <div className="mt-6 space-y-5">
              <BreakdownRow label="Education fit" value={profile.matchBreakdown.education} max={25} />
              <BreakdownRow label="Relevant skills" value={profile.matchBreakdown.skills} max={45} />
              <BreakdownRow label="Interest alignment" value={profile.matchBreakdown.interests} max={20} />
              <BreakdownRow label="Experience" value={profile.matchBreakdown.experience} max={10} />
            </div>
          </div>

          <div>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Learning plan</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Roadmap status</h2>
              </div>
              <Link href="/roadmap" className="button-secondary">Open full roadmap</Link>
            </div>

            <div className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {career.roadmap.map((phase, index) => {
                const done = validCompleted.includes(index);
                const next = nextPhaseIndex === index;
                return (
                  <div key={phase.title} className="grid gap-3 py-4 sm:grid-cols-[42px_1fr_auto] sm:items-center">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${done ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]" : next ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--line-strong)] text-faint"}`}>
                      {done ? "✓" : index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{phase.title}</h3>
                      <p className="text-faint mt-1 text-xs">{phase.duration}</p>
                    </div>
                    <span className={`text-xs font-semibold ${done ? "text-[var(--success)]" : next ? "text-[var(--accent)]" : "text-faint"}`}>
                      {done ? "Complete" : next ? "Next" : "Upcoming"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--line-strong)] py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="eyebrow">Application readiness</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Does your resume actually support this direction?</h2>
              <p className="text-muted mt-3 max-w-2xl leading-7">
                The Resume Analyzer checks the document separately from your career assessment, so you can improve how your experience is presented without changing your saved career match.
              </p>
            </div>
            <Link href="/resume" className="button-primary px-6 py-3.5">Review resume</Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function Signal({ label, value, note, stable = false }: { label: string; value: string; note: string; stable?: boolean }) {
  return (
    <article className="border-[var(--line)] py-6 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0">
      <div className="flex items-center gap-2">
        <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">{label}</p>
        {stable && <span className="status-pill px-2 py-0.5 text-[10px]">Saved</span>}
      </div>
      <div className="metric-number mt-3 text-4xl font-semibold">{value}</div>
      <p className="text-muted mt-2 text-xs leading-5">{note}</p>
    </article>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[105px_1fr] gap-3 py-3">
      <dt className="text-faint">{label}</dt>
      <dd className="m-0 text-right font-medium">{value}</dd>
    </div>
  );
}

function BreakdownRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted">{label}</span>
        <strong>{value}/{max}</strong>
      </div>
      <div className="progress-track mt-2">
        <div className="progress-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyProfile() {
  return (
    <main className="page-shell">
      <AppNav active="dashboard" />
      <section className="page-container py-20">
        <div className="max-w-2xl border-t border-[var(--line-strong)] pt-8">
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">There is no saved career profile yet.</h1>
          <p className="text-muted mt-4 leading-7">Complete the assessment first. The dashboard reads the saved result; it does not create a separate profile.</p>
          <Link href="/assessment" className="button-primary mt-7">Open assessment</Link>
        </div>
      </section>
    </main>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function buildActions({
  career,
  missingSkills,
  nextPhaseTitle,
  nextProject,
  roadmapProgress,
}: {
  career: string;
  missingSkills: string[];
  nextPhaseTitle?: string;
  nextProject?: string;
  roadmapProgress: number;
}) {
  const firstSkill = missingSkills[0];
  const secondSkill = missingSkills[1];

  const actions = [
    firstSkill
      ? {
          title: `Strengthen ${firstSkill}`,
          text: `It is the first missing core skill in the current ${career} profile. Add it through real practice, not just by selecting it in a future assessment.`,
          href: "/roadmap",
        }
      : {
          title: "Deepen the skills you already list",
          text: "Core skill coverage is strong. The next gain comes from projects, depth and evidence rather than adding more labels.",
          href: "/roadmap",
        },
    nextPhaseTitle
      ? {
          title: `Continue: ${nextPhaseTitle}`,
          text: nextProject ? `Use the phase project as proof of progress: ${nextProject}` : "Complete the next roadmap phase before jumping ahead.",
          href: "/roadmap",
        }
      : {
          title: "Turn completed learning into proof",
          text: "Your current roadmap is complete. Improve documentation, portfolio quality and interview explanations.",
          href: "/resume",
        },
    roadmapProgress < 50 && secondSkill
      ? {
          title: `Keep ${secondSkill} on deck`,
          text: "Do not learn every gap at once. Finish the current roadmap work, then use this as the next skill focus.",
          href: "/roadmap",
        }
      : {
          title: "Check how the profile reads on a resume",
          text: "Use the resume workspace to see whether the skills and projects you have built are actually visible in the document.",
          href: "/resume",
        },
  ];

  return actions;
}
