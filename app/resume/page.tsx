"use client";

import Link from "next/link";
import { ChangeEvent, useState } from "react";
import { useProfile } from "../_lib/profile-store";

type SectionCheck = {
  label: string;
  found: boolean;
};

type ResumeResult = {
  resumeScore: number;
  keywordCoverage: number;
  sectionCoverage: number;
  evidenceScore: number;
  lengthScore: number;
  wordCount: number;
  actionEvidence: number;
  metricEvidence: number;
  detectedSkills: string[];
  missingSkills: string[];
  sections: SectionCheck[];
  suggestions: string[];
  coachNote: string;
  mode: "ai" | "local";
  targetCareer: string;
  savedCareerMatch: number;
};

export default function ResumePage() {
  const profile = useProfile();
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050708] px-6 text-white">
        <section className="card max-w-xl p-10 text-center">
          <div className="brand-mark mx-auto">A</div>
          <p className="eyebrow mt-6">Resume Analyzer</p>
          <h1 className="mt-4 text-3xl font-bold">Create your career profile first.</h1>
          <p className="mt-4 leading-7 text-white/45">
            Aspire AI needs your target career before it can compare your resume against the right core skills.
          </p>
          <Link href="/assessment" className="button-primary mt-8 px-7 py-3">Start assessment →</Link>
        </section>
      </main>
    );
  }

  async function analyzeResume() {
    const clean = resumeText.trim();
    if (clean.length < 120) {
      setError("Paste more of your resume before analyzing it.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, resumeText: clean }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Resume analysis failed.");
      }
      setResult(data as ResumeResult);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Resume analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["txt", "md"].includes(extension)) {
      setError("For now, upload a .txt or .md resume file, or paste resume text directly into the box.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      setResumeText(text);
      setFileName(file.name);
      setError("");
      setResult(null);
    } catch {
      setError("I could not read that file. Paste the resume text directly instead.");
    }
  }

  function clearResume() {
    setResumeText("");
    setResult(null);
    setError("");
    setFileName("");
  }

  return (
    <main className="min-h-screen bg-[#050708] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="brand-mark">A</span>
            <span>Aspire AI</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-white/50 hover:text-white">Dashboard</Link>
            <Link href="/roadmap" className="text-sm text-white/50 hover:text-white">Roadmap</Link>
            <Link href="/assistant" className="text-sm text-white/50 hover:text-white">Assistant</Link>
          </nav>
        </header>

        <section className="mt-12 md:mt-16">
          <p className="eyebrow">Aspire AI Resume Lab</p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                See what your resume proves — and what it is missing.
              </h1>
              <p className="mt-4 max-w-3xl leading-7 text-white/50">
                Compare your resume with the core skills for {profile.career}. The analyzer score is a resume-quality signal, not your saved career-match percentage.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] px-5 py-4">
              <p className="text-xs uppercase tracking-wider text-white/30">Target career</p>
              <p className="mt-1 font-semibold text-cyan-200">{profile.career}</p>
              <p className="mt-1 text-xs text-white/30">Saved match: {profile.matchPercentage}%</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <article className="card p-7 md:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="eyebrow">Resume input</p>
                <h2 className="mt-2 text-2xl font-bold">Paste your resume text</h2>
              </div>
              <label className="button-secondary cursor-pointer px-5 py-3 text-sm">
                Upload .txt / .md
                <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={handleFile} className="hidden" />
              </label>
            </div>

            {fileName && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/50">
                Loaded: <span className="text-white/80">{fileName}</span>
              </div>
            )}

            <textarea
              value={resumeText}
              onChange={(event) => {
                setResumeText(event.target.value);
                setResult(null);
                setError("");
              }}
              placeholder="Paste the complete text from your resume here..."
              className="mt-5 min-h-[460px] w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-5 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-cyan-300/35"
            />

            <div className="mt-4 flex flex-col justify-between gap-3 text-xs text-white/30 sm:flex-row">
              <span>{resumeText.trim() ? `${resumeText.trim().split(/\s+/).length} words` : "No resume text yet"}</span>
              <span>Nothing is saved to your Aspire profile.</span>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={analyzeResume}
                disabled={loading || resumeText.trim().length < 120}
                className="button-primary px-7 py-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Analyzing..." : "Analyze resume →"}
              </button>
              <button type="button" onClick={clearResume} className="button-secondary px-6 py-3">
                Clear
              </button>
            </div>
          </article>

          <article className="card min-h-[650px] p-7 md:p-8">
            {!result ? (
              <EmptyAnalysis loading={loading} />
            ) : (
              <ResumeAnalysis result={result} />
            )}
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-sm leading-6 text-white/35">
          Aspire AI checks the resume text you provide against the current career catalog, structure signals and achievement evidence. It cannot verify whether claims are true, so only include skills, metrics and experience you can genuinely defend in an interview.
        </section>

        <footer className="mt-12 border-t border-white/5 py-8 text-center text-sm text-white/30">
          Aspire AI · Resume Lab · Career-aware feedback
        </footer>
      </div>
    </main>
  );
}

function EmptyAnalysis({ loading }: { loading: boolean }) {
  return (
    <div className="flex min-h-[590px] items-center justify-center text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] text-xl font-bold text-cyan-200">
          {loading ? "…" : "CV"}
        </div>
        <h2 className="mt-5 text-2xl font-bold">{loading ? "Analyzing your resume" : "Your analysis will appear here"}</h2>
        <p className="mt-3 leading-7 text-white/40">
          {loading
            ? "Aspire AI is checking career keywords, structure, evidence, metrics and clarity."
            : "Paste your resume on the left, then run the analyzer to see skill coverage, missing sections and prioritized improvements."}
        </p>
      </div>
    </div>
  );
}

function ResumeAnalysis({ result }: { result: ResumeResult }) {
  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="eyebrow">Resume intelligence</p>
          <h2 className="mt-2 text-3xl font-bold">{result.targetCareer}</h2>
          <p className="mt-2 text-sm text-white/35">
            {result.mode === "ai" ? "AI coaching active" : "Smart local analysis"}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-5xl font-bold text-cyan-300">{result.resumeScore}%</div>
          <p className="mt-1 text-xs uppercase tracking-wider text-white/30">Resume analyzer score</p>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <ResultMetric label="Career keywords" value={`${result.keywordCoverage}%`} />
        <ResultMetric label="Section coverage" value={`${result.sectionCoverage}%`} />
        <ResultMetric label="Evidence strength" value={`${result.evidenceScore}%`} />
        <ResultMetric label="Length signal" value={`${result.lengthScore}%`} />
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <SmallMetric label="Words" value={String(result.wordCount)} />
        <SmallMetric label="Action verbs" value={String(result.actionEvidence)} />
        <SmallMetric label="Measured results" value={String(result.metricEvidence)} />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Resume sections</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {result.sections.map((section) => (
            <div
              key={section.label}
              className={`rounded-xl border px-4 py-3 text-sm ${
                section.found
                  ? "border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-100"
                  : "border-white/10 bg-white/[0.025] text-white/45"
              }`}
            >
              {section.found ? "✓" : "○"} {section.label}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <SkillGroup title="Career skills detected" skills={result.detectedSkills} positive empty="No tracked core career skills were detected yet." />
        <SkillGroup title="Career skills not detected" skills={result.missingSkills} empty="All tracked core career skills were detected." />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Highest-impact improvements</h3>
        <div className="mt-4 space-y-3">
          {result.suggestions.map((suggestion, index) => (
            <div key={`${index}-${suggestion}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-white/55">
              <span className="font-bold text-cyan-300">{String(index + 1).padStart(2, "0")}</span>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      </div>

      {result.coachNote && (
        <div className="mt-8 rounded-2xl border border-violet-300/15 bg-violet-300/[0.06] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">Aspire AI coach note</p>
          <p className="mt-3 text-sm leading-7 text-white/65">{result.coachNote}</p>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-5 text-sm leading-6 text-white/45">
        Your saved career match remains <strong className="text-cyan-200">{result.savedCareerMatch}%</strong>. The resume score above is a separate document-quality signal and does not modify your Aspire AI profile.
      </div>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
      <div className="text-xl font-bold text-white/85">{value}</div>
      <div className="mt-1 text-xs text-white/30">{label}</div>
    </div>
  );
}

function SkillGroup({
  title,
  skills,
  empty,
  positive = false,
}: {
  title: string;
  skills: string[];
  empty: string;
  positive?: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white/70">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.length ? skills.map((skill) => (
          <span
            key={skill}
            className={`rounded-full border px-3 py-2 text-xs ${
              positive
                ? "border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-100"
                : "border-violet-300/15 bg-violet-300/[0.06] text-violet-100"
            }`}
          >
            {positive ? "✓" : "+"} {skill}
          </span>
        )) : <p className="text-sm text-white/35">{empty}</p>}
      </div>
    </div>
  );
}
