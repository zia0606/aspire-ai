import { careerCatalog, type CareerDefinition, type Profile } from "../../_lib/career-data";
import { getAuth } from "../../_lib/server/auth";
import { getDatabasePool } from "../../_lib/server/database";

type ResumeRequest = {
  profile?: Profile | null;
  resumeText?: string;
};

type OpenAIResponse = {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
};

type SectionCheck = { label: string; found: boolean };

export const runtime = "nodejs";

const skillAliases: Record<string, string[]> = {
  "C / C++": ["c++", "c programming", "c language"],
  "Git & GitHub": ["git", "github"],
  "AI / Machine Learning": ["machine learning", "artificial intelligence", " ai ", "ml"],
  "Microsoft Excel": ["excel", "microsoft excel"],
  "UI/UX": ["ui/ux", "user interface", "user experience"],
  "Project Management": ["project management", "project manager"],
  "Business Analytics": ["business analytics", "business analysis"],
  "Data Analysis": ["data analysis", "data analytics"],
};

const actionVerbs = [
  "built", "created", "developed", "designed", "implemented", "improved", "increased",
  "reduced", "launched", "managed", "led", "analyzed", "automated", "optimized", "delivered",
  "deployed", "engineered", "organized", "coordinated", "researched", "produced",
];

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<Profile>;
  return profile.version === 2 && typeof profile.career === "string" &&
    typeof profile.matchPercentage === "number" && Array.isArray(profile.skills) &&
    Array.isArray(profile.interests);
}

function normalize(value: string) {
  return ` ${value.toLowerCase().replace(/\s+/g, " ").trim()} `;
}

function hasSkill(text: string, skill: string) {
  const source = normalize(text);
  const aliases = skillAliases[skill] ?? [skill.toLowerCase()];
  return aliases.some((alias) => source.includes(normalize(alias).trim()));
}

function findSection(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.some((term) => new RegExp(`(^|\\n|\\r)\\s*${term}\\s*[:\\-]?`, "im").test(lower));
}

function buildSections(text: string): SectionCheck[] {
  const emailFound = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
  const phoneFound = /(?:\+?\d[\d\s()-]{7,}\d)/.test(text);
  return [
    { label: "Contact details", found: emailFound || phoneFound },
    { label: "Professional summary", found: findSection(text, ["summary", "profile", "objective", "professional summary"]) },
    { label: "Skills", found: findSection(text, ["skills", "technical skills", "core skills", "competencies"]) },
    { label: "Experience", found: findSection(text, ["experience", "work experience", "employment", "professional experience"]) },
    { label: "Education", found: findSection(text, ["education", "academic background", "academics"]) },
    { label: "Projects", found: findSection(text, ["projects", "project experience", "portfolio", "selected projects"]) },
  ];
}

function countActionEvidence(text: string) {
  const lower = text.toLowerCase();
  return actionVerbs.reduce((count, verb) => count + (lower.match(new RegExp(`\\b${verb}\\b`, "g"))?.length ?? 0), 0);
}

function countMetrics(text: string) {
  return text.match(/(?:\b\d+(?:\.\d+)?%|₹\s?\d+[\d,.]*|\$\s?\d+[\d,.]*|\b\d+[,.]?\d*\+?\s?(?:users|customers|clients|projects|hours|days|weeks|months|sales|leads|downloads|requests|records|students|members)\b)/gi)?.length ?? 0;
}

function getLengthScore(wordCount: number) {
  if (wordCount >= 300 && wordCount <= 850) return 100;
  if ((wordCount >= 220 && wordCount < 300) || (wordCount > 850 && wordCount <= 1050)) return 75;
  if ((wordCount >= 140 && wordCount < 220) || (wordCount > 1050 && wordCount <= 1250)) return 50;
  return 25;
}

function localAnalysis(text: string, career: CareerDefinition) {
  const detectedSkills = career.skills.filter((skill) => hasSkill(text, skill));
  const missingSkills = career.skills.filter((skill) => !detectedSkills.includes(skill));
  const keywordCoverage = career.skills.length ? Math.round((detectedSkills.length / career.skills.length) * 100) : 0;
  const sections = buildSections(text);
  const sectionCoverage = Math.round((sections.filter((item) => item.found).length / sections.length) * 100);
  const actionEvidence = countActionEvidence(text);
  const metricEvidence = countMetrics(text);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const lengthScore = getLengthScore(wordCount);
  const evidenceScore = Math.min(100, actionEvidence * 8 + metricEvidence * 15);
  const resumeScore = Math.min(100, Math.round(keywordCoverage * 0.4 + sectionCoverage * 0.25 + evidenceScore * 0.2 + lengthScore * 0.15));

  const suggestions: string[] = [];
  const missingSections = sections.filter((item) => !item.found).map((item) => item.label);
  if (missingSkills.length) suggestions.push(`If these skills are genuinely part of your experience, show evidence for ${missingSkills.slice(0, 3).join(", ")}. Do not add skills you cannot explain in an interview.`);
  if (missingSections.length) suggestions.push(`Strengthen the resume structure by adding or clearly labeling: ${missingSections.slice(0, 3).join(", ")}.`);
  if (metricEvidence < 2) suggestions.push("Add measurable outcomes where truthful: percentages, time saved, users served, projects completed, revenue, accuracy or other concrete results.");
  if (actionEvidence < 5) suggestions.push("Use stronger achievement verbs at the start of bullets, such as built, developed, analyzed, improved, automated or led.");
  if (wordCount < 220) suggestions.push("The resume looks very short. Add stronger project, skill and achievement evidence rather than filler.");
  else if (wordCount > 1050) suggestions.push("The resume is long. Remove repetition and keep the most relevant evidence for the target career.");
  if (!suggestions.length) suggestions.push("Your structure and tracked career keywords are strong. Focus next on sharper outcomes, cleaner bullet writing and tailoring each application to the actual job description.");

  return { resumeScore, keywordCoverage, sectionCoverage, evidenceScore, lengthScore, wordCount, actionEvidence, metricEvidence, detectedSkills, missingSkills, sections, suggestions: suggestions.slice(0, 5) };
}

function extractText(data: OpenAIResponse) {
  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string" && content.text.trim()) return content.text.trim();
    }
  }
  return "";
}

async function getCoachNote(resumeText: string, profile: Profile, career: CareerDefinition, analysis: ReturnType<typeof localAnalysis>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { note: "", mode: "local" as const };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.4",
        instructions: "You are Aspire AI Resume Coach. Give practical, concise resume feedback for the supplied target career. Treat the deterministic analyzer metrics as authoritative and do not invent a different score. Do not encourage users to claim skills or results they do not actually have. Mention the strongest improvement opportunities in under 130 words.",
        input: `Target career: ${profile.career}\nCareer summary: ${career.summary}\nSaved career match: ${profile.matchPercentage}%\nResume analyzer score: ${analysis.resumeScore}%\nCareer keyword coverage: ${analysis.keywordCoverage}%\nDetected career skills: ${analysis.detectedSkills.join(", ") || "None"}\nMissing career skills: ${analysis.missingSkills.join(", ") || "None"}\nMissing sections: ${analysis.sections.filter((item) => !item.found).map((item) => item.label).join(", ") || "None"}\nAction evidence count: ${analysis.actionEvidence}\nMetric evidence count: ${analysis.metricEvidence}\nWord count: ${analysis.wordCount}\n\nResume text:\n${resumeText.slice(0, 9000)}`,
        max_output_tokens: 300,
        store: false,
      }),
    });
    if (!response.ok) return { note: "", mode: "local" as const };
    const note = extractText((await response.json()) as OpenAIResponse);
    return note ? { note, mode: "ai" as const } : { note: "", mode: "local" as const };
  } catch {
    return { note: "", mode: "local" as const };
  }
}

async function saveAnalysis(request: Request, result: Record<string, unknown>) {
  const auth = getAuth();
  const database = getDatabasePool();
  if (!auth || !database) return;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return;
    await database.query(
      `insert into aspire_resume_analyses (id, user_id, target_career, resume_score, result, created_at)
       values ($1, $2, $3, $4, $5::jsonb, now())`,
      [crypto.randomUUID(), session.user.id, String(result.targetCareer ?? "Unknown"), Number(result.resumeScore ?? 0), JSON.stringify(result)],
    );
  } catch {
    // Resume feedback should still succeed if cloud history cannot be saved.
  }
}

export async function POST(request: Request) {
  let body: ResumeRequest;
  try {
    body = (await request.json()) as ResumeRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isProfile(body.profile)) return Response.json({ error: "Complete the Aspire AI assessment first." }, { status: 400 });

  const resumeText = typeof body.resumeText === "string" ? body.resumeText.trim() : "";
  if (resumeText.length < 120) return Response.json({ error: "Paste more of your resume before analyzing it." }, { status: 400 });
  if (resumeText.length > 20000) return Response.json({ error: "Resume text is too long. Keep it under 20,000 characters." }, { status: 400 });

  const career = careerCatalog[body.profile.career];
  if (!career) return Response.json({ error: "Career profile is not recognized. Retake the assessment once." }, { status: 400 });

  const analysis = localAnalysis(resumeText, career);
  const coach = await getCoachNote(resumeText, body.profile, career, analysis);
  const result = {
    ...analysis,
    coachNote: coach.note,
    mode: coach.mode,
    targetCareer: body.profile.career,
    savedCareerMatch: body.profile.matchPercentage,
  };

  await saveAnalysis(request, result);
  return Response.json(result);
}
