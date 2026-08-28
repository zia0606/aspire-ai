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
  const skillCoverage = career.skills.length
    ? Math.round((matchingSkills.length / career.skills.length) * 100)
    : 0;
  const experienceReadiness = Math.round((profile.matchBreakdown.experience / 10) * 100);
  const interestAlignment = Math.round((profile.matchBreakdown.interests / 20) * 100);
  const educationAlignment = Math.round((profile.matchBreakdown.education / 25) * 100);
  const readinessIndex = Math.min(
    100,
    Math.round(skillCoverage * 0.45 + roadmapProgress * 0.35 + experienceReadiness * 0.2),
  );
  const nextPhaseIndex = career.roadmap.findIndex((_, index) => !validCompleted.includes(index));
  const nextPhase = nextPhaseIndex >= 0 ? career.roadmap[nextPhaseIndex] : null;
  const readinessLabel = getReadinessLabel(readinessIndex);
  const momentumLabel = getMomentumLabel(roadmapProgress);
  const primarySkill = missingSkills[0] ?? null;
  const secondarySkill = missingSkills[1] ?? null;

  const actions = buildActions({
    primarySkill,
    secondarySkill,
    nextPhase,
    roadmapProgress,
    readinessIndex,
    career: profile.career,
  });

  return (
    <main className="min-h-screen bg-[#050708] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Header />

        <section className="mt-12 md:mt-16">
          <p className="eyebrow">Career intelligence dashboard</p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                Turn your career match into a plan.
              </h1>
              <p className="mt-4 max-w-3xl leading-7 text-white/50">
                Your assessment match stays fixed until you retake the assessment. Readiness, skill coverage and roadmap momentum update as you make progress.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/assessment" className="button-secondary px-6 py-3">Update profile</Link>
              <Link href="/assistant" className="button-primary px-6 py-3">Ask Aspire AI →</Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <article className="card relative overflow-hidden p-7 md:p-10">
            <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-cyan-300/[0.06] blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-2 text-sm font-semibold text-cyan-200">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                Best-fit direction
              </div>
              <h2 className="mt-6 text-4xl font-bold md:text-6xl">{profile.career}</h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/50">{career.summary}</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <MiniStat label="Education" value={profile.education} />
                <MiniStat label="Experience" value={profile.experience} />
                <MiniStat label="Profile skills" value={`${profile.skills.length} selected`} />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/roadmap" className="button-primary px-7 py-3">Continue roadmap →</Link>
                <Link href="/assistant" className="button-secondary px-7 py-3">Career coach</Link>
              </div>
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
            <p className="mt-2 max-w-xs text-sm leading-6 text-white/35">
              Saved by your assessment. Dashboard progress never changes this number.
            </p>
          </article>
        </section>

        <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <IntelligenceMetric
            label="Readiness index"
            value={`${readinessIndex}%`}
            note={readinessLabel}
            progress={readinessIndex}
          />
          <IntelligenceMetric
            label="Skill coverage"
            value={`${skillCoverage}%`}
            note={`${matchingSkills.length} of ${career.skills.length} core skills`}
            progress={skillCoverage}
          />
          <IntelligenceMetric
            label="Roadmap momentum"
            value={`${roadmapProgress}%`}
            note={momentumLabel}
            progress={roadmapProgress}
          />
          <IntelligenceMetric
            label="Interest alignment"
            value={`${interestAlignment}%`}
            note={`${profile.interests.length} interests selected`}
            progress={interestAlignment}
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <article className="card p-7 md:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Priority engine</p>
                <h2 className="mt-3 text-3xl font-bold">Your next best moves</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                  These actions are generated from your current skill gaps and roadmap state, not from a new career-match calculation.
                </p>
              </div>
              <Link href="/assistant" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
                Ask for a detailed plan →
              </Link>
            </div>

            <div className="mt-7 space-y-3">
              {actions.map((action, index) => (
                <ActionCard key={action.title} index={index + 1} {...action} />
              ))}
            </div>
          </article>

          <article className="card p-7 md:p-8">
            <p className="eyebrow">Career readiness</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-bold text-violet-200">{readinessIndex}%</span>
              <span className="mb-2 rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-3 py-1 text-xs font-semibold text-violet-100">
                {readinessLabel}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/40">
              Readiness is a progress indicator built from skill coverage, roadmap completion and experience. It is separate from your saved career match.
            </p>

            <div className="mt-7 space-y-5">
              <ProgressRow label="Core skill coverage" value={skillCoverage} />
              <ProgressRow label="Roadmap completion" value={roadmapProgress} />
              <ProgressRow label="Experience readiness" value={experienceReadiness} />
              <ProgressRow label="Education alignment" value={educationAlignment} />
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <SkillCard
            title="Strengths already working for you"
            subtitle={`${matchingSkills.length} core skills align with ${profile.career}`}
            skills={matchingSkills}
            empty="No core skills are matched yet. Start with the first roadmap phase."
            positive
          />
          <SkillCard
            title="Highest-value skill gaps"
            subtitle={`${missingSkills.length} core skills remain to develop`}
            skills={missingSkills}
            empty="You already cover the tracked core skill set. Focus on depth and projects."
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[.72fr_1.28fr]">
          <article className="card p-7">
            <p className="eyebrow">Assessment signal</p>
            <h2 className="mt-3 text-2xl font-semibold">Why your match is {score}%</h2>
            <p className="mt-2 text-sm leading-6 text-white/40">
              This is the original assessment breakdown saved with your profile.
            </p>
            <div className="mt-6 space-y-5">
              <ScoreRow label="Education fit" value={profile.matchBreakdown.education} max={25} />
              <ScoreRow label="Relevant skills" value={profile.matchBreakdown.skills} max={45} />
              <ScoreRow label="Interest alignment" value={profile.matchBreakdown.interests} max={20} />
              <ScoreRow label="Experience" value={profile.matchBreakdown.experience} max={10} />
            </div>
          </article>

          <article className="card p-7 md:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Roadmap command center</p>
                <h2 className="mt-3 text-3xl font-bold">{roadmapProgress}% complete</h2>
                <p className="mt-2 text-white/40">{validCompleted.length} of {career.roadmap.length} phases finished</p>
              </div>
              <Link href="/roadmap" className="button-primary px-6 py-3">Open roadmap →</Link>
            </div>

            <div className="mt-7 h-3 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all"
                style={{ width: `${roadmapProgress}%` }}
              />
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {career.roadmap.map((item, index) => {
                const done = validCompleted.includes(index);
                const current = nextPhaseIndex === index;
                return (
                  <div
                    key={item.title}
                    className={`rounded-2xl border p-4 ${
                      done
                        ? "border-cyan-300/15 bg-cyan-300/[0.05]"
                        : current
                          ? "border-violet-300/20 bg-violet-300/[0.06]"
                          : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-white/30">Phase {index + 1}</div>
                      <div className={`text-xs font-semibold ${done ? "text-cyan-300" : current ? "text-violet-200" : "text-white/25"}`}>
                        {done ? "Completed" : current ? "Next" : "Locked next"}
                      </div>
                    </div>
                    <div className="mt-2 font-semibold">{item.title}</div>
                    <div className="mt-2 text-xs text-white/35">{item.duration}</div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-cyan-300/10 bg-gradient-to-r from-cyan-300/[0.05] to-violet-400/[0.05] p-7 md:p-9">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="eyebrow">Aspire AI insight</p>
              <h2 className="mt-3 text-3xl font-bold">{getInsightHeadline(readinessIndex, roadmapProgress)}</h2>
              <p className="mt-3 max-w-3xl leading-7 text-white/45">
                {getInsightText({
                  readinessIndex,
                  roadmapProgress,
                  missingSkills,
                  career: profile.career,
                  nextPhaseTitle: nextPhase?.title,
                })}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link href="/assistant" className="button-primary px-7 py-3">Get coaching →</Link>
              <Link href="/roadmap" className="button-secondary px-7 py-3">Keep building</Link>
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-white/5 py-8 text-center text-sm text-white/30">
          Aspire AI · One saved match · Live readiness · Clear next actions
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
      <nav className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm font-semibold text-cyan-200">Dashboard</Link>
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
        <p className="mt-4 leading-7 text-white/45">The intelligence dashboard needs your saved Aspire AI profile.</p>
        <Link href="/assessment" className="button-primary mt-8 px-7 py-3">Start assessment →</Link>
      </section>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white/80">{value}</p>
    </div>
  );
}

function IntelligenceMetric({
  label,
  value,
  note,
  progress,
}: {
  label: string;
  value: string;
  note: string;
  progress: number;
}) {
  return (
    <article className="card p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-white/30">{label}</p>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      <p className="mt-2 min-h-10 text-sm leading-5 text-white/40">{note}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${progress}%` }} />
      </div>
    </article>
  );
}

function ActionCard({
  index,
  title,
  text,
  href,
  cta,
}: {
  index: number;
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:flex-row sm:items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] text-sm font-bold text-cyan-200">
        {String(index).padStart(2, "0")}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-white/40">{text}</p>
      </div>
      <Link href={href} className="shrink-0 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
        {cta}
      </Link>
    </div>
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
          <span
            key={skill}
            className={`rounded-full border px-3 py-2 text-sm ${
              positive
                ? "border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-100"
                : "border-violet-300/15 bg-violet-300/[0.06] text-violet-100"
            }`}
          >
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

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/50">{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-violet-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function buildActions({
  primarySkill,
  secondarySkill,
  nextPhase,
  roadmapProgress,
  readinessIndex,
  career,
}: {
  primarySkill: string | null;
  secondarySkill: string | null;
  nextPhase: { title: string; project: string } | null;
  roadmapProgress: number;
  readinessIndex: number;
  career: string;
}) {
  const actions: Array<{ title: string; text: string; href: string; cta: string }> = [];

  if (primarySkill) {
    actions.push({
      title: `Close the ${primarySkill} gap`,
      text: secondarySkill
        ? `${primarySkill} is your highest-priority missing core skill. ${secondarySkill} is the next one behind it.`
        : `${primarySkill} is the main tracked core-skill gap remaining for ${career}.`,
      href: "/roadmap",
      cta: "Open roadmap →",
    });
  }

  if (nextPhase) {
    actions.push({
      title: `Complete ${nextPhase.title}`,
      text: `Your next roadmap milestone is to finish this phase and produce: ${nextPhase.project}.`,
      href: "/roadmap",
      cta: "Continue →",
    });
  }

  if (roadmapProgress < 50) {
    actions.push({
      title: "Build visible proof early",
      text: "Do not wait until the roadmap is finished. Turn the current phase into a small portfolio artifact now.",
      href: "/assistant",
      cta: "Get project idea →",
    });
  } else if (roadmapProgress < 100) {
    actions.push({
      title: "Upgrade your portfolio evidence",
      text: "You have momentum. Convert completed phases into polished case studies with screenshots, decisions and measurable outcomes.",
      href: "/assistant",
      cta: "Plan portfolio →",
    });
  }

  if (readinessIndex >= 70) {
    actions.push({
      title: "Start opportunity preparation",
      text: "Your readiness signal is strong enough to begin resume refinement, mock interviews and targeted applications alongside continued learning.",
      href: "/assistant",
      cta: "Prepare now →",
    });
  } else {
    actions.push({
      title: "Create a focused 30-day sprint",
      text: "Use one skill gap, one roadmap phase and one small project as your next 30-day execution plan.",
      href: "/assistant",
      cta: "Build my plan →",
    });
  }

  return actions.slice(0, 4);
}

function getReadinessLabel(score: number) {
  if (score >= 85) return "Opportunity ready";
  if (score >= 70) return "Strong momentum";
  if (score >= 50) return "Building confidence";
  if (score >= 30) return "Foundation forming";
  return "Early stage";
}

function getMomentumLabel(progress: number) {
  if (progress >= 100) return "Current roadmap completed";
  if (progress >= 75) return "Final stretch";
  if (progress >= 50) return "Strong momentum";
  if (progress > 0) return "Progress underway";
  return "Ready to begin";
}

function getInsightHeadline(readiness: number, progress: number) {
  if (progress >= 100) return "You finished the roadmap. Now prove the skills.";
  if (readiness >= 70) return "You are moving from learning into opportunity readiness.";
  if (readiness >= 45) return "Your foundation is becoming practical.";
  return "The fastest improvement now comes from focused execution.";
}

function getInsightText({
  readinessIndex,
  roadmapProgress,
  missingSkills,
  career,
  nextPhaseTitle,
}: {
  readinessIndex: number;
  roadmapProgress: number;
  missingSkills: string[];
  career: string;
  nextPhaseTitle?: string;
}) {
  if (roadmapProgress >= 100) {
    return `Your current ${career} roadmap is complete. Keep the saved assessment match separate from this achievement, and focus next on stronger portfolio evidence, interviews and real opportunities.`;
  }

  const gapText = missingSkills.length
    ? `The highest-value gaps still include ${missingSkills.slice(0, 3).join(", ")}.`
    : "You already cover the tracked core skill list.";
  const phaseText = nextPhaseTitle ? ` Your next roadmap phase is ${nextPhaseTitle}.` : "";

  return `Your live readiness index is ${readinessIndex}%, while roadmap progress is ${roadmapProgress}%. ${gapText}${phaseText} Keep improving the real profile first; retake the assessment only when your skills or experience have genuinely changed.`;
}
