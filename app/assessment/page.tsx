"use client";

import Link from "next/link";
import { useState } from "react";
import AppNav from "../_components/app-nav";
import {
  calculateMatch,
  careersByEducation,
  educationOptions,
  experienceOptions,
  interestsByEducation,
  skillsByEducation,
  type Education,
  type ExperienceLevel,
  type Profile,
} from "../_lib/career-data";
import { resetRoadmapProgress, saveProfile, useProfile } from "../_lib/profile-store";

const steps = ["Education", "Skills", "Career goal", "Experience", "Interests"];

export default function AssessmentPage() {
  const savedProfile = useProfile();
  const [mode, setMode] = useState<"intro" | "questions" | "result">("intro");
  const [step, setStep] = useState(0);
  const [education, setEducation] = useState<Education | "">("");
  const [skills, setSkills] = useState<string[]>([]);
  const [career, setCareer] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [interests, setInterests] = useState<string[]>([]);
  const [result, setResult] = useState<Profile | null>(null);

  const currentSkills = education ? skillsByEducation[education] : [];
  const currentCareers = education ? careersByEducation[education] : [];
  const currentInterests = education ? interestsByEducation[education] : [];

  function toggle(value: string, list: string[], setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function clearAnswers() {
    setEducation("");
    setSkills([]);
    setCareer("");
    setExperience("");
    setInterests([]);
    setResult(null);
    setStep(0);
  }

  function startFresh() {
    clearAnswers();
    setMode("questions");
  }

  function reviewSavedProfile() {
    if (!savedProfile) {
      startFresh();
      return;
    }

    setEducation(savedProfile.education);
    setSkills(savedProfile.skills);
    setCareer(savedProfile.career);
    setExperience(savedProfile.experience);
    setInterests(savedProfile.interests);
    setResult(null);
    setStep(0);
    setMode("questions");
  }

  function chooseEducation(value: Education) {
    if (education === value) return;
    setEducation(value);
    setSkills([]);
    setCareer("");
    setExperience("");
    setInterests([]);
  }

  const canContinue =
    step === 0 ? Boolean(education) :
    step === 1 ? skills.length > 0 :
    step === 2 ? Boolean(career) :
    step === 3 ? Boolean(experience) :
    interests.length > 0;

  function finishAssessment() {
    if (!education || !career || !experience || interests.length === 0 || skills.length === 0) return;

    const score = calculateMatch({ education, skills, career, experience, interests });
    const now = new Date().toISOString();
    const profile: Profile = {
      version: 2,
      education,
      skills,
      career,
      experience,
      interests,
      matchPercentage: score.matchPercentage,
      matchBreakdown: score.breakdown,
      createdAt: savedProfile?.createdAt ?? now,
      updatedAt: now,
    };

    saveProfile(profile);

    // Keep roadmap progress when the user is only reviewing the same career.
    // A different target career starts with a clean roadmap for that career.
    if (!savedProfile || savedProfile.career !== career) {
      resetRoadmapProgress(career);
    }

    setResult(profile);
    setMode("result");
  }

  const options: string[] =
    step === 0 ? educationOptions :
    step === 1 ? currentSkills :
    step === 2 ? currentCareers :
    step === 3 ? experienceOptions :
    currentInterests;

  const selected: string[] =
    step === 0 ? (education ? [education] : []) :
    step === 1 ? skills :
    step === 2 ? (career ? [career] : []) :
    step === 3 ? (experience ? [experience] : []) :
    interests;

  return (
    <main className="page-shell">
      <AppNav active="assessment" />

      {mode === "intro" && (
        <AssessmentIntro
          savedProfile={savedProfile}
          onReview={reviewSavedProfile}
          onFresh={startFresh}
        />
      )}

      {mode === "questions" && (
        <section className="page-container py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <button type="button" onClick={() => setMode("intro")} className="button-quiet -ml-3 mb-6 px-3 py-2 text-sm">
                ← Assessment overview
              </button>

              <p className="section-kicker">Your profile</p>
              <ol className="mt-4 space-y-1">
                {steps.map((label, index) => {
                  const complete = index < step;
                  const active = index === step;
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        disabled={index > step}
                        onClick={() => index <= step && setStep(index)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          active ? "bg-[var(--surface)] font-semibold text-[var(--ink)] shadow-[inset_0_0_0_1px_var(--line)]" : "text-muted"
                        } disabled:cursor-not-allowed disabled:opacity-45`}
                      >
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold ${
                          complete
                            ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]"
                            : active
                              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "border-[var(--line-strong)] text-faint"
                        }`}>
                          {complete ? "✓" : index + 1}
                        </span>
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 border-t border-[var(--line)] pt-5">
                <p className="text-faint text-xs leading-5">
                  Your existing saved profile is not changed until you finish all five sections.
                </p>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${((step + 1) / 5) * 100}%` }} />
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <p className="eyebrow">{steps[step]}</p>
                <span className="text-faint text-sm">{step + 1} / 5</span>
              </div>

              <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
                {step === 0 && "What are you studying or trained in?"}
                {step === 1 && "Which skills can you use today?"}
                {step === 2 && "Which direction do you want to test?"}
                {step === 3 && "How much practical experience do you have?"}
                {step === 4 && "What kind of work keeps your interest?"}
              </h1>

              <p className="text-muted mt-4 max-w-2xl leading-7">
                {step === 1 || step === 4
                  ? "Choose every option that genuinely applies. More selections are not automatically better."
                  : "Choose the answer that best reflects where you are right now."}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`option ${selected.includes(option) ? "option-selected" : ""}`}
                    onClick={() => {
                      if (step === 0) chooseEducation(option as Education);
                      else if (step === 1) toggle(option, skills, setSkills);
                      else if (step === 2) setCareer(option);
                      else if (step === 3) setExperience(option as ExperienceLevel);
                      else toggle(option, interests, setInterests);
                    }}
                  >
                    <span className="flex items-center justify-between gap-4">
                      <span className="font-medium">{option}</span>
                      <span className="text-accent min-w-5 text-right font-bold">{selected.includes(option) ? "✓" : ""}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-10 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
                <button
                  type="button"
                  disabled={step === 0}
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  className="button-secondary disabled:cursor-not-allowed disabled:opacity-35"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => step === 4 ? finishAssessment() : setStep((value) => value + 1)}
                  className="button-primary disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {step === 4 ? "Save assessment" : "Continue →"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {mode === "result" && result && (
        <AssessmentResult result={result} onReview={() => { setStep(0); setMode("questions"); }} />
      )}
    </main>
  );
}

function AssessmentIntro({
  savedProfile,
  onReview,
  onFresh,
}: {
  savedProfile: Profile | null;
  onReview: () => void;
  onFresh: () => void;
}) {
  return (
    <section className="page-container py-12 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_.78fr] lg:gap-16">
        <div>
          <p className="eyebrow">Career assessment</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] md:text-6xl">
            Start with a clear picture of where you are now.
          </h1>
          <p className="text-muted mt-6 max-w-2xl text-lg leading-8">
            Five short sections build the profile used across Aspire. The assessment creates your career-match result; Dashboard, Roadmap, Resume and Coach only read that saved profile.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {savedProfile ? (
              <>
                <button type="button" onClick={onReview} className="button-primary px-6 py-3.5">Review / retake assessment</button>
                <button type="button" onClick={onFresh} className="button-secondary px-6 py-3.5">Start fresh</button>
              </>
            ) : (
              <button type="button" onClick={onFresh} className="button-primary px-6 py-3.5">Begin assessment</button>
            )}
          </div>

          <p className="text-faint mt-5 text-sm">
            Nothing is replaced until you finish the final section and choose “Save assessment.”
          </p>
        </div>

        <aside>
          {savedProfile ? (
            <div className="panel p-6 md:p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="section-kicker">Current saved profile</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">{savedProfile.career}</h2>
                </div>
                <div className="text-right">
                  <div className="metric-number text-3xl font-semibold">{savedProfile.matchPercentage}%</div>
                  <div className="text-faint mt-1 text-xs">career match</div>
                </div>
              </div>

              <dl className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
                <InfoRow label="Education" value={savedProfile.education} />
                <InfoRow label="Experience" value={savedProfile.experience} />
                <InfoRow label="Skills" value={`${savedProfile.skills.length} selected`} />
                <InfoRow label="Interests" value={`${savedProfile.interests.length} selected`} />
              </dl>

              <div className="mt-5 flex gap-2">
                <Link href="/dashboard" className="button-secondary flex-1">Open dashboard</Link>
              </div>
            </div>
          ) : (
            <div className="panel-muted p-6 md:p-7">
              <p className="section-kicker">What it covers</p>
              <ol className="mt-5 space-y-4">
                {steps.map((label, index) => (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span className="text-faint w-6 font-semibold">0{index + 1}</span>
                    <span className="font-medium">{label}</span>
                  </li>
                ))}
              </ol>
              <p className="text-muted mt-6 border-t border-[var(--line)] pt-5 text-sm leading-6">
                The current version stores your finished profile in this browser. Account-based sync can be added later without changing the assessment logic.
              </p>
            </div>
          )}
        </aside>
      </div>

      <div className="mt-16 grid gap-8 border-t border-[var(--line)] pt-10 md:grid-cols-3">
        <AssessmentPrinciple title="Be accurate, not impressive" text="Choose what is true today. The score is more useful when the inputs are honest." />
        <AssessmentPrinciple title="A direction, not a verdict" text="The result helps organize a next move. It is not a guarantee or a permanent label." />
        <AssessmentPrinciple title="One saved source" text="Once saved, the same profile powers the rest of the workspace so the tools stay consistent." />
      </div>
    </section>
  );
}

function AssessmentResult({ result, onReview }: { result: Profile; onReview: () => void }) {
  return (
    <section className="page-container py-12 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_.8fr] lg:gap-16">
        <div>
          <p className="eyebrow">Assessment saved</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] md:text-6xl">
            Your current direction: {result.career}
          </h1>
          <p className="text-muted mt-5 max-w-2xl text-lg leading-8">
            This {result.matchPercentage}% career match is now the saved assessment result used throughout Aspire. Roadmap progress, readiness and resume analysis remain separate signals.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="button-primary px-6 py-3.5">Open dashboard</Link>
            <Link href="/roadmap" className="button-secondary px-6 py-3.5">View roadmap</Link>
            <button type="button" onClick={onReview} className="button-quiet px-4 py-3.5">Review answers</button>
          </div>
        </div>

        <div className="panel p-6 md:p-7">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
            <div>
              <p className="section-kicker">Saved career match</p>
              <div className="metric-number mt-2 text-5xl font-semibold">{result.matchPercentage}%</div>
            </div>
            <span className="status-pill status-pill-success">Profile updated</span>
          </div>

          <div className="mt-5 space-y-4">
            <BreakdownRow label="Education fit" value={result.matchBreakdown.education} max={25} />
            <BreakdownRow label="Relevant skills" value={result.matchBreakdown.skills} max={45} />
            <BreakdownRow label="Interest alignment" value={result.matchBreakdown.interests} max={20} />
            <BreakdownRow label="Experience" value={result.matchBreakdown.experience} max={10} />
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 py-3">
      <dt className="text-faint">{label}</dt>
      <dd className="m-0 text-right font-medium">{value}</dd>
    </div>
  );
}

function AssessmentPrinciple({ title, text }: { title: string; text: string }) {
  return (
    <article>
      <h2 className="font-semibold">{title}</h2>
      <p className="text-muted mt-2 text-sm leading-6">{text}</p>
    </article>
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
