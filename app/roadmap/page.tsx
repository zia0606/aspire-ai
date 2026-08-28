"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Profile, readProfile } from "../_lib/career-data";

type RoadmapStep = { title: string; duration: string; description: string; topics: string[]; project: string };

const sharedRoadmaps: Record<string, RoadmapStep[]> = {
  "Full Stack Developer": [
    { title: "Master web fundamentals", duration: "3–4 weeks", description: "Build a strong HTML, CSS and JavaScript foundation.", topics: ["Semantic HTML", "Responsive CSS", "JavaScript basics", "Git"], project: "Responsive portfolio website" },
    { title: "Build modern interfaces", duration: "4–5 weeks", description: "Learn React, TypeScript and component-driven UI.", topics: ["React", "TypeScript", "State", "APIs"], project: "Task management application" },
    { title: "Create the backend", duration: "4–6 weeks", description: "Connect server logic, authentication and databases.", topics: ["Node.js", "REST APIs", "SQL", "Authentication"], project: "Full-stack e-commerce platform" },
    { title: "Ship professionally", duration: "2–3 weeks", description: "Test, deploy and present your work.", topics: ["Testing", "Performance", "Deployment", "Portfolio"], project: "Deploy three polished projects" },
  ],
  "AI / ML Engineer": [
    { title: "Strengthen Python and maths", duration: "4 weeks", description: "Build the foundation needed for machine learning.", topics: ["Python", "NumPy", "Statistics", "Linear algebra"], project: "Data exploration notebook" },
    { title: "Learn practical machine learning", duration: "5–6 weeks", description: "Train, evaluate and improve common models.", topics: ["Pandas", "Scikit-learn", "Features", "Evaluation"], project: "Career prediction model" },
    { title: "Explore deep learning", duration: "5 weeks", description: "Understand neural networks and modern AI workflows.", topics: ["Neural networks", "NLP", "Computer vision", "Responsible AI"], project: "Text classification app" },
    { title: "Deploy an AI product", duration: "3 weeks", description: "Serve a model through a useful application.", topics: ["APIs", "Model serving", "Monitoring", "Portfolio"], project: "Deployed AI web application" },
  ],
  "UI/UX Designer": [
    { title: "Learn design foundations", duration: "3 weeks", description: "Practice hierarchy, color, spacing and typography.", topics: ["Visual hierarchy", "Typography", "Color", "Accessibility"], project: "Mobile app visual redesign" },
    { title: "Understand users", duration: "4 weeks", description: "Research real problems and organize useful flows.", topics: ["Interviews", "Personas", "User flows", "Information architecture"], project: "User research case study" },
    { title: "Prototype and test", duration: "4 weeks", description: "Create interactive experiences and validate them.", topics: ["Wireframes", "Figma", "Prototypes", "Usability testing"], project: "High-fidelity product prototype" },
    { title: "Build your portfolio", duration: "2 weeks", description: "Turn your process into convincing case studies.", topics: ["Storytelling", "Case studies", "Presentation", "Portfolio"], project: "Three-case-study portfolio" },
  ],
  Entrepreneur: [
    { title: "Find a real problem", duration: "2–3 weeks", description: "Research customers before building a solution.", topics: ["Customer interviews", "Problem selection", "Market research", "Positioning"], project: "Validated problem report" },
    { title: "Build and test an MVP", duration: "4 weeks", description: "Create the smallest useful version and gather evidence.", topics: ["MVP", "Prototyping", "Pricing", "Feedback"], project: "Working MVP" },
    { title: "Learn sales and marketing", duration: "4 weeks", description: "Acquire early users with repeatable outreach.", topics: ["Sales", "Content", "Outreach", "Analytics"], project: "First 10-customer campaign" },
    { title: "Improve the business", duration: "Ongoing", description: "Track money, retention and customer outcomes.", topics: ["Finance", "Operations", "Retention", "Growth"], project: "90-day growth plan" },
  ],
};

function defaultRoadmap(career: string): RoadmapStep[] {
  return [
    { title: `Understand ${career}`, duration: "1 week", description: "Study the role, tools and entry-level expectations.", topics: ["Role research", "Job descriptions", "Core skills"], project: "Career requirements checklist" },
    { title: "Build core skills", duration: "4–6 weeks", description: "Learn the most important foundations through practice.", topics: ["Fundamentals", "Guided practice", "Feedback"], project: "Foundation project" },
    { title: "Create portfolio evidence", duration: "4 weeks", description: "Apply your skills to a realistic project.", topics: ["Planning", "Execution", "Documentation"], project: `${career} portfolio project` },
    { title: "Prepare for opportunities", duration: "2 weeks", description: "Polish your profile and start applying consistently.", topics: ["Resume", "Portfolio", "Interviews", "Networking"], project: "Application-ready profile" },
  ];
}

export default function RoadmapPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfile(readProfile());
      try {
        const saved = JSON.parse(localStorage.getItem("aspire-roadmap-progress") || "[]");
        setCompleted(Array.isArray(saved) ? saved.filter(Number.isInteger) : []);
      } catch { setCompleted([]); }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const steps = useMemo(() => profile ? (sharedRoadmaps[profile.career] ?? defaultRoadmap(profile.career)) : [], [profile]);
  const validCompleted = completed.filter((index) => index >= 0 && index < steps.length);
  const progress = steps.length ? Math.round((validCompleted.length / steps.length) * 100) : 0;

  function toggleStep(index: number) {
    const next = completed.includes(index) ? completed.filter((item) => item !== index) : [...completed, index];
    setCompleted(next);
    localStorage.setItem("aspire-roadmap-progress", JSON.stringify(next));
  }

  if (!loaded) return <main className="min-h-screen bg-[#050708]" />;
  if (!profile) return <main className="flex min-h-screen items-center justify-center bg-[#050708] px-6 text-white"><section className="card max-w-xl p-10 text-center"><p className="eyebrow">Roadmap unavailable</p><h1 className="mt-4 text-3xl font-bold">Create your career profile first.</h1><Link href="/assessment" className="button-primary mt-8 px-7 py-3">Start assessment →</Link></section></main>;

  return (
    <main className="min-h-screen bg-[#050708] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between"><Link href="/" className="font-semibold">Aspire AI</Link><Link href="/dashboard" className="text-sm text-white/45 hover:text-white">← Dashboard</Link></header>
        <section className="mt-14">
          <p className="eyebrow">Personalized roadmap</p>
          <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><h1 className="text-4xl font-bold md:text-6xl">{profile.career}</h1><p className="mt-4 max-w-2xl text-white/45">Complete each phase in order and turn knowledge into portfolio evidence.</p></div>
            <div className="card min-w-48 p-5"><div className="flex justify-between text-sm"><span className="text-white/40">Roadmap progress</span><strong className="text-cyan-300">{progress}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} /></div></div>
          </div>
          <div className="mt-10 space-y-5">
            {steps.map((item, index) => {
              const done = completed.includes(index);
              return <article key={item.title} className={`card p-6 md:p-8 ${done ? "border-cyan-300/30 bg-cyan-300/[0.05]" : ""}`}><div className="flex gap-5"><button type="button" aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${item.title}`} onClick={() => toggleStep(index)} className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${done ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/15 text-transparent"}`}>✓</button><div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Phase {index + 1}</p><h2 className="mt-2 text-2xl font-semibold">{item.title}</h2></div><span className="text-sm text-white/35">{item.duration}</span></div><p className="mt-3 text-white/45">{item.description}</p><div className="mt-5 flex flex-wrap gap-2">{item.topics.map((topic) => <span key={topic} className="rounded-full bg-white/[0.05] px-3 py-1.5 text-xs text-white/45">{topic}</span>)}</div><div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4 text-sm"><span className="text-white/35">Project: </span><span className="text-white/75">{item.project}</span></div></div></div></article>;
            })}
          </div>
          <div className="mt-8 text-center text-sm text-white/35">Assessment match: <span className="text-cyan-300">{profile.matchPercentage}%</span> · This page never recalculates it.</div>
        </section>
      </div>
    </main>
  );
}
