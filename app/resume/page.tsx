"use client";

import Link from "next/link";
import { type ChangeEvent, useState } from "react";
import AppNav from "../_components/app-nav";
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

  if (!profile) return <NoProfile />;

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
      setError("Upload a .txt or .md file for now, or paste the resume text directly into the editor.");
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
      setError("That file could not be read. Paste the resume text directly instead.");
    }
  }

  function clearResume() {
    setResumeText("");
    setResult(null);
    setError("");
    setFileName("");
  }

  const wordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;

  return (
    <main className="page-shell">
      <AppNav active="resume" />

      <section className="page-container py-10 md:py-14">
        <div className="grid gap-8 border-b border-[var(--line-strong)] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Resume review</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] md:text-6xl">
              Does your resume support the direction you chose?
            </h1>
            <p className="text-muted mt-4 max-w-3xl text-lg leading-8">
              Compare the document with the tracked skills for {profile.career}, then review structure, evidence and missing terms. This produces a resume score — not a new career match.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 lg:min-w-[280px]">
            <div>
              <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Target</p>
              <p className="mt-2 max-w-[150px] text-sm font-semibold">{profile.career}</p>
            </div>
            <div>
              <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Career match</p>
              <div className="metric-number mt-2 text-3xl font-semibold">{profile.matchPercentage}%</div>
            </div>
          </div>
        </div>

        <section className="grid gap-8 py-8 xl:grid-cols-[.88fr_1.12fr]">
          <article className="panel overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] px-5 py-4 sm:flex-row sm:items-center md:px-6">
              <div>
                <p className="text-sm font-semibold">Resume text</p>
                <p className="text-faint mt-1 text-xs">Paste the content or load a plain-text file.</p>
              </div>
              <label className="button-secondary cursor-pointer">
                Load .txt / .md
                <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={handleFile} className="hidden" />
              </label>
            </div>

            {fileName && (
              <div className="border-b border-[var(--line)] bg-[#faf8f3] px-5 py-3 text-sm md:px-6">
                <span className="text-faint">Loaded file:</span> <span className="font-medium">{fileName}</span>
              </div>
            )}

            <div className="p-5 md:p-6">
              <textarea
                value={resumeText}
                onChange={(event) => {
                  setResumeText(event.target.value);
                  setResult(null);
                  setError("");
                }}
                placeholder="Paste the complete text from your resume here…"
                className="min-h-[480px] w-full resize-y rounded-[.65rem] border border-[var(--line-strong)] bg-[var(--surface)] p-4 font-mono text-[13px] leading-6 text-[var(--ink)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)]"
              />

              <div className="mt-3 flex flex-col justify-between gap-2 text-xs sm:flex-row">
                <span className="text-faint">{wordCount ? `${wordCount} words` : "No resume text yet"}</span>
                <span className="text-faint">Analysis does not change your saved Aspire profile.</span>
              </div>

              {error && (
                <div className="mt-4 rounded-[.65rem] border border-[#e6c0bb] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                  {error}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={analyzeResume}
                  disabled={loading || resumeText.trim().length < 120}
                  className="button-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Reviewing…" : "Run resume review"}
                </button>
                <button type="button" onClick={clearResume} className="button-secondary">Clear</button>
              </div>
            </div>
          </article>

          <article className="panel min-h-[700px] overflow-hidden">
            {!result ? <EmptyAnalysis loading={loading} /> : <ResumeAnalysis result={result} />}
          </article>
        </section>

        <section className="border-t border-[var(--line-strong)] py-8">
          <p className="text-muted max-w-4xl text-sm leading-6">
            Aspire checks only the text you provide. It cannot verify whether a claim is true, whether an employer will use an ATS in a particular way, or whether a score will lead to interviews. Treat the review as document feedback and only add skills or results you can genuinely defend.
          </p>
        </section>
      </section>
    </main>
  );
}

function EmptyAnalysis({ loading }: { loading: boolean }) {
  return (
    <div className="flex min-h-[700px] items-center justify-center p-8 text-center">
      <div className="max-w-md">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[#f8f6f0] text-sm font-bold">
          {loading ? "…" : "CV"}
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-[-0.025em]">
          {loading ? "Reviewing the document" : "Your review will appear here"}
        </h2>
        <p className="text-muted mt-3 leading-7">
          {loading
            ? "Checking career terms, section coverage, action evidence, measurable results and document length."
            : "Run the review to see what the resume already proves, which sections are present, and which improvements would have the highest value."}
        </p>
      </div>
    </div>
  );
}

function ResumeAnalysis({ result }: { result: ResumeResult }) {
  return (
    <div>
      <div className="flex flex-col justify-between gap-5 border-b border-[var(--line)] p-5 sm:flex-row sm:items-end md:p-6">
        <div>
          <p className="section-kicker">Resume review for</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">{result.targetCareer}</h2>
          <p className="text-faint mt-2 text-xs">{result.mode === "ai" ? "AI coaching note enabled" : "Local analysis"}</p>
        </div>
        <div className="sm:text-right">
          <div className="metric-number text-5xl font-semibold">{result.resumeScore}%</div>
          <p className="text-faint mt-1 text-xs">resume score</p>
        </div>
      </div>

      <div className="grid border-b border-[var(--line)] sm:grid-cols-4">
        <ReviewSignal label="Career terms" value={result.keywordCoverage} />
        <ReviewSignal label="Sections" value={result.sectionCoverage} />
        <ReviewSignal label="Evidence" value={result.evidenceScore} />
        <ReviewSignal label="Length" value={result.lengthScore} />
      </div>

      <div className="p-5 md:p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <p className="eyebrow">Document structure</p>
            <h3 className="mt-3 text-xl font-semibold">Sections detected</h3>
            <div className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {result.sections.map((section) => (
                <div key={section.label} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span>{section.label}</span>
                  <span className={section.found ? "status-pill status-pill-success" : "status-pill status-pill-warning"}>
                    {section.found ? "Found" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="eyebrow">Evidence</p>
            <h3 className="mt-3 text-xl font-semibold">What the text demonstrates</h3>
            <dl className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
              <EvidenceRow label="Words" value={String(result.wordCount)} />
              <EvidenceRow label="Action verbs" value={String(result.actionEvidence)} />
              <EvidenceRow label="Measured results" value={String(result.metricEvidence)} />
            </dl>
          </section>
        </div>

        <section className="mt-9 grid gap-8 lg:grid-cols-2">
          <SkillList title="Career skills detected" skills={result.detectedSkills} positive empty="No tracked target-career skills were detected in the text." />
          <SkillList title="Career skills not detected" skills={result.missingSkills} empty="All tracked target-career skills were detected." />
        </section>

        <section className="mt-9 border-t border-[var(--line-strong)] pt-7">
          <p className="eyebrow">Priority fixes</p>
          <h3 className="mt-3 text-xl font-semibold">Highest-value improvements</h3>
          <div className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {result.suggestions.map((suggestion, index) => (
              <div key={`${index}-${suggestion}`} className="grid gap-3 py-4 sm:grid-cols-[36px_1fr]">
                <span className="text-faint text-xs font-bold">0{index + 1}</span>
                <p className="text-muted m-0 text-sm leading-6">{suggestion}</p>
              </div>
            ))}
          </div>
        </section>

        {result.coachNote && (
          <section className="mt-8 panel-muted p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="section-kicker">Coach note</p>
              <span className="status-pill">{result.mode === "ai" ? "AI-assisted" : "Local"}</span>
            </div>
            <p className="text-muted mt-3 text-sm leading-7">{result.coachNote}</p>
          </section>
        )}

        <section className="mt-8 border-t border-[var(--line)] pt-5">
          <p className="text-faint text-xs leading-5">
            Saved career match: <strong className="text-[var(--ink)]">{result.savedCareerMatch}%</strong>. Resume review score: <strong className="text-[var(--ink)]">{result.resumeScore}%</strong>. These remain separate by design.
          </p>
        </section>
      </div>
    </div>
  );
}

function ReviewSignal({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-[var(--line)] px-5 py-4 sm:border-r sm:last:border-r-0">
      <p className="text-faint text-[11px] font-bold uppercase tracking-[.07em]">{label}</p>
      <div className="metric-number mt-2 text-2xl font-semibold">{value}%</div>
    </div>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="m-0 font-semibold">{value}</dd>
    </div>
  );
}

function SkillList({
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
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.length ? skills.map((skill) => (
          <span key={skill} className={positive ? "status-pill status-pill-success" : "status-pill"}>
            {positive ? "✓" : "+"} {skill}
          </span>
        )) : <p className="text-muted text-sm">{empty}</p>}
      </div>
    </section>
  );
}

function NoProfile() {
  return (
    <main className="page-shell">
      <AppNav active="resume" />
      <section className="page-container py-20">
        <div className="max-w-2xl border-t border-[var(--line-strong)] pt-8">
          <p className="eyebrow">Resume review</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">Choose a target career before reviewing the resume.</h1>
          <p className="text-muted mt-4 leading-7">Aspire compares the resume with the career saved by the assessment, so it needs that profile first.</p>
          <Link href="/assessment" className="button-primary mt-7">Open assessment</Link>
        </div>
      </section>
    </main>
  );
}
