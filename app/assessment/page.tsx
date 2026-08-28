"use client";

import Link from "next/link";
import { useState } from "react";
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
import { resetRoadmapProgress, saveProfile } from "../_lib/profile-store";

const steps = ["Education", "Skills", "Career goal", "Experience", "Interests"];

export default function AssessmentPage() {
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

  function chooseEducation(value: Education) {
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
      createdAt: now,
      updatedAt: now,
    };

    saveProfile(profile);
    resetRoadmapProgress(career);
    setResult(profile);
    setStep(5);
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
    <main className="min-h-screen bg-[#050708] px-6 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="brand-mark">A</span>
            <span>Aspire AI</span>
          </Link>
          {step < 5 && <span className="text-sm text-white/40">Step {step + 1} of 5</span>}
        </header>

        {step < 5 ? (
          <section className="mt-12 md:mt-16">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-cyan-300 transition-all duration-300" style={{ width: `${((step + 1) / 5) * 100}%` }} />
            </div>

            <p className="eyebrow mt-10">{steps[step]}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
              {step === 0 && "What are you studying?"}
              {step === 1 && "Which skills do you already have?"}
              {step === 2 && "Which career do you want to explore?"}
              {step === 3 && "How much experience do you have?"}
              {step === 4 && "What kind of work interests you?"}
            </h1>
            <p className="mt-4 max-w-2xl text-white/45">
              {step === 1 || step === 4 ? "Choose every option that genuinely applies to you." : "Choose the option that fits you best."}
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
                    <span>{option}</span>
                    <span className="text-cyan-300">{selected.includes(option) ? "✓" : ""}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((value) => Math.max(0, value - 1))}
                className="button-secondary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => step === 4 ? finishAssessment() : setStep((value) => value + 1)}
                className="button-primary px-7 py-3 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {step === 4 ? "Finish assessment" : "Continue →"}
              </button>
            </div>
          </section>
        ) : result ? (
          <section className="card mt-16 overflow-hidden p-8 text-center md:mt-24 md:p-14">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-3xl font-bold text-cyan-300">
              {result.matchPercentage}%
            </div>
            <p className="eyebrow mt-8">Assessment complete</p>
            <h1 className="mt-3 text-3xl font-bold md:text-5xl">Your career profile is ready.</h1>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/50">
              Your match for <strong className="text-white">{result.career}</strong> is saved as one permanent result. Dashboard, Roadmap and Assistant now read this same profile — none of them recalculates it.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/dashboard" className="button-primary px-8 py-4">Open dashboard →</Link>
              <Link href="/roadmap" className="button-secondary px-8 py-4">View roadmap</Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
