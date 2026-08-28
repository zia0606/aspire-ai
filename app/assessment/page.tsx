"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  calculateMatch,
  careersByEducation,
  educationOptions,
  interestOptions,
  skillsByEducation,
} from "../_lib/career-data";

const steps = ["Education", "Skills", "Career goal", "Experience", "Interests"];
const experienceOptions = ["Just starting", "Some practice", "Project experience", "Professional experience"];

export default function AssessmentPage() {
  const [step, setStep] = useState(0);
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [career, setCareer] = useState("");
  const [experience, setExperience] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);

  const currentSkills = skillsByEducation[education] ?? [];
  const currentCareers = careersByEducation[education] ?? [];
  const canContinue = [Boolean(education), skills.length > 0, Boolean(career), Boolean(experience), interests.length > 0][step] ?? false;
  const preview = useMemo(() => career ? calculateMatch({ education, skills, career, experience, interests }) : null, [education, skills, career, experience, interests]);

  function selectEducation(value: string) {
    setEducation(value);
    setSkills([]);
    setCareer("");
    setInterests([]);
  }

  function toggle(value: string, selected: string[], setter: (items: string[]) => void) {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  function finishAssessment() {
    const result = calculateMatch({ education, skills, career, experience, interests });
    localStorage.setItem("aspire-profile", JSON.stringify({
      education, skills, career, experience, interests,
      matchPercentage: result.matchPercentage,
      matchScore: result.matchPercentage,
      matchBreakdown: result.breakdown,
    }));
    localStorage.removeItem("aspire-roadmap-progress");
    setScore(result.matchPercentage);
    setStep(5);
  }

  const options = step === 0 ? educationOptions : step === 1 ? currentSkills : step === 2 ? currentCareers : step === 3 ? experienceOptions : interestOptions;
  const multi = step === 1 || step === 4;
  const selected = step === 0 ? [education] : step === 1 ? skills : step === 2 ? [career] : step === 3 ? [experience] : interests;

  return (
    <main className="min-h-screen bg-[#050708] px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">A</span>
            Aspire AI
          </Link>
          {step < 5 && <span className="text-sm text-white/40">Step {step + 1} of {steps.length}</span>}
        </header>

        {step < 5 ? (
          <section className="mt-14">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
            <p className="eyebrow mt-10">{steps[step]}</p>
            <h1 className="mt-3 text-3xl font-bold md:text-5xl">
              {step === 0 && "What are you studying?"}
              {step === 1 && "Which skills do you have?"}
              {step === 2 && "Where do you want to go?"}
              {step === 3 && "What is your experience level?"}
              {step === 4 && "What interests you most?"}
            </h1>
            <p className="mt-3 text-white/45">{multi ? "Select all that apply." : "Choose one option."}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`option ${selected.includes(option) ? "option-selected" : ""}`}
                  onClick={() => {
                    if (step === 0) selectEducation(option);
                    else if (step === 1) toggle(option, skills, setSkills);
                    else if (step === 2) setCareer(option);
                    else if (step === 3) setExperience(option);
                    else toggle(option, interests, setInterests);
                  }}
                >
                  <span className="flex items-center justify-between gap-4">
                    {option}<span>{selected.includes(option) ? "✓" : ""}</span>
                  </span>
                </button>
              ))}
            </div>

            {preview && step > 1 && (
              <div className="mt-8 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4 text-sm text-white/55">
                Current career match: <strong className="text-cyan-300">{preview.matchPercentage}%</strong>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between">
              <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="button-secondary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-30">
                ← Back
              </button>
              <button type="button" disabled={!canContinue} onClick={() => step === 4 ? finishAssessment() : setStep((value) => value + 1)} className="button-primary px-7 py-3 disabled:cursor-not-allowed disabled:opacity-30">
                {step === 4 ? "Finish assessment" : "Continue →"}
              </button>
            </div>
          </section>
        ) : (
          <section className="card mt-20 p-8 text-center md:p-14">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-2xl font-bold text-cyan-300">{score}%</div>
            <p className="eyebrow mt-7">Assessment complete</p>
            <h1 className="mt-3 text-3xl font-bold md:text-5xl">Your career profile is ready.</h1>
            <p className="mx-auto mt-4 max-w-xl text-white/50">Your result is saved. The dashboard and roadmap will use this exact match score.</p>
            <Link href="/dashboard" className="button-primary mt-8 px-8 py-4">View dashboard →</Link>
          </section>
        )}
      </div>
    </main>
  );
}
