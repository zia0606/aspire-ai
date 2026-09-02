import { careerCatalog } from "./career-data";
import type { CoachWorkspace } from "./coach-engine";

type CoachIntent =
  | "career-decision"
  | "career-match"
  | "roadmap"
  | "skills"
  | "study-plan"
  | "course"
  | "portfolio"
  | "resume"
  | "applications"
  | "interview"
  | "rejection"
  | "offer"
  | "networking"
  | "higher-studies"
  | "business"
  | "motivation"
  | "live-market";

type CoachSignals = {
  intents: CoachIntent[];
  isFollowUp: boolean;
  isHinglish: boolean;
  wantsDetail: boolean;
  hasConflict: boolean;
  asksCurrentData: boolean;
  hoursPerDay: number | null;
  daysAvailable: number | null;
};

const intentTerms: Record<CoachIntent, string[]> = {
  "career-decision": [
    "career", "choose", "confused", "switch", "change field", "which field", "which path",
    "not sure", "dont know", "don't know", "kya karu", "kya choose", "samajh nahi",
  ],
  "career-match": ["career match", "match percentage", "match percent", "assessment score"],
  roadmap: ["roadmap", "progress", "next phase", "what next", "kya next"],
  skills: ["skill", "skills", "gap", "weak", "learn", "learning", "what should i learn", "kya sikhu"],
  "study-plan": [
    "plan", "schedule", "routine", "7 day", "7-day", "30 day", "30-day", "week plan",
    "daily plan", "hours per day", "hour per day", "time table", "timetable", "kitna time",
  ],
  course: ["course", "certificate", "certification", "bootcamp", "tutorial", "degree course"],
  portfolio: ["portfolio", "project", "github", "what to build", "build next", "project idea"],
  resume: ["resume", "cv", "ats", "cover letter"],
  applications: [
    "application", "apply", "internship", "job search", "placement", "fresher", "no experience",
    "experience nahi", "job nahi", "internship nahi",
  ],
  interview: [
    "interview", "mock", "tell me about yourself", "technical round", "hr round", "behavioral",
    "star answer", "interview kal", "interview tomorrow",
  ],
  rejection: ["rejected", "rejection", "not selected", "didn't select", "didnt select", "failed interview"],
  offer: ["offer", "job offer", "accept offer", "choose offer", "salary offer"],
  networking: ["linkedin", "network", "referral", "recruiter", "cold message", "connect with"],
  "higher-studies": ["masters", "master's", "msc", "mba", "higher studies", "postgraduate", "post graduation"],
  business: ["startup", "business", "freelance", "freelancing", "client", "entrepreneur"],
  motivation: [
    "motivation", "unmotivated", "lazy", "procrast", "overwhelmed", "burnout", "tired",
    "can't focus", "cant focus", "mann nahi", "focus nahi",
  ],
  "live-market": [
    "salary", "ctc", "package", "job market", "demand", "openings", "vacancy", "vacancies",
    "hiring", "scope", "current jobs", "latest jobs",
  ],
};

const hinglishTerms = [
  "kya", "kaise", "karu", "karna", "nahi", "mujhe", "mera", "meri", "mere", "samajh",
  "sikhu", "job nahi", "experience nahi", "interview kal", "kitna", "chahiye", "acha", "accha",
  "batao", "bata", "confuse ho", "confused hu", "confused hoon",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.%/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function getRecentConversation(workspace: CoachWorkspace) {
  return workspace.messages
    .slice(-6)
    .map((message) => `${message.role}: ${message.text}`)
    .join(" ");
}

function extractHoursPerDay(text: string) {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*(?:per|a|each)?\s*day/,
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\s*daily/,
    /(\d+(?:\.\d+)?)\s*(?:ghanta|ghante)\s*(?:daily|roz|per day)?/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value) && value > 0 && value <= 16) return value;
    }
  }

  return null;
}

function extractDaysAvailable(text: string) {
  if (text.includes("tomorrow") || text.includes("kal interview") || text.includes("interview kal")) return 1;
  if (text.includes("today") || text.includes("aaj")) return 0;

  const match = text.match(/(\d{1,3})\s*(?:days?|din)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 0 && value <= 365 ? value : null;
}

function detectIntents(text: string) {
  const normalized = normalize(text);
  return (Object.entries(intentTerms) as Array<[CoachIntent, string[]]>)
    .filter(([, terms]) => hasAny(normalized, terms))
    .map(([intent]) => intent);
}

function detectMentionedCareerTitles(text: string) {
  const normalized = normalize(text);
  const found: string[] = [];

  for (const [key, definition] of Object.entries(careerCatalog)) {
    const candidates = [key, definition.title]
      .map(normalize)
      .filter((item) => item.length >= 4);
    if (candidates.some((candidate) => normalized.includes(candidate))) {
      found.push(definition.title);
    }
  }

  return unique(found).slice(0, 4);
}

export function getCoachV3Signals(workspace: CoachWorkspace): CoachSignals {
  const current = normalize(workspace.question);
  const recent = normalize(getRecentConversation(workspace));
  const words = current.split(" ").filter(Boolean);
  const shortFollowUp = words.length <= 8 && hasAny(current, [
    "why", "why not", "how", "then", "what next", "and then", "what about me", "for me",
    "my case", "but why", "explain", "kaise", "kyu", "kyun", "phir", "mere liye",
  ]);
  const asksCurrentData = hasAny(current, [
    "current", "latest", "today", "right now", "2026", "openings", "vacancy", "vacancies",
    "hiring now", "salary now", "market now", "aaj", "abhi",
  ]) && hasAny(current, intentTerms["live-market"]);

  const currentIntents = detectIntents(current);
  const contextualIntents = shortFollowUp ? detectIntents(`${recent} ${current}`) : currentIntents;

  return {
    intents: unique(contextualIntents),
    isFollowUp: shortFollowUp,
    isHinglish: hasAny(current, hinglishTerms),
    wantsDetail: hasAny(current, [
      "detail", "detailed", "deep", "fully", "step by step", "step-by-step", "proper plan",
      "complete plan", "explain everything", "in depth",
    ]),
    hasConflict: hasAny(current, [
      " but ", "however", "although", "even though", "hate", "don't like", "dont like",
      "not interested", "scared of", "bad at", "weak in", "confused between",
    ]),
    asksCurrentData,
    hoursPerDay: extractHoursPerDay(current),
    daysAvailable: extractDaysAvailable(current),
  };
}

function getWorkspaceState(workspace: CoachWorkspace) {
  const { profile, career } = workspace;
  const validCompleted = career
    ? workspace.completed.filter((index) => Number.isInteger(index) && index >= 0 && index < career.roadmap.length)
    : [];
  const roadmapProgress = career?.roadmap.length
    ? Math.round((validCompleted.length / career.roadmap.length) * 100)
    : 0;
  const nextPhase = career?.roadmap.find((_, index) => !validCompleted.includes(index)) ?? null;
  const missingSkills = profile && career
    ? career.skills.filter((skill) => !profile.skills.includes(skill))
    : [];
  const relevantPortfolio = profile
    ? workspace.portfolio.filter((item) => item.career === profile.career)
    : workspace.portfolio;
  const proof = relevantPortfolio.find((item) => item.status === "Published")
    ?? relevantPortfolio.find((item) => item.status === "Ready")
    ?? relevantPortfolio[0]
    ?? null;
  const activeApplications = workspace.applications.filter(
    (item) => !["Rejected", "Withdrawn"].includes(item.stage),
  );
  const interviewApplications = workspace.applications.filter((item) => item.stage === "Interview");
  const relevantPractice = profile
    ? workspace.interviewPractice.filter((item) => item.career === profile.career)
    : workspace.interviewPractice;
  const averageConfidence = relevantPractice.length
    ? relevantPractice.reduce((sum, item) => sum + item.confidence, 0) / relevantPractice.length
    : 0;

  return {
    validCompleted,
    roadmapProgress,
    nextPhase,
    missingSkills,
    proof,
    activeApplications,
    interviewApplications,
    relevantPractice,
    averageConfidence,
  };
}

function conciseIntentAdvice(intent: CoachIntent, workspace: CoachWorkspace) {
  const state = getWorkspaceState(workspace);
  const careerName = workspace.profile?.career ?? "your target career";

  switch (intent) {
    case "interview":
      return state.proof
        ? `Interview: anchor your answers around “${state.proof.projectTitle}”, practise a 60–90 second introduction, then rehearse your weakest question category.`
        : "Interview: practise a short introduction, role fundamentals and one honest project/case-study story you can explain deeply.";
    case "resume":
      return state.proof
        ? `Resume: move the strongest evidence from “${state.proof.projectTitle}” near the top and describe problem → action → tools → outcome without inventing numbers.`
        : `Resume: target it to ${careerName}, remove unrelated filler and add honest project evidence instead of waiting for formal experience.`;
    case "applications":
      return `Applications: keep preparation and applying in parallel. You currently have ${state.activeApplications.length} active tracked opportunit${state.activeApplications.length === 1 ? "y" : "ies"}; every application should have a next action.`;
    case "portfolio":
      return state.nextPhase
        ? `Portfolio: use “${state.nextPhase.project}” as the next proof milestone and document decisions and results while building it.`
        : "Portfolio: improve the weakest existing proof before starting another unrelated project.";
    case "roadmap":
      return workspace.career
        ? `Roadmap: ${state.roadmapProgress}% complete. ${state.nextPhase ? `Continue “${state.nextPhase.title}” next.` : "Current phases are complete; shift toward proof, applications and interviews."}`
        : "Roadmap: first choose a realistic direction, then follow one learning sequence instead of collecting unrelated topics.";
    case "skills":
      return state.missingSkills.length
        ? `Skills: prioritize ${state.missingSkills.slice(0, 2).join(" and ")} and prove them through a project before adding more skill labels.`
        : "Skills: focus on depth and evidence rather than collecting more labels.";
    case "course":
      return `Courses: choose material that closes the next real ${careerName} gap and produces exercises or a project; certificates are supporting evidence, not the goal.`;
    case "career-decision":
      return "Career decision: compare day-to-day work, skills you are willing to practise when it gets hard, and a small project you can test before changing direction.";
    case "career-match":
      return workspace.profile
        ? `Career Match: keep the saved ${workspace.profile.matchPercentage}% as Assessment-owned context; improve real skills/evidence first and retake only when your profile has genuinely changed.`
        : "Career Match: it is created by Assessment, not invented by Coach.";
    case "rejection":
      return "Rejection: identify the most likely gap—targeting, proof, technical depth, communication or fit—fix one thing, then create the next opportunity quickly.";
    case "offer":
      return "Offer: compare role scope, learning, manager/team, hours, commute, contract/bond terms, compensation and long-term fit—not salary alone.";
    case "networking":
      return state.proof
        ? `Networking: lead with one concrete proof point such as “${state.proof.projectTitle}” and ask one small specific question.`
        : "Networking: introduce one clear target, one relevant proof point and one specific question; avoid generic job requests.";
    case "higher-studies":
      return "Higher studies: compare the program's cost/time and unique value against entering the market now; do not choose a degree only because job searching feels uncertain.";
    case "business":
      return "Business/freelancing: pick a narrow customer problem, build the smallest useful solution, show proof and talk to real potential users before expanding.";
    case "motivation":
      return state.nextPhase?.project
        ? `Momentum: shrink the target to one visible piece of “${state.nextPhase.project}” and finish that before redesigning your whole plan.`
        : "Momentum: choose one career task that can produce visible output today and finish that before opening another course.";
    case "study-plan":
      return "Plan: spend most time building/practising, then proof, then opportunity work. Keep one primary sequence instead of several simultaneous tracks.";
    case "live-market":
      return "Live market: Aspire has no real-time jobs/salary feed, so verify current numbers and openings from current postings and reputable market sources.";
  }
}

function multiPartAnswer(workspace: CoachWorkspace, signals: CoachSignals) {
  const priority: CoachIntent[] = [
    "interview", "offer", "rejection", "applications", "resume", "portfolio", "roadmap", "skills",
    "study-plan", "career-decision", "career-match", "course", "networking", "higher-studies",
    "business", "motivation", "live-market",
  ];
  const selected = priority.filter((intent) => signals.intents.includes(intent)).slice(0, 4);
  if (selected.length < 2) return "";

  const lines = selected.map((intent, index) => `${index + 1}. ${conciseIntentAdvice(intent, workspace)}`);
  const lead = signals.isHinglish
    ? "Aapke question mein multiple cheezein hain, isliye priority order mein answer:"
    : "You have a few different problems mixed together, so handle them in this order:";

  return [lead, ...lines].join("\n");
}

function constrainedPlanAnswer(workspace: CoachWorkspace, signals: CoachSignals) {
  if (!signals.intents.includes("study-plan") && signals.daysAvailable === null && signals.hoursPerDay === null) {
    return "";
  }

  const state = getWorkspaceState(workspace);
  const hours = signals.hoursPerDay;
  const days = signals.daysAvailable;
  const focus = state.nextPhase?.topics.slice(0, 2) ?? state.missingSkills.slice(0, 2);
  const project = state.nextPhase?.project ?? state.proof?.projectTitle ?? "one portfolio-ready proof item";
  const interviewSoon = signals.intents.includes("interview") && days !== null && days <= 3;

  if (interviewSoon) {
    const time = hours ? `${hours} hour${hours === 1 ? "" : "s"}/day` : "the time you have";
    return [
      `Because the interview is close, use ${time} for interview readiness—not a new learning track.`,
      `1. 35%: role fundamentals and the most likely questions for ${workspace.profile?.career ?? "the role"}.`,
      `2. 35%: rehearse one project story${state.proof ? ` around “${state.proof.projectTitle}”` : " you can explain honestly"}.`,
      "3. 20%: introduction + behavioral answers out loud.",
      "4. 10%: resume/job-description review and logistics.",
      "Do not try to master a new technology the night before.",
    ].join("\n");
  }

  const horizon = days === null ? "the next 7 days" : days === 0 ? "today" : `the next ${days} day${days === 1 ? "" : "s"}`;
  const capacity = hours ? ` at about ${hours} hour${hours === 1 ? "" : "s"} per day` : "";
  const buildPercent = hours !== null && hours < 1.5 ? 70 : 60;
  const proofPercent = hours !== null && hours < 1.5 ? 20 : 25;
  const opportunityPercent = 100 - buildPercent - proofPercent;

  const answer = [
    `For ${horizon}${capacity}, keep one primary sequence:`,
    `1. ${buildPercent}% build/practise: ${focus.length ? focus.join(" + ") : "your next core skill"}.`,
    `2. ${proofPercent}% proof: move “${project}” forward every few sessions.`,
    `3. ${opportunityPercent}% opportunity work: resume, applications, networking or interview practice.`,
    "Finish one visible deliverable before adding another course or project.",
  ].join("\n");

  if (!signals.isHinglish) return answer;
  return `Aapke available time ke hisaab se simple plan:\n${answer}`;
}

function followUpAnswer(workspace: CoachWorkspace, signals: CoachSignals) {
  if (!signals.isFollowUp) return "";

  const current = normalize(workspace.question);
  const previousAssistant = [...workspace.messages]
    .reverse()
    .find((message) => message.role === "assistant")?.text;
  const state = getWorkspaceState(workspace);

  if (hasAny(current, ["what about me", "for me", "my case", "mere liye"]) && workspace.profile) {
    return [
      `For your case: your saved direction is ${workspace.profile.career} and Career Match remains ${workspace.profile.matchPercentage}% from Assessment.`,
      workspace.career
        ? `Your roadmap is ${state.roadmapProgress}% complete${state.nextPhase ? `; the next phase is “${state.nextPhase.title}”` : "; current phases are complete"}.`
        : "",
      conciseIntentAdvice(state.interviewApplications.length ? "interview" : state.proof ? "applications" : "roadmap", workspace),
    ].filter(Boolean).join("\n");
  }

  if (hasAny(current, ["why", "why not", "but why", "kyu", "kyun"])) {
    const topicIntents = signals.intents.filter((intent) => intent !== "study-plan");
    const reason = topicIntents[0]
      ? conciseIntentAdvice(topicIntents[0], workspace)
      : "The recommendation is trying to reduce scattered effort and move you toward evidence or a real opportunity.";
    return [
      previousAssistant ? "The reason behind the previous recommendation is priority, not a fixed rule." : "The reason is priority, not a fixed rule.",
      reason,
      "If the assumption behind that advice is wrong, tell me the constraint that changes it and I’ll adjust the plan.",
    ].join("\n");
  }

  if (hasAny(current, ["then", "and then", "what next", "phir", "next kya"])) {
    return conciseIntentAdvice(
      state.interviewApplications.length ? "interview" : state.proof ? "applications" : "roadmap",
      workspace,
    );
  }

  return "";
}

function conflictAnswer(workspace: CoachWorkspace, signals: CoachSignals) {
  if (!signals.hasConflict) return "";
  const mentioned = detectMentionedCareerTitles(workspace.question);
  if (!signals.intents.includes("career-decision") && mentioned.length < 2) return "";

  const careerText = mentioned.length >= 2
    ? `${mentioned[0]} and ${mentioned[1]}`
    : workspace.profile?.career ?? "the career you are considering";

  return [
    `Your question contains a real trade-off around ${careerText}; do not solve it from the job title alone.`,
    "Separate three things: what work you enjoy, what difficult skills you are willing to practise, and what constraints you cannot ignore (time, maths, coding, money, location, etc.).",
    "Then run a small evidence test: spend a few focused sessions on a realistic task from the path you are unsure about. Your reaction to the actual work is more useful than guessing from descriptions.",
    workspace.profile
      ? `Keep your saved ${workspace.profile.career} direction unchanged until that test gives you a real reason to retake Assessment.`
      : "Use Assessment and Explore after the test to compare a smaller set of realistic options.",
  ].join("\n");
}

function clarificationAnswer(workspace: CoachWorkspace, signals: CoachSignals) {
  const current = normalize(workspace.question);
  const wordCount = current.split(" ").filter(Boolean).length;
  if (workspace.profile || signals.intents.length || wordCount > 5) return "";
  if (!hasAny(current, ["help", "guide me", "what do i do", "what should i do", "confused", "batao", "kya karu"])) return "";

  return signals.isHinglish
    ? "Main help kar sakta hoon. Aap abhi kis cheez mein stuck ho: career choose karna, skills/roadmap, internship/job, resume, ya interview?"
    : "I can help. Which situation are you dealing with right now: choosing a career, skills/roadmap, internship/job search, resume, or interview preparation?";
}

function liveDataAnswer(workspace: CoachWorkspace, signals: CoachSignals) {
  if (!signals.asksCurrentData) return "";
  const mentioned = detectMentionedCareerTitles(workspace.question);
  const role = mentioned[0] ?? workspace.profile?.career ?? "that role";

  return [
    `I should not invent a current 2026 salary, vacancy count or hiring trend for ${role}. Aspire Coach does not have a live jobs/market feed in this workspace.`,
    "Verify it from current job postings in your target location and experience level, plus more than one reputable salary/market source.",
    "I can still use your Aspire profile to tell you which skills, proof and interview preparation would make you more competitive for that role.",
  ].join("\n");
}

export function complexLocalCoachAnswer(workspace: CoachWorkspace) {
  const signals = getCoachV3Signals(workspace);

  const live = liveDataAnswer(workspace, signals);
  if (live) return live;

  const followUp = followUpAnswer(workspace, signals);
  if (followUp) return followUp;

  const clarification = clarificationAnswer(workspace, signals);
  if (clarification) return clarification;

  const conflict = conflictAnswer(workspace, signals);
  if (conflict) return conflict;

  const plan = constrainedPlanAnswer(workspace, signals);
  if (plan && (signals.hoursPerDay !== null || signals.daysAvailable !== null)) return plan;

  const multi = multiPartAnswer(workspace, signals);
  if (multi) return multi;

  return "";
}

export function buildCoachV3Context(workspace: CoachWorkspace) {
  const signals = getCoachV3Signals(workspace);
  const mentioned = detectMentionedCareerTitles(workspace.question);

  return [
    "COACH V3 REASONING SIGNALS",
    `Detected intents: ${signals.intents.join(", ") || "none"}`,
    `Follow-up question: ${signals.isFollowUp ? "yes" : "no"}`,
    `Likely Hinglish: ${signals.isHinglish ? "yes" : "no"}`,
    `User asked for detail: ${signals.wantsDetail ? "yes" : "no"}`,
    `Conflicting goals/constraints detected: ${signals.hasConflict ? "yes" : "no"}`,
    `Requests current/live market data: ${signals.asksCurrentData ? "yes" : "no"}`,
    `Hours available per day: ${signals.hoursPerDay ?? "not stated"}`,
    `Days/deadline: ${signals.daysAvailable ?? "not stated"}`,
    `Careers explicitly mentioned: ${mentioned.join(", ") || "none detected"}`,
  ].join("\n");
}

export const coachV3Instructions = `COACH V3 COMPLEX-QUESTION RULES
- Treat the latest user message as part of the existing conversation. Short follow-ups such as “why?”, “then what?”, “what about me?” or Hinglish equivalents must use recent conversation context instead of resetting to a generic answer.
- When one message contains multiple problems, answer every material part but prioritize them. Urgent interview/offer/deadline issues come before long-term learning improvements.
- When goals conflict (for example “I want AI but hate maths” or “I want a job fast but also want to switch careers”), name the trade-off and give a small evidence-based test rather than forcing a binary answer.
- Ask at most one clarification question, and only when missing information would materially change the recommendation. Otherwise make the best useful interpretation from the workspace.
- Match the user’s language. If they use natural Hinglish, you may answer in clear Hinglish. Do not imitate spelling mistakes aggressively.
- If the user asks for a plan and gives time/deadline constraints, build the plan around those constraints instead of returning a generic percentage split.
- If the user asks for detailed or step-by-step help, give more structure and reasoning. Otherwise stay concise.
- Distinguish what is known from Aspire workspace data, what is a general recommendation, and what is unknown. Never turn an inference into a claimed fact.
- Never invent live salaries, current job openings, current hiring demand, employer policies or admissions outcomes. State the lack of live data and tell the user how to verify it.
- Do not answer a complex question with a canned module description. Use the actual profile, roadmap, portfolio, applications and interview-practice evidence when present.
- If the question is completely unrelated to career/education/work decisions, briefly say Aspire Coach is focused on career guidance and redirect without pretending to be a general-purpose live-information assistant.
- Preserve the Assessment-only Career Match rule in every scenario. No alternative match percentage may be generated.`;
