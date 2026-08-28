import { careerCatalog, type CareerDefinition, type Profile } from "../../_lib/career-data";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type AssistantRequest = {
  profile?: Profile | null;
  completed?: number[];
  messages?: ChatMessage[];
  question?: string;
};

type OpenAIResponse = {
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
    Array.isArray(profile.skills) &&
    Array.isArray(profile.interests)
  );
}

function cleanCompleted(completed: unknown, career: CareerDefinition) {
  if (!Array.isArray(completed)) return [];
  return completed.filter(
    (item): item is number =>
      Number.isInteger(item) && item >= 0 && item < career.roadmap.length,
  );
}

function getMissingSkills(profile: Profile, career: CareerDefinition) {
  return career.skills.filter((skill) => !profile.skills.includes(skill));
}

function localAnswer(
  question: string,
  profile: Profile,
  career: CareerDefinition,
  completed: number[],
) {
  const lower = question.toLowerCase();
  const missingSkills = getMissingSkills(profile, career);
  const nextPhase = career.roadmap.find((_, index) => !completed.includes(index));
  const progress = career.roadmap.length
    ? Math.round((completed.length / career.roadmap.length) * 100)
    : 0;

  if (lower.includes("learn") || lower.includes("next") || lower.includes("study")) {
    if (nextPhase) {
      return `Your next roadmap phase is “${nextPhase.title}”. Focus first on ${nextPhase.topics.slice(0, 3).join(", ")}. A strong milestone is: ${nextPhase.project}.`;
    }
    return `You have completed every current ${profile.career} roadmap phase. Deepen your strongest projects, improve documentation, practise interviews and start applying for real opportunities.`;
  }

  if (lower.includes("missing") || lower.includes("gap") || lower.includes("weak") || lower.includes("skill")) {
    if (!missingSkills.length) {
      return `Your profile already contains all of the core skills Aspire AI tracks for ${profile.career}. Focus on depth now: stronger projects, better documentation and practical experience.`;
    }
    return `Your current core skill gaps are ${missingSkills.join(", ")}. Start with ${missingSkills.slice(0, 2).join(" and ")} instead of trying to learn everything at once.`;
  }

  if (lower.includes("project") || lower.includes("portfolio") || lower.includes("build")) {
    const project = nextPhase?.project ?? career.roadmap.at(-1)?.project;
    return `Build this next: ${project}. Present it as problem → approach → tools → demo → result → what you learned.`;
  }

  if (lower.includes("match") || lower.includes("score") || lower.includes("percent") || lower.includes("improve")) {
    const focus = missingSkills.slice(0, 3);
    return `Your saved assessment match is ${profile.matchPercentage}%. Aspire AI does not recalculate that score outside the assessment. To improve a future reassessment, build real evidence around ${focus.length ? focus.join(", ") : "deeper projects and experience"}, then retake the assessment when your profile has actually changed.`;
  }

  if (lower.includes("roadmap") || lower.includes("progress")) {
    return `Your ${profile.career} roadmap is ${progress}% complete: ${completed.length} of ${career.roadmap.length} phases. ${nextPhase ? `Your next phase is “${nextPhase.title}”.` : "You have completed the current roadmap."}`;
  }

  if (lower.includes("interview") || lower.includes("job") || lower.includes("internship") || lower.includes("apply")) {
    return `For ${profile.career}, prepare four things: a focused one-page resume, 2–3 strong projects, short explanations of your decisions, and repeated mock interview practice. Apply while you continue the roadmap.`;
  }

  if (lower.includes("resume") || lower.includes("cv")) {
    return `For a ${profile.career} resume, lead with relevant skills and projects. For every project, state what you built, the tools you used and the result. Remove unrelated filler and keep it easy to scan.`;
  }

  return `For your ${profile.career} goal, the best next action is to follow the roadmap in order and turn each phase into visible evidence. Ask me about skills, projects, your saved match score, roadmap progress, your resume or interviews.`;
}

function extractText(data: OpenAIResponse) {
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

function buildContext(
  profile: Profile,
  career: CareerDefinition,
  completed: number[],
  messages: ChatMessage[],
  question: string,
) {
  const missingSkills = getMissingSkills(profile, career);
  const nextPhase = career.roadmap.find((_, index) => !completed.includes(index));
  const progress = career.roadmap.length
    ? Math.round((completed.length / career.roadmap.length) * 100)
    : 0;

  const roadmap = career.roadmap
    .map(
      (phase, index) =>
        `${index + 1}. ${phase.title} (${phase.duration}) — ${phase.description} Topics: ${phase.topics.join(", ")}. Project: ${phase.project}. ${completed.includes(index) ? "COMPLETED" : "NOT COMPLETED"}`,
    )
    .join("\n");

  const history = messages
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.text.slice(0, 800)}`)
    .join("\n");

  return `ASPIRE AI PROFILE\nCareer: ${profile.career}\nCareer summary: ${career.summary}\nSaved assessment match: ${profile.matchPercentage}%\nEducation: ${profile.education}\nExperience: ${profile.experience}\nSelected skills: ${profile.skills.join(", ") || "None"}\nInterests: ${profile.interests.join(", ") || "None"}\nCore missing skills: ${missingSkills.join(", ") || "None"}\nRoadmap progress: ${progress}% (${completed.length}/${career.roadmap.length})\nNext roadmap phase: ${nextPhase?.title ?? "All current phases complete"}\n\nROADMAP\n${roadmap}\n\nRECENT CONVERSATION\n${history || "No previous messages"}\n\nCURRENT USER QUESTION\n${question}`;
}

export async function POST(request: Request) {
  let body: AssistantRequest;

  try {
    body = (await request.json()) as AssistantRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim().slice(0, 1600) : "";
  if (!question) {
    return Response.json({ error: "Please ask a question." }, { status: 400 });
  }

  if (!isProfile(body.profile)) {
    return Response.json(
      {
        answer: "Complete the career assessment first so I can use your saved profile.",
        mode: "local",
      },
      { status: 200 },
    );
  }

  const profile = body.profile;
  const career = careerCatalog[profile.career];
  if (!career) {
    return Response.json(
      {
        answer: "I could not find the saved career definition. Please retake the assessment once.",
        mode: "local",
      },
      { status: 200 },
    );
  }

  const completed = cleanCompleted(body.completed, career);
  const messages = Array.isArray(body.messages)
    ? body.messages.filter(
        (message): message is ChatMessage =>
          Boolean(message) &&
          (message.role === "assistant" || message.role === "user") &&
          typeof message.text === "string",
      )
    : [];

  const fallback = localAnswer(question, profile, career, completed);
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
        instructions:
          "You are Aspire AI, a practical and concise career coach inside a student career-planning product. Personalize only from the provided Aspire profile and roadmap context. The saved assessment match percentage is authoritative: never recalculate, replace or invent a different score. Distinguish career-match score from roadmap-completion percentage. Give concrete next actions and project ideas. Do not claim access to live job-market data, private accounts or facts not present in the supplied context. Keep most answers under 180 words unless the user asks for detail.",
        input: buildContext(profile, career, completed, messages, question),
        max_output_tokens: 500,
        store: false,
      }),
    });

    if (!response.ok) {
      console.error("Aspire AI provider request failed:", response.status);
      return Response.json({ answer: fallback, mode: "local" });
    }

    const data = (await response.json()) as OpenAIResponse;
    const answer = extractText(data);

    if (!answer) {
      return Response.json({ answer: fallback, mode: "local" });
    }

    return Response.json({ answer, mode: "ai" });
  } catch (error) {
    console.error("Aspire AI provider request failed:", error);
    return Response.json({ answer: fallback, mode: "local" });
  }
}
