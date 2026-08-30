"use client";

import Link from "next/link";
import { useState } from "react";
import AppNav from "../_components/app-nav";
import { careerCatalog } from "../_lib/career-data";
import {
  type PortfolioEvidence,
  type PortfolioStatus,
  portfolioStatuses,
  usePortfolioEvidence,
} from "../_lib/portfolio-store";
import { useProfile, useRoadmapProgress } from "../_lib/profile-store";

type FormState = {
  status: PortfolioStatus;
  problem: string;
  approach: string;
  outcome: string;
  repoUrl: string;
  demoUrl: string;
  skills: string;
};

const emptyForm: FormState = {
  status: "Planned",
  problem: "",
  approach: "",
  outcome: "",
  repoUrl: "",
  demoUrl: "",
  skills: "",
};

const fieldClass = "w-full rounded-[.7rem] border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]";

function proofQuality(item: PortfolioEvidence) {
  let score = 0;
  if (item.problem.trim().length >= 30) score += 20;
  if (item.approach.trim().length >= 40) score += 20;
  if (item.outcome.trim().length >= 25) score += 20;
  if (item.repoUrl.trim() || item.demoUrl.trim()) score += 20;
  if (item.skills.length >= 2) score += 10;
  if (item.status === "Ready" || item.status === "Published") score += 10;
  return score;
}

function qualityLabel(score: number) {
  if (score >= 90) return "Strong proof";
  if (score >= 70) return "Nearly ready";
  if (score >= 40) return "Needs evidence";
  return "Early draft";
}

export default function PortfolioPage() {
  const profile = useProfile();
  const { evidence, savePortfolio } = usePortfolioEvidence();
  const { completed } = useRoadmapProgress(profile?.career ?? "");
  const [editingPhase, setEditingPhase] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  if (!profile) return <NoProfile />;

  const careerName = profile.career;
  const career = careerCatalog[careerName];
  if (!career) return <NoProfile />;

  const currentEvidence = evidence.filter((item) => item.career === careerName);
  const readyCount = currentEvidence.filter((item) => proofQuality(item) >= 70).length;
  const publishedCount = currentEvidence.filter((item) => item.status === "Published").length;
  const coverage = career.roadmap.length
    ? Math.round((currentEvidence.length / career.roadmap.length) * 100)
    : 0;
  const completedPhases = completed.filter((index) => index >= 0 && index < career.roadmap.length).length;

  function getEvidence(phaseIndex: number) {
    return currentEvidence.find((item) => item.phaseIndex === phaseIndex) ?? null;
  }

  function startEditing(phaseIndex: number) {
    const existing = getEvidence(phaseIndex);
    if (existing) {
      setForm({
        status: existing.status,
        problem: existing.problem,
        approach: existing.approach,
        outcome: existing.outcome,
        repoUrl: existing.repoUrl,
        demoUrl: existing.demoUrl,
        skills: existing.skills.join(", "),
      });
    } else {
      setForm(emptyForm);
    }
    setEditingPhase(phaseIndex);
  }

  function saveEvidence() {
    if (editingPhase === null) return;
    const phase = career.roadmap[editingPhase];
    if (!phase) return;

    const existing = getEvidence(editingPhase);
    const now = new Date().toISOString();
    const skills = Array.from(
      new Set(
        form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      ),
    ).slice(0, 60);

    const record: PortfolioEvidence = {
      id: existing?.id ?? crypto.randomUUID(),
      career: careerName,
      phaseIndex: editingPhase,
      phaseTitle: phase.title,
      projectTitle: phase.project,
      status: form.status,
      problem: form.problem.trim(),
      approach: form.approach.trim(),
      outcome: form.outcome.trim(),
      repoUrl: form.repoUrl.trim(),
      demoUrl: form.demoUrl.trim(),
      skills,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    savePortfolio([
      ...evidence.filter((item) => !(item.career === careerName && item.phaseIndex === editingPhase)),
      record,
    ]);
    setEditingPhase(null);
    setForm(emptyForm);
  }

  function removeEvidence(phaseIndex: number) {
    savePortfolio(evidence.filter((item) => !(item.career === careerName && item.phaseIndex === phaseIndex)));
    if (editingPhase === phaseIndex) {
      setEditingPhase(null);
      setForm(emptyForm);
    }
  }

  return (
    <main className="page-shell">
      <AppNav active="portfolio" />

      <section className="page-container py-10 md:py-14">
        <div className="grid gap-8 border-b border-[var(--line-strong)] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Portfolio evidence</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] md:text-6xl">
              Turn roadmap projects into proof.
            </h1>
            <p className="text-muted mt-4 max-w-3xl text-lg leading-8">
              Document what you built for {careerName}: the problem, your approach, measurable outcome, links and skills you can defend in an interview.
            </p>
          </div>
          <Link href="/roadmap" className="button-secondary">Back to roadmap</Link>
        </div>

        <section className="grid gap-0 border-b border-[var(--line-strong)] md:grid-cols-4">
          {[
            ["Roadmap done", `${completedPhases}/${career.roadmap.length}`, "learning phases"],
            ["Evidence captured", `${currentEvidence.length}/${career.roadmap.length}`, "project records"],
            ["Portfolio-ready", `${readyCount}`, "quality ≥ 70"],
            ["Proof coverage", `${coverage}%`, `${publishedCount} published`],
          ].map(([label, value, note], index) => (
            <div key={label} className={`py-7 ${index ? "border-t border-[var(--line)] md:border-l md:border-t-0 md:pl-6" : ""}`}>
              <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">{label}</p>
              <div className="metric-number mt-2 text-3xl font-semibold">{value}</div>
              <p className="text-faint mt-1 text-xs">{note}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-10 py-10 lg:grid-cols-[.72fr_1.28fr]">
          <aside>
            <p className="eyebrow">What counts as proof?</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">A project title is not enough.</h2>
            <div className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {[
                ["Problem", "Explain what needed to be solved and for whom."],
                ["Approach", "Show the decisions, tools and trade-offs you handled."],
                ["Outcome", "State what worked, changed or was learned. Use numbers when they are real."],
                ["Proof link", "Attach a repository, live demo or both."],
                ["Skills", "Name the skills that the project actually demonstrates."],
              ].map(([title, text]) => (
                <div key={title} className="py-4">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-muted mt-1 text-sm leading-6">{text}</p>
                </div>
              ))}
            </div>
            <p className="text-faint mt-5 text-xs leading-5">
              Proof quality is a project-documentation signal only. It never changes Career Match, Readiness or Resume Score.
            </p>
          </aside>

          <div className="border-y border-[var(--line)]">
            {career.roadmap.map((phase, index) => {
              const item = getEvidence(index);
              const quality = item ? proofQuality(item) : 0;
              const phaseDone = completed.includes(index);

              return (
                <article id={`phase-${index}`} key={phase.title} className="border-b border-[var(--line)] py-7 last:border-b-0">
                  <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-faint text-xs font-bold uppercase tracking-[.07em]">Phase {index + 1}</span>
                        {phaseDone && <span className="status-pill status-pill-success">Roadmap complete</span>}
                        {item && <span className={quality >= 70 ? "status-pill status-pill-success" : "status-pill"}>{qualityLabel(quality)}</span>}
                      </div>
                      <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">{phase.project}</h2>
                      <p className="text-muted mt-2 text-sm leading-6">From roadmap phase: {phase.title}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      {item && (
                        <button type="button" onClick={() => removeEvidence(index)} className="button-quiet">Remove</button>
                      )}
                      <button type="button" onClick={() => startEditing(index)} className={item ? "button-secondary" : "button-primary"}>
                        {item ? "Edit proof" : "Document proof"}
                      </button>
                    </div>
                  </div>

                  {item && editingPhase !== index && (
                    <div className="mt-6 grid gap-6 border-t border-[var(--line)] pt-6 md:grid-cols-2">
                      <div>
                        <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Problem</p>
                        <p className="mt-2 text-sm leading-6">{item.problem || "Not documented yet."}</p>
                      </div>
                      <div>
                        <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Outcome</p>
                        <p className="mt-2 text-sm leading-6">{item.outcome || "Not documented yet."}</p>
                      </div>
                      <div>
                        <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Approach</p>
                        <p className="mt-2 text-sm leading-6">{item.approach || "Not documented yet."}</p>
                      </div>
                      <div>
                        <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Skills demonstrated</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.skills.length ? item.skills.map((skill) => <span key={skill} className="status-pill">{skill}</span>) : <span className="text-muted text-sm">None added yet.</span>}
                        </div>
                      </div>
                      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                        <span className="status-pill">{item.status}</span>
                        {item.repoUrl && <a href={item.repoUrl} target="_blank" rel="noreferrer" className="text-accent text-sm font-semibold underline underline-offset-4">Repository ↗</a>}
                        {item.demoUrl && <a href={item.demoUrl} target="_blank" rel="noreferrer" className="text-accent text-sm font-semibold underline underline-offset-4">Live demo ↗</a>}
                        <span className="text-faint text-xs">Proof quality {quality}/100</span>
                      </div>
                    </div>
                  )}

                  {editingPhase === index && (
                    <div className="mt-6 border-t border-[var(--line-strong)] pt-6">
                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="text-sm font-semibold">
                          Status
                          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PortfolioStatus }))} className={`${fieldClass} mt-2`}>
                            {portfolioStatuses.map((status) => <option key={status}>{status}</option>)}
                          </select>
                        </label>
                        <label className="text-sm font-semibold">
                          Skills demonstrated
                          <input value={form.skills} onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))} className={`${fieldClass} mt-2`} placeholder="React, TypeScript, SQL" />
                        </label>
                        <label className="text-sm font-semibold md:col-span-2">
                          Problem solved
                          <textarea value={form.problem} onChange={(event) => setForm((current) => ({ ...current, problem: event.target.value }))} className={`${fieldClass} mt-2 min-h-28 resize-y`} placeholder="What problem did this project solve, and for whom?" />
                        </label>
                        <label className="text-sm font-semibold md:col-span-2">
                          Your approach
                          <textarea value={form.approach} onChange={(event) => setForm((current) => ({ ...current, approach: event.target.value }))} className={`${fieldClass} mt-2 min-h-32 resize-y`} placeholder="What did you build, what decisions did you make, and what tools did you use?" />
                        </label>
                        <label className="text-sm font-semibold md:col-span-2">
                          Outcome / result
                          <textarea value={form.outcome} onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value }))} className={`${fieldClass} mt-2 min-h-28 resize-y`} placeholder="What worked? What changed? Add real numbers only when you can support them." />
                        </label>
                        <label className="text-sm font-semibold">
                          Repository URL
                          <input type="url" value={form.repoUrl} onChange={(event) => setForm((current) => ({ ...current, repoUrl: event.target.value }))} className={`${fieldClass} mt-2`} placeholder="https://github.com/..." />
                        </label>
                        <label className="text-sm font-semibold">
                          Live demo URL
                          <input type="url" value={form.demoUrl} onChange={(event) => setForm((current) => ({ ...current, demoUrl: event.target.value }))} className={`${fieldClass} mt-2`} placeholder="https://..." />
                        </label>
                      </div>
                      <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={() => { setEditingPhase(null); setForm(emptyForm); }} className="button-secondary">Cancel</button>
                        <button type="button" onClick={saveEvidence} className="button-primary">Save project proof</button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 border-t border-[var(--line-strong)] py-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow">Use the proof</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Evidence should improve applications and interviews.</h2>
            <p className="text-muted mt-3 max-w-2xl leading-7">
              Once projects are documented, use the strongest outcomes in your resume and add the opportunities you target to the Applications workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/resume" className="button-secondary">Review resume</Link>
            <Link href="/applications" className="button-primary">Track applications</Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function NoProfile() {
  return (
    <main className="page-shell">
      <AppNav active="portfolio" />
      <section className="page-container py-20">
        <div className="max-w-2xl border-t border-[var(--line-strong)] pt-8">
          <p className="eyebrow">Portfolio evidence</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">Choose a career direction before building proof.</h1>
          <p className="text-muted mt-4 leading-7">The Portfolio workspace is generated from the projects in your saved career roadmap, so it needs an assessment profile first.</p>
          <Link href="/assessment" className="button-primary mt-7">Open assessment</Link>
        </div>
      </section>
    </main>
  );
}
