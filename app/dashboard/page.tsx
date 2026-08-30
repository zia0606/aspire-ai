"use client";

import Link from "next/link";
import AppNav from "../_components/app-nav";
import { useApplications } from "../_lib/application-store";
import { careerCatalog, getMatchLabel } from "../_lib/career-data";
import { useInterviewPractice } from "../_lib/interview-store";
import { usePortfolioEvidence } from "../_lib/portfolio-store";
import { useProfile, useRoadmapProgress } from "../_lib/profile-store";

export default function DashboardPage() {
  const profile = useProfile();
  const { completed } = useRoadmapProgress(profile?.career ?? "");
  const { evidence } = usePortfolioEvidence();
  const { applications } = useApplications();
  const { practice } = useInterviewPractice();

  if (!profile) return <EmptyProfile />;

  const careerName = profile.career;
  const career = careerCatalog[careerName];
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

  const currentEvidence = evidence.filter((item) => item.career === careerName);
  const documentedPhases = new Set(currentEvidence.map((item) => item.phaseIndex));
  const completedWithoutEvidence = validCompleted.find((index) => !documentedPhases.has(index));
  const readyEvidence = currentEvidence.filter((item) => item.status === "Ready" || item.status === "Published");
  const proofCoverage = career.roadmap.length
    ? Math.round((currentEvidence.length / career.roadmap.length) * 100)
    : 0;

  const activeApplications = applications.filter((item) => !["Rejected", "Withdrawn"].includes(item.stage));
  const interviewApplications = applications.filter((item) => item.stage === "Interview");
  const offers = applications.filter((item) => item.stage === "Offer");
  const dueSoon = applications
    .filter((item) => item.dueDate && !["Rejected", "Withdrawn"].includes(item.stage))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null;

  const careerPractice = practice.filter((item) => item.career === careerName);
  const practicedQuestions = new Set(careerPractice.map((item) => item.questionId)).size;
  const averageConfidence = careerPractice.length
    ? careerPractice.reduce((total, item) => total + item.confidence, 0) / careerPractice.length
    : 0;

  const actions = buildActions({
    career: careerName,
    missingSkills,
    nextPhaseTitle: nextPhase?.title,
    nextProject: nextPhase?.project,
    roadmapProgress,
    completedWithoutEvidence,
    completedProject: completedWithoutEvidence !== undefined
      ? career.roadmap[completedWithoutEvidence]?.project
      : undefined,
    readyEvidenceCount: readyEvidence.length,
    activeApplications: activeApplications.length,
    interviewApplications: interviewApplications.length,
    practicedQuestions,
    dueSoon,
  });

  return (
    <main className="page-shell">
      <AppNav active="dashboard" />

      <section className="page-container py-10 md:py-14">
        <div className="flex flex-col justify-between gap-6 border-b border-[var(--line-strong)] pb-8 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Career command center</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] md:text-6xl">
              {careerName}
            </h1>
            <p className="text-muted mt-4 max-w-3xl text-lg leading-8">{career.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/explore" className="button-secondary">Compare careers</Link>
            <Link href="/roadmap" className="button-primary">Continue plan</Link>
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
                <article key={`${action.href}-${action.title}`} className="grid gap-4 py-5 sm:grid-cols-[46px_1fr_auto] sm:items-start">
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
              <SnapshotRow label="Interest fit" value={`${interestAlignment}%`} />
              <SnapshotRow label="Skills" value={`${profile.skills.length} selected`} />
              <SnapshotRow label="Last updated" value={formatDate(profile.updatedAt)} />
            </dl>
            <p className="text-faint mt-5 text-xs leading-5">
              Career Match stays assessment-owned. Everything below tracks what you do after choosing a direction.
            </p>
          </aside>
        </section>

        <section className="border-t border-[var(--line-strong)] py-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Career journey</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] md:text-3xl">From direction to evidence to opportunity</h2>
              <p className="text-muted mt-3 max-w-2xl leading-7">
                These are separate workspace states, not extra versions of your career-match score.
              </p>
            </div>
            <Link href="/account" className="button-secondary">Account & sync</Link>
          </div>

          <div className="mt-7 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            <JourneyRow
              step="01"
              label="Direction"
              title="Assessment saved"
              detail={`${careerName} · ${profile.matchPercentage}% career match`}
              status="Complete"
              href="/assessment"
            />
            <JourneyRow
              step="02"
              label="Learn"
              title={`${validCompleted.length} of ${career.roadmap.length} roadmap phases complete`}
              detail={nextPhase ? `Next: ${nextPhase.title}` : "Roadmap complete — keep skills fresh and improve proof."}
              status={roadmapProgress === 100 ? "Complete" : roadmapProgress > 0 ? "In progress" : "Not started"}
              href="/roadmap"
            />
            <JourneyRow
              step="03"
              label="Prove"
              title={`${currentEvidence.length} project records · ${readyEvidence.length} portfolio-ready`}
              detail={currentEvidence.length ? `${proofCoverage}% of roadmap projects have evidence.` : "Document roadmap projects with outcomes and proof links."}
              status={readyEvidence.length ? "Evidence ready" : currentEvidence.length ? "In progress" : "Not started"}
              href="/portfolio"
            />
            <JourneyRow
              step="04"
              label="Present"
              title="Resume review"
              detail="Check whether your skills and project evidence are actually visible in the document."
              status="Review when ready"
              href="/resume"
            />
            <JourneyRow
              step="05"
              label="Apply"
              title={`${activeApplications.length} active application${activeApplications.length === 1 ? "" : "s"}`}
              detail={offers.length ? `${offers.length} offer${offers.length === 1 ? "" : "s"} recorded.` : dueSoon ? `Next tracked follow-up: ${dueSoon.nextAction || dueSoon.role}${dueSoon.dueDate ? ` · ${formatShortDate(dueSoon.dueDate)}` : ""}` : "Add internships or jobs you actually want to pursue."}
              status={offers.length ? "Offer" : activeApplications.length ? "Active" : "Not started"}
              href="/applications"
            />
            <JourneyRow
              step="06"
              label="Interview"
              title={`${practicedQuestions} question${practicedQuestions === 1 ? "" : "s"} practiced`}
              detail={interviewApplications.length ? `${interviewApplications.length} application${interviewApplications.length === 1 ? "" : "s"} currently at interview stage.` : averageConfidence ? `Average self-rated confidence ${averageConfidence.toFixed(1)}/5.` : "Practice role, technical, project and behavioral answers before you need them."}
              status={interviewApplications.length ? "Interview active" : practicedQuestions ? "Practicing" : "Not started"}
              href="/interview"
            />
          </div>
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
              These four values were saved when the assessment was completed. Dashboard activity does not rewrite them.
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
                const hasEvidence = documentedPhases.has(index);
                return (
                  <div key={phase.title} className="grid gap-3 py-4 sm:grid-cols-[42px_1fr_auto] sm:items-center">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${done ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]" : next ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--line-strong)] text-faint"}`}>
                      {done ? "✓" : index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{phase.title}</h3>
                      <p className="text-faint mt-1 text-xs">{phase.duration}{hasEvidence ? " · proof documented" : ""}</p>
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
              <p className="eyebrow">Execution layer</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">The plan is useful only when it creates proof and opportunities.</h2>
              <p className="text-muted mt-3 max-w-2xl leading-7">
                Document projects, tailor the resume, track real applications and rehearse the stories you will need to explain in interviews.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/portfolio" className="button-secondary">Portfolio</Link>
              <Link href="/applications" className="button-secondary">Applications</Link>
              <Link href="/interview" className="button-primary">Interview prep</Link>
            </div>
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

function JourneyRow({
  step,
  label,
  title,
  detail,
  status,
  href,
}: {
  step: string;
  label: string;
  title: string;
  detail: string;
  status: string;
  href: string;
}) {
  return (
    <div className="grid gap-4 py-5 sm:grid-cols-[42px_90px_1fr_auto] sm:items-center">
      <span className="text-faint text-sm font-semibold">{step}</span>
      <span className="text-accent text-xs font-bold uppercase tracking-[.07em]">{label}</span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-muted mt-1 text-sm leading-6">{detail}</p>
      </div>
      <div className="flex items-center gap-3 sm:justify-end">
        <span className="status-pill">{status}</span>
        <Link href={href} className="text-accent text-sm font-semibold no-underline">Open →</Link>
      </div>
    </div>
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

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(date);
}

function buildActions({
  career,
  missingSkills,
  nextPhaseTitle,
  nextProject,
  roadmapProgress,
  completedWithoutEvidence,
  completedProject,
  readyEvidenceCount,
  activeApplications,
  interviewApplications,
  practicedQuestions,
  dueSoon,
}: {
  career: string;
  missingSkills: string[];
  nextPhaseTitle?: string;
  nextProject?: string;
  roadmapProgress: number;
  completedWithoutEvidence?: number;
  completedProject?: string;
  readyEvidenceCount: number;
  activeApplications: number;
  interviewApplications: number;
  practicedQuestions: number;
  dueSoon: { role: string; company: string; nextAction: string; dueDate: string } | null;
}) {
  const candidates: Array<{ priority: number; title: string; text: string; href: string }> = [];

  if (interviewApplications > 0) {
    candidates.push({
      priority: 100,
      title: "Prepare for an active interview",
      text: `${interviewApplications} tracked application${interviewApplications === 1 ? " is" : "s are"} at Interview stage. Rehearse role, technical, project and behavioral answers before the conversation.`,
      href: "/interview",
    });
  }

  if (dueSoon) {
    candidates.push({
      priority: 95,
      title: dueSoon.nextAction || `Follow up on ${dueSoon.role}`,
      text: `${dueSoon.role} at ${dueSoon.company}${dueSoon.dueDate ? ` · tracked for ${formatShortDate(dueSoon.dueDate)}` : ""}. Keep the application board current so important follow-ups are visible here.`,
      href: "/applications",
    });
  }

  if (completedWithoutEvidence !== undefined) {
    candidates.push({
      priority: 90,
      title: "Turn completed learning into proof",
      text: completedProject
        ? `You marked a roadmap phase complete but have not documented its project yet: ${completedProject}`
        : "A completed roadmap phase still needs a portfolio evidence record.",
      href: "/portfolio",
    });
  }

  if (nextPhaseTitle) {
    candidates.push({
      priority: roadmapProgress < 75 ? 85 : 70,
      title: `Continue: ${nextPhaseTitle}`,
      text: nextProject ? `Finish the learning phase and use its project as evidence: ${nextProject}` : "Complete the next roadmap phase before jumping ahead.",
      href: "/roadmap",
    });
  }

  if (missingSkills[0]) {
    candidates.push({
      priority: roadmapProgress < 60 ? 80 : 60,
      title: `Strengthen ${missingSkills[0]}`,
      text: `It is a missing core skill for ${career}. Build it through roadmap practice and proof rather than only adding the label to your profile.`,
      href: "/roadmap",
    });
  }

  if (readyEvidenceCount === 0 && roadmapProgress >= 25) {
    candidates.push({
      priority: 78,
      title: "Create one interview-ready project story",
      text: "You have learning progress, but no project is marked Ready or Published yet. Document one project with a clear problem, approach, outcome and proof link.",
      href: "/portfolio",
    });
  }

  if (activeApplications === 0 && (roadmapProgress >= 50 || readyEvidenceCount > 0)) {
    candidates.push({
      priority: 72,
      title: "Add a real target opportunity",
      text: "Your preparation has enough momentum to start tracking internships or jobs you genuinely want. Add one target and define the next action.",
      href: "/applications",
    });
  }

  if (practicedQuestions === 0 && (readyEvidenceCount > 0 || activeApplications > 0)) {
    candidates.push({
      priority: 68,
      title: "Rehearse your strongest project story",
      text: "Interview Prep can turn your saved career and portfolio evidence into questions. Practice the explanation before an interview makes it urgent.",
      href: "/interview",
    });
  }

  candidates.push({
    priority: 50,
    title: "Check how your evidence reads on a resume",
    text: "Use Resume Review to verify that the skills and projects you have built are actually visible and supported in the document.",
    href: "/resume",
  });

  return candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map(({ title, text, href }) => ({ title, text, href }));
}
