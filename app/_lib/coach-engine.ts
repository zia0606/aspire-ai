import {
  careerCatalog,
  type CareerDefinition,
  type Profile,
} from "./career-data";

export type CoachMessage = {
  role: "assistant" | "user";
  text: string;
};

export type CoachPortfolioItem = {
  career: string;
  phaseTitle: string;
  projectTitle: string;
  status: string;
  problem: string;
  approach: string;
  outcome: string;
  skills: string[];
};

export type CoachApplicationItem = {
  company: string;
  role: string;
  stage: string;
  location: string;
  nextAction: string;
  dueDate: string;
  notes: string;
};

export type CoachInterviewItem = {
  career: string;
  question: string;
  category: string;
  answer: string;
  confidence: number;
  practicedAt: string;
};

export type CoachWorkspace = {
  profile: Profile | null;
  career: CareerDefinition | null;
  completed: number[];
  portfolio: CoachPortfolioItem[];
  applications: CoachApplicationItem[];
  interviewPractice: CoachInterviewItem[];
  messages: CoachMessage[];
  question: string;
};

type MentionedCareer = {
  key: string;
  definition: CareerDefinition;
};

const roleAliases: Record<string, string[]> = {
  "Full Stack Developer": ["full stack", "fullstack", "web developer", "web development"],
  "AI / ML Engineer": ["ai ml", "ai/ml", "machine learning engineer", "ml engineer", "artificial intelligence"],
  "Data Scientist": ["data science", "data scientist"],
  "Cybersecurity Specialist": ["cybersecurity", "cyber security", "cyber"],
  "Cloud Engineer": ["cloud engineer", "cloud computing"],
  "Software Engineer": ["software engineer", "software developer"],
  "UI/UX Designer": ["ui ux", "ui/ux", "ux designer", "ui designer", "product designer"],
  Entrepreneur: ["entrepreneur", "startup", "business founder"],
  "Business Analyst": ["business analyst"],
  "Product Manager": ["product manager", "product management"],
  "Digital Marketer": ["digital marketing", "digital marketer"],
  "Content Creator": ["content creator", "content creation", "creator"],
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function lines(items: string[]) {
  return items.filter(Boolean).join("\n");
}

function safeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function findMentionedCareers(question: string): MentionedCareer[] {
  const normalized = normalize(question);
  const found = new Map<string, CareerDefinition>();

  for (const [key, definition] of Object.entries(careerCatalog)) {
    const candidates = unique([
      key,
      definition.title,
      ...(roleAliases[key] ?? []),
      ...(roleAliases[definition.title] ?? []),
    ]).map(normalize);

    if (candidates.some((candidate) => candidate.length >= 4 && normalized.includes(candidate))) {
      found.set(key, definition);
    }
  }

  return Array.from(found.entries())
    .slice(0, 4)
    .map(([key, definition]) => ({ key, definition }));
}

function getState(workspace: CoachWorkspace) {
  const { profile, career, completed, portfolio, applications, interviewPractice } = workspace;
  const missingSkills = profile && career
    ? career.skills.filter((skill) => !profile.skills.includes(skill))
    : [];
  const validCompleted = career
    ? completed.filter((index) => Number.isInteger(index) && index >= 0 && index < career.roadmap.length)
    : [];
  const roadmapProgress = career?.roadmap.length
    ? Math.round((validCompleted.length / career.roadmap.length) * 100)
    : 0;
  const nextPhase = career?.roadmap.find((_, index) => !validCompleted.includes(index)) ?? null;
  const currentPortfolio = profile
    ? portfolio.filter((item) => item.career === profile.career)
    : portfolio;
  const readyProof = currentPortfolio.filter((item) => item.status === "Ready" || item.status === "Published");
  const buildingProof = currentPortfolio.filter((item) => item.status === "Building" || item.status === "Planned");
  const activeApplications = applications.filter(
    (item) => !["Rejected", "Withdrawn"].includes(item.stage),
  );
  const interviewApplications = applications.filter((item) => item.stage === "Interview");
  const offers = applications.filter((item) => item.stage === "Offer");
  const rejections = applications.filter((item) => item.stage === "Rejected");
  const currentPractice = profile
    ? interviewPractice.filter((item) => item.career === profile.career)
    : interviewPractice;
  const averageConfidence = currentPractice.length
    ? currentPractice.reduce((sum, item) => sum + item.confidence, 0) / currentPractice.length
    : 0;
  const upcoming = activeApplications
    .filter((item) => item.dueDate && safeDate(item.dueDate))
    .sort((a, b) => (safeDate(a.dueDate)?.getTime() ?? Infinity) - (safeDate(b.dueDate)?.getTime() ?? Infinity))[0];

  return {
    missingSkills,
    validCompleted,
    roadmapProgress,
    nextPhase,
    currentPortfolio,
    readyProof,
    buildingProof,
    activeApplications,
    interviewApplications,
    offers,
    rejections,
    currentPractice,
    averageConfidence,
    upcoming,
  };
}

function compareCareers(mentioned: MentionedCareer[], profile: Profile | null) {
  const [first, second] = mentioned;
  if (!first) return "";

  if (!second) {
    const owned = profile
      ? first.definition.skills.filter((skill) => profile.skills.includes(skill))
      : [];
    const missing = profile
      ? first.definition.skills.filter((skill) => !profile.skills.includes(skill))
      : first.definition.skills;

    return lines([
      `${first.definition.title}: ${first.definition.summary}`,
      profile
        ? `From your current profile, you already list ${owned.length} of its ${first.definition.skills.length} tracked core skills${owned.length ? ` (${owned.slice(0, 4).join(", ")})` : ""}. This is skill overlap, not a new Career Match score.`
        : `Core skills Aspire tracks for this path include ${first.definition.skills.slice(0, 5).join(", ")}.`,
      missing.length ? `A practical test before committing is to try one small task using ${missing.slice(0, 2).join(" and ")}.` : "Your listed skills already cover the tracked foundation; test the role through a real project before changing direction.",
    ]);
  }

  const shared = first.definition.skills.filter((skill) => second.definition.skills.includes(skill));
  const onlyFirst = first.definition.skills.filter((skill) => !second.definition.skills.includes(skill)).slice(0, 4);
  const onlySecond = second.definition.skills.filter((skill) => !first.definition.skills.includes(skill)).slice(0, 4);

  return lines([
    `${first.definition.title} vs ${second.definition.title}:`,
    `• Shared foundation: ${shared.length ? shared.slice(0, 5).join(", ") : "limited overlap in Aspire's tracked skills"}.`,
    `• ${first.definition.title} leans more toward ${onlyFirst.length ? onlyFirst.join(", ") : "its specialized roadmap and projects"}.`,
    `• ${second.definition.title} leans more toward ${onlySecond.length ? onlySecond.join(", ") : "its specialized roadmap and projects"}.`,
    "Do not switch only because one title sounds better. Test each with a small project, compare the day-to-day work, then update the assessment only if your real direction changes.",
  ]);
}

function priorityAnswer(workspace: CoachWorkspace) {
  const { profile, career } = workspace;
  const state = getState(workspace);

  if (!profile || !career) {
    return "Start with the Assessment if you want personalized guidance. If you are still exploring, tell me your education, the subjects you enjoy, what kind of work you dislike, and two careers you are considering—I can help you compare them before you commit.";
  }

  if (state.interviewApplications.length) {
    const item = state.interviewApplications[0];
    return `Your highest-priority move is interview preparation for ${item.role} at ${item.company}. Pick one portfolio project you can explain deeply, practise a 60–90 second introduction, and rehearse role-specific questions in Interview Prep. Keep the saved Career Match at ${profile.matchPercentage}% as assessment context; interview readiness is a separate thing.`;
  }

  if (state.upcoming?.nextAction) {
    return `Your most concrete next action is “${state.upcoming.nextAction}” for ${state.upcoming.role} at ${state.upcoming.company}. Finish that first. After it, continue ${state.nextPhase ? `the “${state.nextPhase.title}” roadmap phase` : "turning completed learning into portfolio proof"}.`;
  }

  if (state.validCompleted.length && state.currentPortfolio.length < state.validCompleted.length) {
    return `You have completed ${state.validCompleted.length} roadmap phase${state.validCompleted.length === 1 ? "" : "s"} but only ${state.currentPortfolio.length} portfolio record${state.currentPortfolio.length === 1 ? "" : "s"} for ${profile.career}. Your next move is to turn completed learning into visible proof in Portfolio before adding more topics.`;
  }

  if (state.nextPhase) {
    return `Continue the “${state.nextPhase.title}” phase. Focus on ${state.nextPhase.topics.slice(0, 3).join(", ")} and use “${state.nextPhase.project}” as the proof milestone. Finish one meaningful deliverable before opening another learning track.`;
  }

  if (!state.activeApplications.length && state.readyProof.length) {
    return `Your roadmap is complete enough to move from preparation to opportunities. You already have ${state.readyProof.length} ready/published portfolio proof item${state.readyProof.length === 1 ? "" : "s"}; start tracking real internships or jobs in Apply and tailor your resume to each role.`;
  }

  return `For ${profile.career}, the next gain is execution: strengthen proof, keep your resume aligned, apply consistently and practise interview explanations. Ask me for a 7-day or 30-day plan and I’ll turn that into a sequence.`;
}

export function localCoachAnswer(workspace: CoachWorkspace) {
  const question = workspace.question.trim();
  const lower = normalize(question);
  const { profile, career } = workspace;
  const state = getState(workspace);
  const mentioned = findMentionedCareers(question);

  if (hasAny(lower, ["fake experience", "fake project", "lie on resume", "lie in resume", "cheat interview", "fake certificate"])) {
    return "Do not fabricate experience, projects, certificates or results. A stronger strategy is to label work honestly—personal project, college project, volunteer work, freelance trial or self-directed case study—and make the evidence good enough to discuss confidently.";
  }

  if (hasAny(lower, ["compare", "versus", " vs ", "switch career", "change career", "different career", "career change"]) && mentioned.length) {
    const comparison = compareCareers(mentioned, profile);
    if (comparison) return comparison;
  }

  if (hasAny(lower, ["confused", "confusion", "not sure", "dont know career", "don't know career", "which career", "career choose", "kya karu", "samajh nahi", "direction nahi"])) {
    if (mentioned.length) return compareCareers(mentioned, profile);
    return lines([
      profile
        ? `You are currently saved as ${profile.career}, but you are not locked into it.`
        : "Career confusion is a decision problem, not something you need to solve by guessing a job title.",
      "Use three tests: (1) work you enjoy doing repeatedly, (2) skills you are willing to practise when it gets difficult, and (3) evidence you can build within the next few weeks.",
      profile
        ? "Use Explore to compare alternatives, try one small project in the strongest alternative, and only retake Assessment if your real direction changes."
        : "Complete Assessment for a starting point, then use Explore to compare two realistic options instead of trying to choose from everything at once.",
    ]);
  }

  if (hasAny(lower, ["rejected", "rejection", "didnt select", "didn't select", "not selected", "failed interview"])) {
    const latest = state.rejections.at(-1);
    return lines([
      latest ? `Treat the rejection for ${latest.role} at ${latest.company} as one data point, not a verdict on the whole ${profile?.career ?? "career"} path.` : "Treat the rejection as one data point, not a verdict on your whole career direction.",
      "Do a short post-mortem: was the gap resume targeting, project evidence, technical depth, communication, or simply role fit? Fix the most likely one—not everything at once.",
      `Then create the next opportunity quickly${state.readyProof.length ? ` and lead with your strongest proof: ${state.readyProof[0].projectTitle}` : " while building one stronger piece of proof"}.`,
    ]);
  }

  if (hasAny(lower, ["offer", "salary offer", "choose offer", "accept offer", "job offer"])) {
    return lines([
      state.offers.length ? `You currently have ${state.offers.length} offer-stage opportunity${state.offers.length === 1 ? "" : "ies"} in Aspire.` : "Evaluate an offer on more than the headline salary.",
      "Compare role scope, learning quality, manager/team, working hours, location/commute, contract or bond terms, compensation, growth path and whether the work moves you toward the career you actually want.",
      "If you give me the non-sensitive details of two offers, I can help you compare them criterion by criterion. I cannot guarantee which employer will be best in practice.",
    ]);
  }

  if (hasAny(lower, ["motivation", "unmotivated", "lazy", "procrast", "overwhelmed", "burnout", "tired", "cant focus", "can't focus"])) {
    const task = state.nextPhase?.project ?? state.buildingProof[0]?.projectTitle ?? state.upcoming?.nextAction;
    return lines([
      "Reduce the size of the next commitment instead of redesigning your whole career plan today.",
      task ? `Your smallest useful target is one concrete piece of “${task}”.` : "Pick one career task that can produce visible output today.",
      "Use a short focused block, finish a visible deliverable, then stop. Momentum is more useful than opening five new courses or changing careers because one week feels slow.",
    ]);
  }

  if (hasAny(lower, ["time", "hours daily", "hour daily", "study plan", "weekly plan", "30 day", "30-day", "7 day", "7-day", "schedule", "routine"])) {
    const phase = state.nextPhase;
    const focus = phase?.topics.slice(0, 3) ?? state.missingSkills.slice(0, 3);
    return lines([
      `A practical plan for ${profile?.career ?? "career preparation"}:`,
      `• 60% build/practise: ${focus.length ? focus.join(", ") : "the main skill you are currently developing"}.`,
      `• 25% proof: ${phase?.project ?? state.buildingProof[0]?.projectTitle ?? "one portfolio-ready project or case study"}.`,
      "• 15% opportunity work: resume, applications, networking or interview rehearsal.",
      "If you tell me exactly how many hours you have per day and your deadline, I can turn this into a day-by-day plan.",
    ]);
  }

  if (hasAny(lower, ["course", "certificate", "certification", "tutorial", "bootcamp", "degree course", "what should i study"])) {
    const focus = state.missingSkills[0] ?? state.nextPhase?.topics[0];
    return lines([
      focus ? `Choose learning material that closes the immediate gap: ${focus}.` : "Choose learning material for the next skill your roadmap actually requires.",
      "Do not collect certificates as a substitute for ability. Prefer a course only if it has clear prerequisites, exercises and an output you can turn into a project or demonstrable skill.",
      "A certificate is useful as supporting evidence; it should not be the main proof that you can do the work.",
    ]);
  }

  if (hasAny(lower, ["higher studies", "masters", "master's", "msc", "mba", "post graduation", "postgraduate"])) {
    return lines([
      "Decide on higher studies from the role you want, not from fear of entering the job market.",
      `For ${profile?.career ?? "your target path"}, check whether the roles you want genuinely require advanced academic depth, whether the program gives projects/research/placements you cannot easily build yourself, and whether the cost/time is justified for you.`,
      "I can compare 'work now vs higher studies' if you give me the program, cost/time and the career outcome you expect from it.",
    ]);
  }

  if (hasAny(lower, ["linkedin", "network", "referral", "connect with", "message recruiter", "cold message"])) {
    return lines([
      `Position yourself around ${profile?.career ?? "one clear target"}, not a list of unrelated interests.`,
      state.readyProof.length
        ? `Lead with proof such as “${state.readyProof[0].projectTitle}” when relevant.`
        : "Build at least one concrete project/case study you can point to before asking strangers for broad career help.",
      "For outreach: introduce yourself in one line, mention the specific role/work you are interested in, give one proof point, then ask one small specific question. Avoid generic “please give me job” messages.",
    ]);
  }

  if (hasAny(lower, ["internship", "apply", "application", "job search", "get a job", "placement", "fresher", "no experience", "experience nahi"])) {
    return lines([
      profile ? `For a ${profile.career} internship/job search, your preparation and opportunity work should run in parallel.` : "For an internship/job search, preparation and applications should run in parallel.",
      state.readyProof.length
        ? `You already have ${state.readyProof.length} ready/published proof item${state.readyProof.length === 1 ? "" : "s"}; use the strongest one near the top of your resume and in interviews.`
        : "If you lack formal experience, use strong college/personal projects, volunteer work, case studies or real small client problems as honest evidence.",
      `Your Aspire board currently has ${state.activeApplications.length} active opportunit${state.activeApplications.length === 1 ? "y" : "ies"}. Track each next action so applications do not become a pile of links.`,
    ]);
  }

  if (hasAny(lower, ["interview", "mock", "tell me about yourself", "hr question", "technical question", "behavioral", "star answer", "explain project"])) {
    const proof = state.readyProof[0] ?? state.currentPortfolio[0];
    return lines([
      profile ? `Prepare for ${profile.career} interviews in three layers: role fundamentals, project evidence and communication.` : "Prepare in three layers: role fundamentals, project evidence and communication.",
      proof
        ? `Use “${proof.projectTitle}” as an anchor story: problem → your decision → what you built → result → what you would improve.`
        : "Build at least one project/case study you can explain as problem → decision → execution → result → lesson.",
      state.currentPractice.length
        ? `You have ${state.currentPractice.length} saved practice answer${state.currentPractice.length === 1 ? "" : "s"}; average self-confidence is ${state.averageConfidence.toFixed(1)}/5. Revisit the lowest-confidence answers first.`
        : "Use Interview Prep to save answers and confidence ratings, then repeat the weak categories rather than practising random questions.",
    ]);
  }

  if (hasAny(lower, ["resume", "cv", "ats", "cover letter"])) {
    const proof = state.readyProof[0] ?? state.currentPortfolio[0];
    return lines([
      `For a ${profile?.career ?? "targeted"} resume, relevance beats volume. Put the strongest role-relevant skills and evidence where a recruiter sees them quickly.`,
      proof
        ? `A strong project bullet can come from “${proof.projectTitle}”: state the problem, what you implemented, the tools/skills, and the outcome without inventing metrics.`
        : "Add project bullets that say what problem you solved, what you built, the tools/skills used and the result. Do not fabricate numbers.",
      "Use Resume Analyzer as a separate document-quality check; its score is not your Career Match.",
    ]);
  }

  if (hasAny(lower, ["portfolio", "project", "what to build", "build next", "project idea", "github project"])) {
    const project = state.nextPhase?.project ?? state.buildingProof[0]?.projectTitle ?? career?.roadmap.at(-1)?.project;
    return lines([
      project ? `Build or finish this next: ${project}.` : "Choose a project that demonstrates one important skill for the role and produces something another person can inspect.",
      "Document it as problem → approach → decisions → skills/tools → outcome → what you learned.",
      state.currentPortfolio.length
        ? `You currently have ${state.currentPortfolio.length} portfolio record${state.currentPortfolio.length === 1 ? "" : "s"} for this direction; improve the weakest evidence before creating many more.`
        : "Add it to Portfolio early, while you are building, instead of trying to remember the evidence at the end.",
    ]);
  }

  if (hasAny(lower, ["salary", "pay", "package", "ctc", "job market", "demand", "scope", "future of"])) {
    return lines([
      "Aspire does not have a live salary or hiring-market feed, so I should not invent a current number or claim real-time demand.",
      `For ${mentioned[0]?.definition.title ?? profile?.career ?? "the role"}, evaluate current postings in your target location, experience level, required skills and company type, then compare multiple reputable sources.`,
      "I can still help you understand the role, skill requirements and how to become more competitive using your Aspire profile.",
    ]);
  }

  if (hasAny(lower, ["entrepreneur", "startup", "business", "freelance", "freelancing", "client"])) {
    return lines([
      "Treat business/freelancing as an evidence-and-customer problem, not only a skill-learning problem.",
      "Pick a narrow customer problem, build the smallest useful solution, show proof, speak to real potential users/clients, and improve from their response.",
      profile ? `Keep ${profile.career} skills as leverage where they support the offer, but measure progress with customers, useful output and repeatable delivery—not the Career Match percentage.` : "Use the skills you can already deliver reliably as the starting point for an offer.",
    ]);
  }

  if (hasAny(lower, ["skill", "gap", "weak", "learn", "study", "roadmap", "progress", "next", "what do i do", "what should i do", "kya next"])) {
    if (hasAny(lower, ["gap", "weak", "missing", "skill"]) && profile && career) {
      return state.missingSkills.length
        ? `Your tracked core gaps for ${profile.career} are ${state.missingSkills.join(", ")}. Start with ${state.missingSkills.slice(0, 2).join(" and ")}, but add them to a future assessment only after you have genuinely built the skill.`
        : `Your profile already lists all core skills Aspire tracks for ${profile.career}. The next improvement should come from depth, proof, applications and interview explanations—not collecting more skill labels.`;
    }

    if (hasAny(lower, ["roadmap", "progress"]) && profile && career) {
      return `Your ${profile.career} roadmap is ${state.roadmapProgress}% complete (${state.validCompleted.length}/${career.roadmap.length} phases). ${state.nextPhase ? `Next: “${state.nextPhase.title}” — ${state.nextPhase.project}.` : "All current phases are complete; shift attention to proof, applications and interview practice."}`;
    }

    return priorityAnswer(workspace);
  }

  if (mentioned.length) {
    return compareCareers(mentioned, profile);
  }

  return lines([
    profile
      ? `I can help across your full ${profile.career} journey, not only the roadmap.`
      : "I can help with general career decisions even before you complete the assessment.",
    "Ask about career confusion or switching, skills, study plans, courses, projects, portfolio proof, resume, internships, applications, rejection, offers, networking, interviews, freelancing or higher studies.",
    profile ? `If you want the most useful starting point right now: ${priorityAnswer(workspace)}` : "Tell me your situation in plain language and I’ll turn it into concrete next steps.",
  ]);
}

export function buildCoachContext(workspace: CoachWorkspace) {
  const { profile, career, completed, portfolio, applications, interviewPractice, messages, question } = workspace;
  const state = getState(workspace);
  const mentioned = findMentionedCareers(question);

  const profileBlock = profile && career
    ? lines([
        `Career: ${profile.career}`,
        `Career summary: ${career.summary}`,
        `Saved assessment Career Match: ${profile.matchPercentage}% (authoritative; assessment-owned)`,
        `Education: ${profile.education}`,
        `Experience: ${profile.experience}`,
        `Selected skills: ${profile.skills.join(", ") || "None"}`,
        `Interests: ${profile.interests.join(", ") || "None"}`,
        `Tracked missing core skills: ${state.missingSkills.join(", ") || "None"}`,
        `Roadmap progress: ${state.roadmapProgress}% (${state.validCompleted.length}/${career.roadmap.length})`,
        `Next roadmap phase: ${state.nextPhase?.title ?? "All current phases complete"}`,
      ])
    : "No saved Aspire profile. Give general career guidance and encourage assessment only when personalization would help.";

  const roadmapBlock = career
    ? career.roadmap
        .map((phase, index) => `${index + 1}. ${phase.title} (${phase.duration}) — ${completed.includes(index) ? "COMPLETE" : "NOT COMPLETE"}. Topics: ${phase.topics.join(", ")}. Project: ${phase.project}.`)
        .join("\n")
    : "No saved roadmap.";

  const portfolioBlock = portfolio.length
    ? portfolio
        .slice(0, 20)
        .map((item) => `• ${item.projectTitle} [${item.status}] — career: ${item.career}; phase: ${item.phaseTitle}; skills: ${item.skills.join(", ") || "none listed"}; problem: ${item.problem.slice(0, 260) || "not recorded"}; outcome: ${item.outcome.slice(0, 260) || "not recorded"}`)
        .join("\n")
    : "No portfolio evidence saved.";

  const applicationsBlock = applications.length
    ? applications
        .slice(0, 30)
        .map((item) => `• ${item.role} at ${item.company} [${item.stage}]${item.location ? ` — ${item.location}` : ""}; next action: ${item.nextAction || "none"}; due: ${item.dueDate || "none"}; notes: ${item.notes.slice(0, 180) || "none"}`)
        .join("\n")
    : "No applications tracked.";

  const interviewBlock = interviewPractice.length
    ? interviewPractice
        .slice(0, 25)
        .map((item) => `• [${item.category}] confidence ${item.confidence}/5 — Q: ${item.question.slice(0, 220)}; saved answer: ${item.answer.slice(0, 320) || "none"}`)
        .join("\n")
    : "No interview practice saved.";

  const mentionedBlock = mentioned.length
    ? mentioned
        .map(({ definition }) => `${definition.title}: ${definition.summary} Core skills: ${definition.skills.join(", ")}. Interests: ${definition.interests.join(", ")}.`)
        .join("\n")
    : "No alternate catalog career explicitly detected in this question.";

  const historyBlock = messages.length
    ? messages
        .slice(-10)
        .map((message) => `${message.role.toUpperCase()}: ${message.text.slice(0, 900)}`)
        .join("\n")
    : "No recent messages.";

  return `ASPIRE COACH WORKSPACE\n\nSAVED PROFILE\n${profileBlock}\n\nROADMAP\n${roadmapBlock}\n\nPORTFOLIO EVIDENCE\n${portfolioBlock}\n\nAPPLICATIONS\n${applicationsBlock}\n\nINTERVIEW PRACTICE\n${interviewBlock}\n\nCAREERS MENTIONED IN THE QUESTION\n${mentionedBlock}\n\nRECENT CONVERSATION\n${historyBlock}\n\nPRODUCT ROUTES\nAssessment=/assessment; Explore=/explore; Dashboard=/dashboard; Roadmap=/roadmap; Portfolio=/portfolio; Applications=/applications; Resume=/resume; Interview Prep=/interview; Account=/account.\n\nCURRENT USER QUESTION\n${question}`;
}

export const coachInstructions = `You are Aspire Coach, the career intelligence and execution assistant inside Aspire AI, a student career-planning product.

MISSION
Help students make better career decisions and convert them into concrete action across career exploration, learning, projects, portfolio proof, resumes, applications, networking, interviews, offers, freelancing/entrepreneurship and higher-study decisions.

GROUNDING RULES
- Personalize user-specific claims only from the supplied Aspire workspace context.
- You may use stable general career knowledge, but do not pretend to have live job-market, salary, vacancy, employer or admissions data.
- If a user asks for current salary, demand, openings or market conditions, clearly say the workspace has no live feed and explain how to verify current information.
- The saved Career Match percentage is authoritative and assessment-owned. NEVER recalculate it, replace it, infer a new match percentage or imply another metric is the same score.
- Roadmap progress, portfolio proof, resume quality, application activity and interview confidence are separate signals.
- Never fabricate achievements, metrics, experience, certificates, projects, job offers or application facts.
- Never promise selection, admission, salary or employment.

COACHING BEHAVIOR
- Answer the user's actual situation, including messy questions like career confusion, switching direction, rejection, lack of experience, lack of time, motivation problems, offer choices and uncertainty.
- When the user is deciding between careers, use a decision framework and evidence rather than ordering them to switch.
- When they lack experience, suggest honest substitutes such as college/personal projects, volunteering, case studies or small real problems—not fake experience.
- For projects, prefer evidence: problem → approach → decisions → implementation → result → lesson.
- For interviews, connect answers to real portfolio/project evidence and use saved confidence/history when available.
- For applications, prioritize concrete next actions and deadlines when the workspace contains them.
- For study planning, prioritize one sequence rather than many simultaneous courses.
- If the user sounds frustrated or overwhelmed, be calm and practical without becoming a therapist or using empty reassurance.
- If the question is ambiguous, make the best useful interpretation from context; ask at most one follow-up question only if it materially changes the recommendation.

STYLE
- Start with the answer, not a long preamble.
- Prefer 2–5 concrete next actions when action is appropriate.
- Keep most replies under 250 words unless the user asks for detail.
- Be specific, candid and student-friendly. Avoid hype and corporate language.
- Mention Aspire routes only when they are genuinely useful.
- Do not claim you changed workspace data; the Coach advises but does not silently rewrite the assessment or other records.`;
