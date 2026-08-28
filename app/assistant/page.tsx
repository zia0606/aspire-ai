"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { careerRequirements, Profile, readProfile } from "../_lib/career-data";

type Message = { role: "assistant" | "user"; text: string };

export default function AssistantPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Hi! Ask me what to learn next, which project to build, or how to improve your career match." }]);
  useEffect(() => {
    const timer = window.setTimeout(() => setProfile(readProfile()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function answer(question: string) {
    if (!profile) return "Complete the assessment first so I can use your career, skills and interests.";
    const requirements = careerRequirements[profile.career];
    const gaps = requirements?.skills.filter((skill) => !profile.skills.includes(skill)) ?? [];
    const lower = question.toLowerCase();
    if (lower.includes("skill") || lower.includes("learn") || lower.includes("next")) return gaps.length ? `For ${profile.career}, start with ${gaps.slice(0, 3).join(", ")}. Focus on one at a time and build a small project after each.` : `You already cover the core ${profile.career} skills. Strengthen them through larger projects, testing and deployment.`;
    if (lower.includes("project") || lower.includes("portfolio")) return `Build one realistic ${profile.career} project that solves a clear problem. Document the problem, your process, the tools you used and the measurable result.`;
    if (lower.includes("score") || lower.includes("match") || lower.includes("percent")) return `Your saved career match is ${profile.matchPercentage}%. The score comes from the assessment only; Dashboard and Roadmap do not change it.`;
    if (lower.includes("job") || lower.includes("interview")) return `Prepare a focused resume for ${profile.career}, publish your best projects, practise explaining your decisions, and apply consistently to internships and entry-level roles.`;
    return `For your ${profile.career} goal, follow the roadmap in order and turn every learning phase into a visible project. Ask me specifically about skills, projects, your score or interview preparation.`;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setMessages((items) => [...items, { role: "user", text: question }, { role: "assistant", text: answer(question) }]);
    setInput("");
  }

  return (
    <main className="min-h-screen bg-[#050708] px-6 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col">
        <header className="flex items-center justify-between"><Link href="/" className="font-semibold">Aspire AI</Link><Link href="/dashboard" className="text-sm text-white/45 hover:text-white">← Dashboard</Link></header>
        <section className="mt-10 flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 p-6"><p className="eyebrow">Career assistant</p><h1 className="mt-2 text-2xl font-bold">Ask about your next move</h1><p className="mt-2 text-sm text-white/40">{profile ? `Personalized for ${profile.career}` : "Complete your assessment for personalized answers"}</p></div>
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><p className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-cyan-300 text-black" : "bg-white/[0.06] text-white/70"}`}>{message.text}</p></div>)}
          </div>
          <form onSubmit={submit} className="flex gap-3 border-t border-white/10 p-4"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="What should I learn next?" className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/50" /><button className="button-primary px-6 py-3" type="submit">Send</button></form>
        </section>
      </div>
    </main>
  );
}
