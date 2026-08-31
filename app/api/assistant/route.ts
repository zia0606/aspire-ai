import { careerCatalog, type CareerDefinition, type Profile } from "../../_lib/career-data";
import {
  buildCoachContext,
  coachInstructions,
  localCoachAnswer,
  type CoachApplicationItem,
  type CoachInterviewItem,
  type CoachMessage,
  type CoachPortfolioItem,
  type CoachWorkspace,
} from "../../_lib/coach-engine";

type AssistantRequest = {
  profile?: unknown;
  completed?: unknown;
  messages?: unknown;
  portfolio?: unknown;
  applications?: unknown;
  interviewPractice?: unknown;
  question?: unknown;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export const runtime = "nodejs";

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<Profile>;
  return (
    profile.version === 2 &&
    typeof profile.education === "string" &&
    typeof profile.career === "string" &&
    typeof profile.experience === "string" &&
    typeof profile.matchPercentage === "number" &&
    Number.isFinite(profile.matchPercentage) &&
    Array.isArray(profile.skills) &&
    profile.skills.every((skill) => typeof skill === "string") &&
    Array.isArray(profile.interests) &&
    profile.interests.every((interest) => typeof interest === "string") &&
    Boolean(profile.matchBreakdown) &&
    typeof profile.matchBreakdown?.education === "number" &&
    typeof profile.matchBreakdown?.skills === "number" &&
    typeof profile.matchBreakdown?.interests === "number" &&
    typeof profile.matchBreakdown?.experience === "number"
  );
}

function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanCompleted(value: unknown, career: CareerDefinition | null) {
  if (!career || !Array.isArray(value)) return [];
  return value.filter(
    (item): item is number =>
      Number.isInteger(item) && item >= 0 && item < career.roadmap.length,
  );
}

function cleanMessages(value: unknown): CoachMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { role: "assistant" | "user"; text: string } => {
      if (!item || typeof item !== "object") return false;
      const message = item as { role?: unknown; text?: unknown };
      return (
        (message.role === "assistant" || message.role === "user") &&
        typeof message.text === "string"
      );
    })
    .slice(-10)
    .map((message) => ({ role: message.role, text: message.text.slice(0, 1000) }));
}

function cleanPortfolio(value: unknown): CoachPortfolioItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .slice(0, 60)
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        career: cleanText(record.career, 120),
        phaseTitle: cleanText(record.phaseTitle, 160),
        projectTitle: cleanText(record.projectTitle, 220),
        status: cleanText(record.status, 40),
        problem: cleanText(record.problem, 800),
        approach: cleanText(record.approach, 800),
        outcome: cleanText(record.outcome, 800),
        skills: Array.isArray(record.skills)
          ? record.skills.filter((skill): skill is string => typeof skill === "string").slice(0, 30)
          : [],
      };
    })
    .filter((item) => item.projectTitle || item.problem || item.outcome);
}

function cleanApplications(value: unknown): CoachApplicationItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .slice(0, 100)
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        company: cleanText(record.company, 160),
        role: cleanText(record.role, 180),
        stage: cleanText(record.stage, 40),
        location: cleanText(record.location, 160),
        nextAction: cleanText(record.nextAction, 400),
        dueDate: cleanText(record.dueDate, 40),
        notes: cleanText(record.notes, 600),
      };
    })
    .filter((item) => item.company || item.role || item.nextAction);
}

function cleanInterviewPractice(value: unknown): CoachInterviewItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .slice(0, 100)
    .map((item) => {
      const record = item as Record<string, unknown>;
      const confidence = typeof record.confidence === "number" && Number.isFinite(record.confidence)
        ? Math.min(5, Math.max(1, Math.round(record.confidence)))
        : 1;
      return {
        career: cleanText(record.career, 120),
        question: cleanText(record.question, 700),
        category: cleanText(record.category, 80),
        answer: cleanText(record.answer, 1200),
        confidence,
        practicedAt: cleanText(record.practicedAt, 80),
      };
    })
    .filter((item) => item.question || item.answer);
}

function extractText(data: OpenAIResponse) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        const text = content.text.trim();
        if (text) return text;
      }
    }
  }

  return "";
}

export async function POST(request: Request) {
  let body: AssistantRequest;

  try {
    body = (await request.json()) as AssistantRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question = cleanText(body.question, 2000);
  if (!question) {
    return Response.json({ error: "Please ask a question." }, { status: 400 });
  }

  const profile = isProfile(body.profile) ? body.profile : null;
  const career = profile ? careerCatalog[profile.career] ?? null : null;
  const completed = cleanCompleted(body.completed, career);
  const messages = cleanMessages(body.messages);
  const portfolio = cleanPortfolio(body.portfolio);
  const applications = cleanApplications(body.applications);
  const interviewPractice = cleanInterviewPractice(body.interviewPractice);

  const workspace: CoachWorkspace = {
    profile,
    career,
    completed,
    portfolio,
    applications,
    interviewPractice,
    messages,
    question,
  };

  const fallback = localCoachAnswer(workspace);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json({ answer: fallback, mode: "local" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.4",
        instructions: coachInstructions,
        input: buildCoachContext(workspace),
        max_output_tokens: 750,
        store: false,
      }),
    });

    if (!response.ok) {
      console.error("Aspire Coach provider request failed:", response.status);
      return Response.json({ answer: fallback, mode: "local" });
    }

    const data = (await response.json()) as OpenAIResponse;
    const answer = extractText(data);

    if (!answer) {
      return Response.json({ answer: fallback, mode: "local" });
    }

    return Response.json({ answer, mode: "ai" });
  } catch (error) {
    console.error("Aspire Coach provider request failed:", error);
    return Response.json({ answer: fallback, mode: "local" });
  }
}
