"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppNav from "../_components/app-nav";
import { useApplications } from "../_lib/application-store";
import { careerCatalog, type CareerDefinition } from "../_lib/career-data";
import {
  type InterviewCategory,
  type InterviewPracticeRecord,
  interviewCategories,
  useInterviewPractice,
} from "../_lib/interview-store";
import { type PortfolioEvidence, usePortfolioEvidence } from "../_lib/portfolio-store";
import { useProfile } from "../_lib/profile-store";

type InterviewQuestion = {
  id: string;
  category: InterviewCategory;
  question: string;
  prompt: string;
};

const fieldClass = "w-full rounded-[.7rem] border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]";

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function buildQuestions(career: CareerDefinition, portfolio: PortfolioEvidence[]): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [
    {
      id: "intro-story",
      category: "Introduction",
      question: `Tell me about yourself and how your background is leading you toward ${career.title}.`,
      prompt: "Keep it to 60–90 seconds: current position → relevant proof → target direction → why now.",
    },
    {
      id: "role-why",
      category: "Role",
      question: `Why do you want to work as a ${career.title}?`,
      prompt: "Connect your motivation to the actual work, not only salary, title or trends.",
    },
    {
      id: "role-good-work",
      category: "Role",
      question: `What does strong work look like for a ${career.title}?`,
      prompt: `Use the role itself: ${career.summary}`,
    },
  ];

  career.skills.slice(0, 5).forEach((skill, index) => {
    questions.push({
      id: `technical-${index}-${slug(skill)}`,
      category: "Technical",
      question: `Explain ${skill} in your own words. Where would you use it, and what is one limitation or trade-off?`,
      prompt: "A good answer has: simple definition → real use case → trade-off → example from your work or learning.",
    });
  });

  const projectSources = portfolio.length
    ? portfolio.slice(0, 3).map((item) => ({
        id: `project-evidence-${item.id}`,
        title: item.projectTitle,
        outcome: item.outcome,
      }))
    : career.roadmap.slice(0, 3).map((phase, index) => ({
        id: `project-roadmap-${index}`,
        title: phase.project,
        outcome: "",
      }));

  projectSources.forEach((project) => {
    questions.push({
      id: project.id,
      category: "Project",
      question: `Walk me through “${project.title}”. What problem did you solve, what did you personally do, and what was the result?`,
      prompt: project.outcome
        ? `Your saved outcome starts with: ${project.outcome.slice(0, 140)}`
        : "Use problem → constraints → your decisions → implementation → result → what you would improve.",
    });
  });

  questions.push(
    {
      id: "behavioral-challenge",
      category: "Behavioral",
      question: "Tell me about a difficult problem you faced and how you worked through it.",
      prompt: "Use STAR: Situation → Task → Action → Result. Spend most of the answer on your Action.",
    },
    {
      id: "behavioral-mistake",
      category: "Behavioral",
      question: "Tell me about a mistake or failed attempt. What did you change afterward?",
      prompt: "Choose a real example, own your part, explain the correction and show what changed in your process.",
    },
    {
      id: "behavioral-collaboration",
      category: "Behavioral",
      question: "Describe a time you had to work with someone who had a different opinion or approach.",
      prompt: "Show listening, reasoning and outcome. Avoid turning the other person into the villain of the story.",
    },
    {
      id: "behavioral-priority",
      category: "Behavioral",
      question: "How do you decide what to do first when several important tasks compete for your time?",
      prompt: "Give a method and one concrete example rather than saying only that you are good at time management.",
    },
  );

  return questions;
}

function checklist(category: InterviewCategory) {
  if (category === "Introduction") return ["Current position", "Relevant proof", "Target role", "Why now"];
  if (category === "Technical") return ["Simple explanation", "Use case", "Trade-off", "Concrete example"];
  if (category === "Project") return ["Problem", "Your contribution", "Key decisions", "Outcome / learning"];
  if (category === "Behavioral") return ["Situation", "Task", "Action", "Result"];
  return ["Role understanding", "Motivation", "Relevant evidence", "Specific reasoning"];
}

export default function InterviewPage() {
  const profile = useProfile();
  const { applications } = useApplications();
  const { evidence } = usePortfolioEvidence();
  const { practice, saveInterviewPractice } = useInterviewPractice();
  const [filter, setFilter] = useState<"All" | InterviewCategory>("All");
  const [selectedId, setSelectedId] = useState("intro-story");
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [savedNotice, setSavedNotice] = useState("");

  const careerName = profile?.career ?? "";
  const career = careerName ? careerCatalog[careerName] : null;
  const currentPortfolio = useMemo(
    () => evidence.filter((item) => item.career === careerName),
    [evidence, careerName],
  );
  const questions = useMemo(
    () => (career ? buildQuestions(career, currentPortfolio) : []),
    [career, currentPortfolio],
  );
  const currentPractice = useMemo(
    () => practice.filter((item) => item.career === careerName),
    [practice, careerName],
  );

  if (!profile || !career) return <NoProfile />;

  const visibleQuestions = filter === "All"
    ? questions
    : questions.filter((item) => item.category === filter);
  const selectedQuestion = questions.find((item) => item.id === selectedId) ?? questions[0];
  const uniquePracticed = new Set(currentPractice.map((item) => item.questionId)).size;
  const averageConfidence = currentPractice.length
    ? currentPractice.reduce((total, item) => total + item.confidence, 0) / currentPractice.length
    : 0;
  const interviewApplications = applications.filter((item) => item.stage === "Interview").length;
  const readyProjects = currentPortfolio.filter((item) => item.status === "Ready" || item.status === "Published").length;

  const categoryStats = interviewCategories.map((category) => {
    const records = currentPractice.filter((item) => item.category === category);
    const average = records.length
      ? records.reduce((total, item) => total + item.confidence, 0) / records.length
      : 0;
    return { category, attempts: records.length, average };
  });
  const weakest = categoryStats
    .filter((item) => item.attempts > 0)
    .sort((a, b) => a.average - b.average)[0] ?? null;

  function latestFor(questionId: string) {
    return currentPractice.find((item) => item.questionId === questionId) ?? null;
  }

  function chooseQuestion(question: InterviewQuestion) {
    const latest = latestFor(question.id);
    setSelectedId(question.id);
    setAnswer(latest?.answer ?? "");
    setConfidence(latest?.confidence ?? 3);
    setSavedNotice("");
  }

  function saveAttempt() {
    if (!selectedQuestion) return;
    const record: InterviewPracticeRecord = {
      id: crypto.randomUUID(),
      career: careerName,
      questionId: selectedQuestion.id,
      question: selectedQuestion.question,
      category: selectedQuestion.category,
      answer: answer.trim(),
      confidence,
      practicedAt: new Date().toISOString(),
    };
    saveInterviewPractice([record, ...practice]);
    setSavedNotice("Practice saved");
  }

  function nextQuestion() {
    if (!selectedQuestion || !questions.length) return;
    const index = questions.findIndex((item) => item.id === selectedQuestion.id);
    const next = questions[(index + 1) % questions.length];
    chooseQuestion(next);
  }

  return (
    <main className="page-shell">
      <AppNav active="assistant" />

      <section className="page-container py-10 md:py-14">
        <div className="grid gap-8 border-b border-[var(--line-strong)] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Interview preparation</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] md:text-6xl">
              Practice answers tied to your actual career plan.
            </h1>
            <p className="text-muted mt-4 max-w-3xl text-lg leading-8">
              Questions are built from {careerName}, its core skills and your own portfolio evidence. Confidence is self-rated practice data — not an automated hiring prediction.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/portfolio" className="button-secondary">Review portfolio</Link>
            <Link href="/applications" className="button-primary">Open applications</Link>
          </div>
        </div>

        <section className="grid gap-0 border-b border-[var(--line-strong)] md:grid-cols-4">
          {[
            ["Questions practiced", `${uniquePracticed}/${questions.length}`, "unique prompts"],
            ["Practice attempts", `${currentPractice.length}`, "saved rehearsals"],
            ["Avg confidence", averageConfidence ? `${averageConfidence.toFixed(1)}/5` : "—", "self-rated"],
            ["Interview pipeline", `${interviewApplications}`, `${readyProjects} portfolio-ready projects`],
          ].map(([label, value, note], index) => (
            <div key={label} className={`py-7 ${index ? "border-t border-[var(--line)] md:border-l md:border-t-0 md:pl-6" : ""}`}>
              <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">{label}</p>
              <div className="metric-number mt-2 text-3xl font-semibold">{value}</div>
              <p className="text-faint mt-1 text-xs">{note}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 py-10 lg:grid-cols-[.82fr_1.18fr]">
          <aside>
            <div className="flex flex-wrap gap-2">
              {(["All", ...interviewCategories] as const).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilter(category)}
                  className={filter === category ? "status-pill status-pill-success" : "status-pill"}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-5 border-y border-[var(--line)]">
              {visibleQuestions.map((question) => {
                const latest = latestFor(question.id);
                const active = selectedQuestion?.id === question.id;
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => chooseQuestion(question)}
                    className={`block w-full border-b border-[var(--line)] px-1 py-5 text-left last:border-b-0 ${active ? "bg-[var(--accent-soft)]" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-faint text-xs font-bold uppercase tracking-[.07em]">{question.category}</span>
                      {latest && <span className="text-faint text-xs">Latest {latest.confidence}/5</span>}
                    </div>
                    <p className="mt-2 pr-3 text-sm font-semibold leading-6">{question.question}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          {selectedQuestion && (
            <div className="panel p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="status-pill">{selectedQuestion.category}</span>
                <span className="text-faint text-xs">Question {questions.findIndex((item) => item.id === selectedQuestion.id) + 1} of {questions.length}</span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold leading-9 tracking-[-0.025em]">{selectedQuestion.question}</h2>
              <p className="text-muted mt-3 text-sm leading-6">{selectedQuestion.prompt}</p>

              <div className="mt-6 border-y border-[var(--line)] py-5">
                <p className="text-faint text-xs font-bold uppercase tracking-[.07em]">Answer checklist</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {checklist(selectedQuestion.category).map((item) => <span key={item} className="status-pill">{item}</span>)}
                </div>
              </div>

              <label className="mt-6 block text-sm font-semibold">
                Practice answer / notes
                <textarea
                  value={answer}
                  onChange={(event) => { setAnswer(event.target.value); setSavedNotice(""); }}
                  className={`${fieldClass} mt-2 min-h-52 resize-y`}
                  placeholder="Write the structure you want to say out loud. Keep it natural rather than memorizing every word."
                />
              </label>

              <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <p className="text-sm font-semibold">How confident do you feel answering this out loud?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setConfidence(value); setSavedNotice(""); }}
                        className={confidence === value ? "button-primary min-w-10" : "button-secondary min-w-10"}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <p className="text-faint mt-2 text-xs">1 = not ready · 5 = can explain clearly without notes</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={nextQuestion} className="button-secondary">Next question</button>
                  <button type="button" onClick={saveAttempt} className="button-primary">Save practice</button>
                </div>
              </div>
              {savedNotice && <p className="mt-4 text-sm font-semibold text-[var(--success)]">{savedNotice} ✓</p>}
            </div>
          )}
        </section>

        <section className="grid gap-8 border-t border-[var(--line-strong)] py-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Practice pattern</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">Know where repetition is needed.</h2>
            <div className="mt-6 border-y border-[var(--line)]">
              {categoryStats.map((item) => (
                <div key={item.category} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-[var(--line)] py-4 last:border-b-0">
                  <span className="text-sm font-semibold">{item.category}</span>
                  <span className="text-faint text-xs">{item.attempts} attempts</span>
                  <span className="metric-number min-w-12 text-right text-sm font-semibold">{item.attempts ? item.average.toFixed(1) : "—"}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow">Next focus</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">
              {weakest ? `${weakest.category} needs the most repetition.` : "Start with one answer from each category."}
            </h2>
            <p className="text-muted mt-4 leading-7">
              {weakest
                ? `Your current self-rated average for ${weakest.category.toLowerCase()} practice is ${weakest.average.toFixed(1)}/5. Re-answer those prompts out loud and replace vague claims with concrete examples.`
                : "Practice is more useful when you answer out loud, review the structure, and try again. The saved notes are a rehearsal aid, not a script to memorize word for word."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/portfolio" className="button-secondary">Strengthen project stories</Link>
              <Link href="/assistant" className="button-primary">Ask career coach</Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function NoProfile() {
  return (
    <main className="page-shell">
      <AppNav active="assistant" />
      <section className="page-container py-20">
        <div className="max-w-2xl border-t border-[var(--line-strong)] pt-8">
          <p className="eyebrow">Interview preparation</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">Interview practice needs a target career first.</h1>
          <p className="text-muted mt-4 leading-7">Complete the assessment so Aspire can build a role-specific question set from the same career profile used across your roadmap and portfolio.</p>
          <Link href="/assessment" className="button-primary mt-7">Open assessment</Link>
        </div>
      </section>
    </main>
  );
}
