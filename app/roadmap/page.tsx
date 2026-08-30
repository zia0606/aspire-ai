"use client";

import Link from "next/link";
import AppNav from "../_components/app-nav";
import { careerCatalog } from "../_lib/career-data";
import { useProfile, useRoadmapProgress } from "../_lib/profile-store";

export default function RoadmapPage() {
  const profile = useProfile();
  const { completed, setCompleted } = useRoadmapProgress(profile?.career ?? "");

  if (!profile) return <NoProfile />;

  const career = careerCatalog[profile.career];
  if (!career) return <NoProfile />;

  const validCompleted = completed.filter((index) => index >= 0 && index < career.roadmap.length);
  const progress = career.roadmap.length
    ? Math.round((validCompleted.length / career.roadmap.length) * 100)
    : 0;
  const nextIndex = career.roadmap.findIndex((_, index) => !validCompleted.includes(index));
  const nextPhase = nextIndex >= 0 ? career.roadmap[nextIndex] : null;
  const matchingSkills = career.skills.filter((skill) => profile.skills.includes(skill));
  const missingSkills = career.skills.filter((skill) => !profile.skills.includes(skill));

  function togglePhase(index: number) {
    const next = validCompleted.includes(index)
      ? validCompleted.filter((item) => item !== index)
      : [...validCompleted, index].sort((a, b) => a - b);
    setCompleted(next);
  }

  return (
    <main className="page-shell">
      <AppNav active="roadmap" />

      <section className="page-container py-10 md:py-14">
        <div className="grid gap-8 border-b border-[var(--line-strong)] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Learning roadmap</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] md:text-6xl">{profile.career}</h1>
            <p className="text-muted mt-4 max-w-3xl text-lg leading-8">{career.summary}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 lg:min-w-[280px]">
            <div>
              <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Career match</p>
              <div className="metric-number mt-2 text-3xl font-semibold">{profile.matchPercentage}%</div>
              <p className="text-faint mt-1 text-xs">saved assessment</p>
            </div>
            <div>
              <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Roadmap</p>
              <div className="metric-number mt-2 text-3xl font-semibold">{progress}%</div>
              <p className="text-faint mt-1 text-xs">live progress</p>
            </div>
          </div>
        </div>

        <section className="grid gap-8 py-9 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Current progress</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
                  {progress === 100 ? "Current roadmap complete" : nextPhase ? `Next: ${nextPhase.title}` : "Start the first phase"}
                </h2>
              </div>
              <span className={progress === 100 ? "status-pill status-pill-success" : "status-pill"}>
                {validCompleted.length}/{career.roadmap.length} phases
              </span>
            </div>
            <div className="progress-track mt-5">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            {nextPhase && (
              <p className="text-muted mt-4 max-w-2xl text-sm leading-6">
                Focus on {nextPhase.topics.slice(0, 3).join(", ")}. Finish the phase by building: {nextPhase.project}
              </p>
            )}
          </div>

          <aside className="panel p-6">
            <p className="section-kicker">Skill coverage</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <span className="metric-number text-3xl font-semibold">{matchingSkills.length}/{career.skills.length}</span>
              <span className="text-faint text-xs">tracked core skills</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {missingSkills.slice(0, 5).map((skill) => (
                <span key={skill} className="status-pill">+ {skill}</span>
              ))}
              {!missingSkills.length && <span className="status-pill status-pill-success">Core skills covered</span>}
            </div>
          </aside>
        </section>

        <section className="border-t border-[var(--line-strong)] pt-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Your learning plan</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Work through the phases in order.</h2>
            </div>
            <p className="text-muted max-w-md text-sm leading-6">
              Mark a phase complete when you can explain the topics and show the project — not just when you have watched the content.
            </p>
          </div>

          <div className="mt-8 border-y border-[var(--line)]">
            {career.roadmap.map((phase, index) => {
              const done = validCompleted.includes(index);
              const current = nextIndex === index;
              return (
                <article key={phase.title} className="grid gap-5 border-b border-[var(--line)] py-7 last:border-b-0 md:grid-cols-[62px_1fr_auto]">
                  <div>
                    <button
                      type="button"
                      onClick={() => togglePhase(index)}
                      aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${phase.title}`}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition ${
                        done
                          ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]"
                          : current
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "border-[var(--line-strong)] bg-[var(--surface)] text-faint"
                      }`}
                    >
                      {done ? "✓" : index + 1}
                    </button>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold tracking-[-0.02em]">{phase.title}</h3>
                      {done && <span className="status-pill status-pill-success">Complete</span>}
                      {!done && current && <span className="status-pill">Current phase</span>}
                    </div>
                    <p className="text-muted mt-3 max-w-3xl leading-7">{phase.description}</p>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.9fr]">
                      <div>
                        <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Topics</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {phase.topics.map((topic) => (
                            <span key={topic} className="status-pill">{topic}</span>
                          ))}
                        </div>
                      </div>
                      <div className="border-l-0 border-[var(--line)] lg:border-l lg:pl-5">
                        <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Portfolio proof</p>
                        <p className="mt-3 text-sm font-medium leading-6">{phase.project}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4 md:block md:text-right">
                    <span className="text-faint text-sm">{phase.duration}</span>
                    <button
                      type="button"
                      onClick={() => togglePhase(index)}
                      className={`mt-0 md:mt-4 ${done ? "button-secondary" : "button-primary"}`}
                    >
                      {done ? "Mark incomplete" : "Mark complete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-10 border-t border-[var(--line-strong)] py-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Skills in your profile</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Already represented</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {matchingSkills.length ? matchingSkills.map((skill) => (
                <span key={skill} className="status-pill status-pill-success">✓ {skill}</span>
              )) : <p className="text-muted text-sm">No tracked core skills match yet.</p>}
            </div>
          </div>
          <div>
            <p className="eyebrow">Skills to develop</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Gaps worth closing</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {missingSkills.length ? missingSkills.map((skill) => (
                <span key={skill} className="status-pill">+ {skill}</span>
              )) : <p className="text-muted text-sm">The tracked core skill list is covered.</p>}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--line-strong)] py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="eyebrow">Need help with the next phase?</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Use the coach for a focused plan, not a generic answer.</h2>
              <p className="text-muted mt-3 max-w-2xl leading-7">The coach receives this same career, skill list and roadmap progress as context.</p>
            </div>
            <Link href="/assistant" className="button-primary">Open coach</Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function NoProfile() {
  return (
    <main className="page-shell">
      <AppNav active="roadmap" />
      <section className="page-container py-20">
        <div className="max-w-2xl border-t border-[var(--line-strong)] pt-8">
          <p className="eyebrow">Roadmap</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">The roadmap needs a target career first.</h1>
          <p className="text-muted mt-4 leading-7">Complete the assessment, save a career profile, and Aspire will map the learning phases for that direction.</p>
          <Link href="/assessment" className="button-primary mt-7">Open assessment</Link>
        </div>
      </section>
    </main>
  );
}
