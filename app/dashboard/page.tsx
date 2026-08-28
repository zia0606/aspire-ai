"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { careerRequirements, Profile, readProfile } from "../_lib/career-data";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfile(readProfile());
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const requirements = useMemo(() => profile ? careerRequirements[profile.career] : null, [profile]);
  const matching = requirements && profile ? requirements.skills.filter((skill) => profile.skills.includes(skill)) : [];
  const gaps = requirements && profile ? requirements.skills.filter((skill) => !profile.skills.includes(skill)) : [];

  if (!loaded) return <main className="min-h-screen bg-[#050708]" />;
  if (!profile) return <EmptyProfile />;

  const score = Number.isFinite(profile.matchPercentage) ? profile.matchPercentage : 0;

  return (
    <main className="min-h-screen bg-[#050708] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Header />
        <section className="mt-14 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <div className="card p-7 md:p-10">
            <p className="eyebrow">Your best-fit direction</p>
            <h1 className="mt-4 text-4xl font-bold md:text-6xl">{profile.career}</h1>
            <p className="mt-5 max-w-2xl leading-7 text-white/50">Your result combines your education, relevant skills, interests and experience. Complete the roadmap to improve your readiness.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/roadmap" className="button-primary px-7 py-3">View my roadmap →</Link>
              <Link href="/assessment" className="button-secondary px-7 py-3">Retake assessment</Link>
            </div>
          </div>
          <div className="card flex flex-col items-center justify-center p-8 text-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-full" style={{ background: `radial-gradient(circle, #090d10 61%, transparent 63%), conic-gradient(#67e8f9 ${score}%, rgba(255,255,255,.06) 0)` }}>
              <div><div className="text-4xl font-bold text-cyan-300">{score}%</div><div className="mt-1 text-xs text-white/35">career match</div></div>
            </div>
            <p className="mt-5 text-sm text-white/45">Calculated once by your assessment</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <SkillCard title="Your matching skills" skills={matching} empty="No matching skills selected yet." positive />
          <SkillCard title="Skills to build next" skills={gaps} empty="You already cover the core skill list." />
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            ["Education", profile.education],
            ["Experience", profile.experience],
            ["Interests", `${profile.interests.length} selected`],
          ].map(([label, value]) => (
            <div key={label} className="card p-6"><p className="text-sm text-white/35">{label}</p><p className="mt-2 font-semibold">{value}</p></div>
          ))}
        </section>

        <section className="mt-6 flex flex-col items-start justify-between gap-5 rounded-3xl border border-violet-400/15 bg-violet-400/[0.05] p-7 sm:flex-row sm:items-center">
          <div><p className="font-semibold">Need help deciding what to learn?</p><p className="mt-1 text-sm text-white/45">Ask the Aspire Assistant about your profile and roadmap.</p></div>
          <Link href="/assistant" className="button-secondary px-6 py-3">Open AI Assistant →</Link>
        </section>
      </div>
    </main>
  );
}

function Header() {
  return <header className="flex items-center justify-between"><Link href="/" className="flex items-center gap-3 font-semibold"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">A</span>Aspire AI</Link><Link href="/" className="text-sm text-white/45 hover:text-white">Home</Link></header>;
}

function EmptyProfile() {
  return <main className="flex min-h-screen items-center justify-center bg-[#050708] px-6 text-white"><section className="card max-w-xl p-10 text-center"><p className="eyebrow">No profile found</p><h1 className="mt-4 text-3xl font-bold">Complete your assessment first.</h1><p className="mt-4 text-white/45">Your dashboard needs a saved Aspire AI profile.</p><Link href="/assessment" className="button-primary mt-8 px-7 py-3">Start assessment →</Link></section></main>;
}

function SkillCard({ title, skills, empty, positive = false }: { title: string; skills: string[]; empty: string; positive?: boolean }) {
  return <article className="card p-7"><h2 className="text-xl font-semibold">{title}</h2><div className="mt-5 flex flex-wrap gap-2">{skills.length ? skills.map((skill) => <span key={skill} className={`rounded-full border px-3 py-2 text-sm ${positive ? "border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-100" : "border-white/10 bg-white/[0.04] text-white/60"}`}>{skill}</span>) : <p className="text-sm text-white/35">{empty}</p>}</div></article>;
}
