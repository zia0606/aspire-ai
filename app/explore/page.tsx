"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppNav from "../_components/app-nav";
import { careerCatalog, type CareerDefinition, type Profile } from "../_lib/career-data";
import { useProfile } from "../_lib/profile-store";

type CareerItem = CareerDefinition & { key: string };

type Overlap = {
  score: number;
  skillCoverage: number;
  interestCoverage: number;
  educationFit: boolean;
  matchedSkills: string[];
  missingSkills: string[];
  matchedInterests: string[];
};

function getOverlap(profile: Profile | null, career: CareerDefinition): Overlap | null {
  if (!profile) return null;

  const matchedSkills = career.skills.filter((skill) => profile.skills.includes(skill));
  const missingSkills = career.skills.filter((skill) => !profile.skills.includes(skill));
  const matchedInterests = career.interests.filter((interest) => profile.interests.includes(interest));
  const skillCoverage = career.skills.length
    ? Math.round((matchedSkills.length / career.skills.length) * 100)
    : 0;
  const interestCoverage = career.interests.length
    ? Math.round((matchedInterests.length / career.interests.length) * 100)
    : 0;
  const educationFit = career.education.includes(profile.education);
  const score = Math.round(
    skillCoverage * 0.5 + interestCoverage * 0.3 + (educationFit ? 100 : 0) * 0.2,
  );

  return {
    score,
    skillCoverage,
    interestCoverage,
    educationFit,
    matchedSkills,
    missingSkills,
    matchedInterests,
  };
}

function overlapLabel(score: number) {
  if (score >= 75) return "Strong overlap";
  if (score >= 50) return "Useful overlap";
  if (score >= 25) return "Some overlap";
  return "New direction";
}

export default function ExplorePage() {
  const profile = useProfile();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [compare, setCompare] = useState<string[]>([]);

  const careers = useMemo<CareerItem[]>(
    () => Object.entries(careerCatalog).map(([key, career]) => ({ key, ...career })),
    [],
  );

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(careers.map((career) => career.category))).sort()],
    [careers],
  );

  const visibleCareers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return careers
      .filter((career) => category === "All" || career.category === category)
      .filter((career) => {
        if (!normalized) return true;
        const haystack = [
          career.title,
          career.category,
          career.summary,
          ...career.skills,
          ...career.interests,
        ].join(" ").toLowerCase();
        return haystack.includes(normalized);
      })
      .sort((a, b) => {
        if (profile?.career === a.key) return -1;
        if (profile?.career === b.key) return 1;
        if (profile) {
          const aScore = getOverlap(profile, a)?.score ?? 0;
          const bScore = getOverlap(profile, b)?.score ?? 0;
          if (aScore !== bScore) return bScore - aScore;
        }
        return a.title.localeCompare(b.title);
      });
  }, [careers, category, profile, query]);

  const compared = compare
    .map((key) => careers.find((career) => career.key === key))
    .filter((career): career is CareerItem => Boolean(career));

  function toggleCompare(key: string) {
    setCompare((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      if (current.length >= 2) return [current[1], key];
      return [...current, key];
    });
  }

  return (
    <main className="page-shell">
      <AppNav active="explore" />

      <section className="page-container py-10 md:py-14">
        <div className="grid gap-8 border-b border-[var(--line-strong)] pb-9 lg:grid-cols-[1fr_.42fr] lg:items-end">
          <div>
            <p className="eyebrow">Career explorer</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
              Compare directions before you commit to one.
            </h1>
            <p className="text-muted mt-5 max-w-3xl text-lg leading-8">
              Browse the Aspire career catalog, inspect the skills and roadmap behind each role, and compare two paths side by side. Nothing you do here changes your saved assessment result.
            </p>
          </div>

          <aside className="border-l border-[var(--line)] pl-0 lg:pl-7">
            <p className="section-kicker">How to read this page</p>
            <p className="text-muted mt-3 text-sm leading-6">
              {profile
                ? "Profile overlap is a browsing signal based on your current education, selected skills and interests. It is not a second career-match score."
                : "You can browse every direction now. Complete the assessment later to add personalized profile-overlap signals."}
            </p>
            {!profile && (
              <Link href="/assessment" className="button-secondary mt-4">Take assessment</Link>
            )}
          </aside>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <label className="block">
            <span className="sr-only">Search careers</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by career, skill or interest…"
              className="w-full rounded-[.7rem] border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-[.6rem] border px-3 py-2 text-sm font-semibold ${
                  category === item
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {compared.length > 0 && (
          <CompareTray
            careers={compared}
            profile={profile}
            onRemove={(key) => setCompare((current) => current.filter((item) => item !== key))}
            onClear={() => setCompare([])}
          />
        )}

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">Browse careers</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">
              {visibleCareers.length} direction{visibleCareers.length === 1 ? "" : "s"}
            </h2>
          </div>
          <p className="text-faint text-sm">Choose up to two careers to compare.</p>
        </div>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {visibleCareers.map((career) => {
            const overlap = getOverlap(profile, career);
            const selected = compare.includes(career.key);
            const isSaved = profile?.career === career.key;

            return (
              <article key={career.key} className="workspace-panel p-6 md:p-7">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="section-kicker">{career.category}</span>
                      {isSaved && <span className="status-pill status-good">Saved direction</span>}
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-.035em]">{career.title}</h3>
                  </div>
                  {overlap && (
                    <div className="text-right">
                      <div className="metric-number text-3xl font-semibold">{overlap.score}%</div>
                      <div className="text-faint mt-1 text-xs">Profile overlap</div>
                    </div>
                  )}
                </div>

                <p className="text-muted mt-4 leading-7">{career.summary}</p>

                {overlap && (
                  <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[var(--line)] py-4 text-sm">
                    <SmallSignal label="Skills" value={`${overlap.skillCoverage}%`} />
                    <SmallSignal label="Interests" value={`${overlap.interestCoverage}%`} />
                    <SmallSignal label="Education" value={overlap.educationFit ? "Aligned" : "Different"} />
                  </div>
                )}

                <div className="mt-5">
                  <p className="metric-label">Core skills</p>
                  <div className="flex flex-wrap gap-2">
                    {career.skills.slice(0, 8).map((skill) => {
                      const owned = profile?.skills.includes(skill);
                      return (
                        <span
                          key={skill}
                          className={`rounded-full border px-2.5 py-1.5 text-xs ${
                            owned
                              ? "border-[#bdd8ca] bg-[var(--success-soft)] text-[var(--success)]"
                              : "border-[var(--line)] bg-[var(--surface-muted)] text-[var(--muted)]"
                          }`}
                        >
                          {owned ? "✓ " : ""}{skill}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
                  <div className="text-sm text-[var(--muted)]">
                    {career.roadmap.length} learning phases · {career.roadmap[0]?.duration ?? "Structured roadmap"}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCompare(career.key)}
                    className={selected ? "button-primary" : "button-secondary"}
                  >
                    {selected ? "Selected for compare" : "Compare"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {!visibleCareers.length && (
          <div className="workspace-panel mt-6 p-8 text-center">
            <h2 className="text-xl font-semibold">No careers match that search.</h2>
            <p className="text-muted mt-2">Try a broader skill, category or career name.</p>
          </div>
        )}

        <section className="mt-10 border-t border-[var(--line-strong)] pt-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="section-kicker">Ready to choose?</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">Use the assessment to make a direction official.</h2>
              <p className="text-muted mt-2 max-w-2xl leading-7">
                Explorer never rewrites your profile. Change or confirm your saved target career through the assessment so the dashboard, roadmap, resume review and coach stay connected to one deliberate choice.
              </p>
            </div>
            <Link href="/assessment" className="button-primary">Open assessment</Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function SmallSignal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CompareTray({
  careers,
  profile,
  onRemove,
  onClear,
}: {
  careers: CareerItem[];
  profile: Profile | null;
  onRemove: (key: string) => void;
  onClear: () => void;
}) {
  const complete = careers.length === 2;
  const first = careers[0];
  const second = careers[1];
  const sharedSkills = complete
    ? first.skills.filter((skill) => second.skills.includes(skill))
    : [];

  return (
    <section className="mt-8 rounded-[.9rem] border border-[var(--line-strong)] bg-[var(--surface-muted)] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Compare careers</p>
          <h2 className="mt-2 text-xl font-semibold">
            {complete ? `${first.title} vs ${second.title}` : "Choose one more career"}
          </h2>
        </div>
        <button type="button" className="button-quiet" onClick={onClear}>Clear</button>
      </div>

      <div className={`mt-5 grid gap-4 ${complete ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
        {careers.map((career) => {
          const overlap = getOverlap(profile, career);
          const missing = overlap?.missingSkills.slice(0, 4) ?? career.skills.slice(0, 4);
          return (
            <article key={career.key} className="rounded-[.75rem] border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="section-kicker">{career.category}</span>
                  <h3 className="mt-1 text-xl font-semibold">{career.title}</h3>
                </div>
                <button type="button" onClick={() => onRemove(career.key)} className="text-sm font-semibold text-[var(--muted)]">Remove</button>
              </div>

              <dl className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
                <CompareRow label="Profile overlap" value={overlap ? `${overlap.score}% · ${overlapLabel(overlap.score)}` : "Take assessment to personalize"} />
                <CompareRow label="Education" value={overlap ? (overlap.educationFit ? "Aligned" : "Outside current education") : career.education.slice(0, 3).join(", ")} />
                <CompareRow label="Core skills" value={`${career.skills.length} tracked`} />
                <CompareRow label="Learning plan" value={`${career.roadmap.length} phases`} />
              </dl>

              <div className="mt-4">
                <p className="metric-label">Skills to develop</p>
                <p className="text-muted text-sm leading-6">{missing.length ? missing.join(" · ") : "Core tracked skills already covered"}</p>
              </div>
            </article>
          );
        })}
      </div>

      {complete && (
        <div className="mt-5 border-t border-[var(--line)] pt-4">
          <span className="metric-label">Shared foundation</span>
          <p className="text-muted text-sm leading-6">
            {sharedSkills.length
              ? `${sharedSkills.join(", ")} transfer across both directions.`
              : "These careers use different core skill sets, so switching between them requires a larger learning change."}
          </p>
        </div>
      )}
    </section>
  );
}

function CompareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[.42fr_1fr] gap-4 py-3">
      <dt className="text-faint">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
