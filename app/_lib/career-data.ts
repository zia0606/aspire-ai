export type Education =
  | "Computer Science"
  | "Engineering"
  | "Business / Management"
  | "Arts / Humanities"
  | "Science"
  | "Other";

export type ExperienceLevel =
  | "Complete beginner"
  | "Less than 1 year"
  | "1–2 years"
  | "2–4 years"
  | "4+ years";

export type ScoreBreakdown = {
  education: number;
  skills: number;
  interests: number;
  experience: number;
};

export type Profile = {
  version: 2;
  education: Education;
  skills: string[];
  career: string;
  experience: ExperienceLevel;
  interests: string[];
  matchPercentage: number;
  matchBreakdown: ScoreBreakdown;
  createdAt: string;
  updatedAt: string;
};

export type RoadmapPhase = {
  title: string;
  duration: string;
  description: string;
  topics: string[];
  project: string;
};

export type CareerDefinition = {
  title: string;
  category: string;
  summary: string;
  education: Education[];
  skills: string[];
  interests: string[];
  roadmap: RoadmapPhase[];
};

export const educationOptions: Education[] = [
  "Computer Science",
  "Engineering",
  "Business / Management",
  "Arts / Humanities",
  "Science",
  "Other",
];

export const experienceOptions: ExperienceLevel[] = [
  "Complete beginner",
  "Less than 1 year",
  "1–2 years",
  "2–4 years",
  "4+ years",
];

export const skillsByEducation: Record<Education, string[]> = {
  "Computer Science": [
    "HTML", "CSS", "JavaScript", "TypeScript", "Python", "Java", "C / C++", "SQL",
    "React", "Node.js", "Git & GitHub", "AI / Machine Learning", "Cybersecurity", "Data Analysis",
  ],
  Engineering: [
    "C / C++", "Python", "Mathematics", "AutoCAD", "Engineering Design", "Problem Solving",
    "Data Analysis", "Project Management", "Electronics", "Research", "Communication",
  ],
  "Business / Management": [
    "Microsoft Excel", "Business Analytics", "Marketing", "Finance", "Accounting", "Sales",
    "Leadership", "Communication", "Project Management", "Entrepreneurship", "Negotiation", "Market Research",
  ],
  "Arts / Humanities": [
    "Creative Writing", "Communication", "Public Speaking", "Research", "Critical Thinking", "Graphic Design",
    "Content Creation", "Psychology", "Languages", "Presentation", "Social Media",
  ],
  Science: [
    "Mathematics", "Statistics", "Research", "Data Analysis", "Python", "Scientific Writing",
    "Laboratory Skills", "Critical Thinking", "Problem Solving", "Scientific Computing", "Experimentation",
  ],
  Other: [
    "Communication", "Microsoft Excel", "Problem Solving", "Critical Thinking", "Research", "Presentation",
    "Digital Literacy", "Project Management", "Leadership", "Time Management", "Teamwork", "Content Creation",
  ],
};

export const interestsByEducation: Record<Education, string[]> = {
  "Computer Science": [
    "Building websites", "Artificial Intelligence", "Data & Analytics", "Cybersecurity", "Mobile Apps",
    "Gaming", "Cloud & DevOps", "Software Development",
  ],
  Engineering: [
    "Technology", "Engineering Design", "Robotics", "Artificial Intelligence", "Problem Solving",
    "Research", "Innovation", "Project Management",
  ],
  "Business / Management": [
    "Business & Startups", "Marketing", "Finance", "Leadership", "Sales", "Entrepreneurship",
    "Business Analytics", "Management",
  ],
  "Arts / Humanities": [
    "Writing", "Art & Design", "Content Creation", "Psychology", "History & Culture", "Media", "Languages", "Social Media",
  ],
  Science: [
    "Research", "Data & Analytics", "Technology", "Artificial Intelligence", "Environment", "Biology", "Physics", "Scientific Discovery",
  ],
  Other: [
    "Business & Startups", "Technology", "Creative Work", "Communication", "Research", "Leadership", "Content Creation", "Problem Solving",
  ],
};

const phase = (
  title: string,
  duration: string,
  description: string,
  topics: string[],
  project: string,
): RoadmapPhase => ({ title, duration, description, topics, project });

export const careerCatalog: Record<string, CareerDefinition> = {
  "Full Stack Developer": {
    title: "Full Stack Developer",
    category: "Software",
    summary: "Build complete web products across frontend, backend, APIs and databases.",
    education: ["Computer Science", "Engineering", "Other"],
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git & GitHub"],
    interests: ["Building websites", "Software Development", "Technology", "Problem Solving"],
    roadmap: [
      phase("Web foundations", "3–4 weeks", "Master semantic HTML, responsive CSS and JavaScript fundamentals.", ["HTML", "CSS", "JavaScript", "Responsive design"], "Build a responsive portfolio website"),
      phase("Modern frontend", "4–5 weeks", "Build component-driven interfaces with React and TypeScript.", ["React", "TypeScript", "State", "APIs"], "Build a task management dashboard"),
      phase("Backend & data", "5–6 weeks", "Create APIs, authentication and relational data models.", ["Node.js", "REST APIs", "SQL", "Authentication"], "Build a secure full-stack API"),
      phase("Ship a product", "3–4 weeks", "Combine the stack, test it, deploy it and document your work.", ["Testing", "Deployment", "Performance", "Git"], "Deploy a production-ready full-stack app"),
    ],
  },
  "AI / ML Engineer": {
    title: "AI / ML Engineer",
    category: "Artificial Intelligence",
    summary: "Build intelligent systems using Python, data, machine learning and model deployment.",
    education: ["Computer Science", "Engineering", "Science"],
    skills: ["Python", "Mathematics", "Statistics", "Data Analysis", "AI / Machine Learning", "SQL"],
    interests: ["Artificial Intelligence", "Data & Analytics", "Research", "Technology"],
    roadmap: [
      phase("Python & mathematics", "4 weeks", "Build the programming and mathematical foundation for ML.", ["Python", "NumPy", "Statistics", "Linear algebra"], "Analyze a real dataset in Python"),
      phase("Machine learning", "5–6 weeks", "Train and evaluate supervised and unsupervised models.", ["Pandas", "Scikit-learn", "Features", "Evaluation"], "Build a prediction model"),
      phase("Deep learning & GenAI", "5–6 weeks", "Learn neural networks and modern AI application patterns.", ["Neural networks", "NLP", "Embeddings", "Responsible AI"], "Build an AI text application"),
      phase("Deploy AI systems", "3–4 weeks", "Turn models into reliable products with APIs and monitoring.", ["Model serving", "APIs", "Evaluation", "Monitoring"], "Deploy an AI-powered web app"),
    ],
  },
  "Data Scientist": {
    title: "Data Scientist",
    category: "Data",
    summary: "Turn raw data into insights, experiments and predictive models.",
    education: ["Computer Science", "Engineering", "Science", "Business / Management"],
    skills: ["Python", "SQL", "Statistics", "Data Analysis", "Mathematics", "Research"],
    interests: ["Data & Analytics", "Research", "Artificial Intelligence", "Business Analytics"],
    roadmap: [
      phase("Data foundations", "4 weeks", "Learn Python, statistics and practical data cleaning.", ["Python", "Statistics", "Pandas", "Cleaning"], "Create an exploratory data analysis report"),
      phase("SQL & visualization", "3–4 weeks", "Query relational data and communicate patterns visually.", ["SQL", "Joins", "Charts", "Storytelling"], "Build a business data dashboard"),
      phase("Machine learning", "5–6 weeks", "Build predictive models and evaluate them correctly.", ["Regression", "Classification", "Features", "Metrics"], "Create a customer prediction model"),
      phase("Portfolio & communication", "3 weeks", "Package your analysis into decision-ready case studies.", ["Case studies", "Documentation", "Presentation", "Git"], "Publish three polished data case studies"),
    ],
  },
  "Cybersecurity Specialist": {
    title: "Cybersecurity Specialist",
    category: "Security",
    summary: "Protect systems through networking, Linux, security fundamentals and defensive practice.",
    education: ["Computer Science", "Engineering", "Other"],
    skills: ["Cybersecurity", "Python", "C / C++", "Git & GitHub", "Problem Solving"],
    interests: ["Cybersecurity", "Technology", "Problem Solving", "Cloud & DevOps"],
    roadmap: [
      phase("Systems & networking", "4 weeks", "Understand Linux, IP networking, DNS, HTTP and ports.", ["Linux", "TCP/IP", "DNS", "HTTP"], "Document a legal home security lab"),
      phase("Security foundations", "4 weeks", "Learn authentication, encryption, access control and common threats.", ["Authentication", "Encryption", "Threats", "Hardening"], "Create a defensive security checklist"),
      phase("Defensive tooling", "5 weeks", "Practice traffic analysis, scanning and web security in authorized labs.", ["Wireshark", "Nmap", "Web security", "Logging"], "Complete and document a legal lab investigation"),
      phase("Automation & portfolio", "3–4 weeks", "Use Python to automate defensive tasks and present your work.", ["Python", "Automation", "Reports", "Portfolio"], "Build a defensive monitoring utility"),
    ],
  },
  "Cloud Engineer": {
    title: "Cloud Engineer",
    category: "Cloud",
    summary: "Deploy, automate and operate applications on modern cloud infrastructure.",
    education: ["Computer Science", "Engineering", "Other"],
    skills: ["Python", "Git & GitHub", "Project Management", "Problem Solving"],
    interests: ["Cloud & DevOps", "Technology", "Software Development", "Innovation"],
    roadmap: [
      phase("Linux & networking", "4 weeks", "Build the operating-system and networking fundamentals used in cloud environments.", ["Linux", "TCP/IP", "DNS", "Shell"], "Configure a Linux server"),
      phase("Cloud core", "5 weeks", "Learn compute, storage, managed databases and network design.", ["Compute", "Storage", "Databases", "Networking"], "Deploy a cloud-hosted application"),
      phase("Containers & CI/CD", "4–5 weeks", "Automate builds and deployment with containers and pipelines.", ["Docker", "CI/CD", "Git", "Automation"], "Containerize and deploy an app"),
      phase("Operations", "3–4 weeks", "Add monitoring, security and reliability practices.", ["Monitoring", "Logging", "Security", "Scaling"], "Create an observable cloud service"),
    ],
  },
  "Software Engineer": {
    title: "Software Engineer",
    category: "Software",
    summary: "Design and build maintainable software with strong programming and problem-solving skills.",
    education: ["Computer Science", "Engineering", "Science", "Other"],
    skills: ["Python", "Java", "C / C++", "SQL", "Git & GitHub", "Problem Solving"],
    interests: ["Software Development", "Technology", "Problem Solving", "Building websites"],
    roadmap: [
      phase("Programming fundamentals", "4 weeks", "Master one language, functions, OOP and debugging.", ["Programming", "OOP", "Debugging", "Testing"], "Build a command-line application"),
      phase("Data structures & algorithms", "5 weeks", "Learn efficient ways to organize data and solve problems.", ["Arrays", "Trees", "Hash maps", "Complexity"], "Build an algorithm visualizer"),
      phase("Software systems", "5 weeks", "Work with databases, APIs and clean application architecture.", ["SQL", "APIs", "Architecture", "Git"], "Build a database-backed application"),
      phase("Professional engineering", "3–4 weeks", "Test, document, deploy and present production-quality work.", ["Testing", "Documentation", "Deployment", "Code review"], "Ship a polished portfolio application"),
    ],
  },
  "UI/UX Designer": {
    title: "UI/UX Designer",
    category: "Design",
    summary: "Research user needs and design useful, accessible digital experiences.",
    education: ["Computer Science", "Arts / Humanities", "Business / Management", "Other"],
    skills: ["Graphic Design", "Communication", "Research", "Presentation", "Critical Thinking"],
    interests: ["Art & Design", "Creative Work", "Building websites", "Psychology", "Technology"],
    roadmap: [
      phase("Design foundations", "3 weeks", "Practice typography, color, layout, spacing and accessibility.", ["Typography", "Color", "Layout", "Accessibility"], "Redesign a landing page"),
      phase("UX research", "4 weeks", "Understand users through interviews, journeys and problem framing.", ["Interviews", "Personas", "User journeys", "Research"], "Create a user research case study"),
      phase("Wireframes & prototypes", "4 weeks", "Turn insights into flows, wireframes and interactive prototypes.", ["User flows", "Wireframes", "Prototypes", "Testing"], "Prototype a mobile app"),
      phase("Portfolio", "3 weeks", "Explain your process and decisions in convincing case studies.", ["Case studies", "Storytelling", "Presentation", "Portfolio"], "Publish three UX case studies"),
    ],
  },
  Entrepreneur: {
    title: "Entrepreneur",
    category: "Business",
    summary: "Validate real problems, build useful products and learn how to acquire customers.",
    education: educationOptions,
    skills: ["Entrepreneurship", "Leadership", "Communication", "Marketing", "Sales", "Project Management", "Negotiation"],
    interests: ["Business & Startups", "Entrepreneurship", "Leadership", "Innovation", "Management"],
    roadmap: [
      phase("Problem discovery", "2–3 weeks", "Find a painful problem through customer conversations and market research.", ["Interviews", "Market research", "Problem selection", "Positioning"], "Complete 15 customer interviews"),
      phase("MVP", "4 weeks", "Build the smallest useful version and test your core assumption.", ["MVP", "Prototyping", "Pricing", "Feedback"], "Launch a working MVP"),
      phase("Sales & marketing", "4 weeks", "Learn repeatable acquisition through outreach and content.", ["Sales", "Marketing", "Content", "Analytics"], "Run a first-customer campaign"),
      phase("Operations & growth", "Ongoing", "Track money, retention and customer outcomes while improving the product.", ["Finance", "Operations", "Retention", "Growth"], "Build a 90-day growth plan"),
    ],
  },
  "Business Analyst": {
    title: "Business Analyst",
    category: "Business",
    summary: "Translate business problems into clear requirements, analysis and decisions.",
    education: ["Business / Management", "Engineering", "Science", "Other"],
    skills: ["Microsoft Excel", "Business Analytics", "Data Analysis", "Communication", "Problem Solving", "Market Research"],
    interests: ["Business Analytics", "Business & Startups", "Data & Analytics", "Management", "Research"],
    roadmap: [
      phase("Excel & data", "3 weeks", "Build strong spreadsheet analysis and reporting skills.", ["Excel", "Pivot tables", "Charts", "Cleaning"], "Create a sales analysis dashboard"),
      phase("SQL & analysis", "4 weeks", "Retrieve and summarize structured business data.", ["SQL", "Joins", "Aggregations", "KPIs"], "Analyze a business database"),
      phase("Requirements & processes", "4 weeks", "Map stakeholders, processes and requirements.", ["Requirements", "Process mapping", "Stakeholders", "Documentation"], "Write a product requirements case study"),
      phase("Communication", "3 weeks", "Turn findings into clear recommendations and presentations.", ["Storytelling", "Reports", "Presentation", "Decision support"], "Present a business improvement proposal"),
    ],
  },
  "Product Manager": {
    title: "Product Manager",
    category: "Product",
    summary: "Connect customer problems, business goals and engineering execution into useful products.",
    education: ["Business / Management", "Computer Science", "Engineering", "Other"],
    skills: ["Project Management", "Leadership", "Communication", "Business Analytics", "Problem Solving", "Market Research"],
    interests: ["Business & Startups", "Technology", "Management", "Innovation", "Leadership"],
    roadmap: [
      phase("Product thinking", "3 weeks", "Learn discovery, prioritization and outcome-focused product thinking.", ["Discovery", "Prioritization", "Outcomes", "Metrics"], "Analyze an existing product"),
      phase("Customer research", "3 weeks", "Practice interviews, problem framing and opportunity selection.", ["Interviews", "Personas", "Jobs-to-be-done", "Research"], "Create a discovery report"),
      phase("Execution", "4 weeks", "Write requirements, plan releases and collaborate with design and engineering.", ["PRDs", "Roadmaps", "Agile", "Stakeholders"], "Create a launch-ready product spec"),
      phase("Metrics & portfolio", "3 weeks", "Measure product outcomes and present your decisions.", ["Analytics", "Experiments", "Storytelling", "Portfolio"], "Publish a product case study"),
    ],
  },
  "Digital Marketer": {
    title: "Digital Marketer",
    category: "Marketing",
    summary: "Grow audiences and businesses using content, campaigns, channels and analytics.",
    education: ["Business / Management", "Arts / Humanities", "Other"],
    skills: ["Marketing", "Social Media", "Content Creation", "Communication", "Market Research", "Graphic Design"],
    interests: ["Marketing", "Social Media", "Content Creation", "Business & Startups", "Media"],
    roadmap: [
      phase("Marketing foundations", "3 weeks", "Understand customers, positioning, funnels and messaging.", ["Customer", "Positioning", "Funnels", "Messaging"], "Create a go-to-market brief"),
      phase("Content & social", "4 weeks", "Plan and produce content for specific channels and goals.", ["Content strategy", "Copywriting", "Social media", "Creative"], "Run a 14-day content campaign"),
      phase("Acquisition channels", "4 weeks", "Learn SEO, email and paid campaign fundamentals.", ["SEO", "Email", "Paid media", "Landing pages"], "Build a multi-channel campaign"),
      phase("Analytics & optimization", "3 weeks", "Measure performance and improve campaigns with data.", ["KPIs", "Analytics", "A/B testing", "Reporting"], "Create a campaign performance report"),
    ],
  },
  "Content Creator": {
    title: "Content Creator",
    category: "Media",
    summary: "Create useful, entertaining content and build an audience around a clear niche.",
    education: ["Arts / Humanities", "Business / Management", "Other"],
    skills: ["Content Creation", "Creative Writing", "Communication", "Graphic Design", "Social Media", "Presentation"],
    interests: ["Content Creation", "Creative Work", "Media", "Social Media", "Writing"],
    roadmap: [
      phase("Niche & audience", "2 weeks", "Choose a useful niche and understand what your audience wants.", ["Niche", "Audience", "Research", "Positioning"], "Create an audience content map"),
      phase("Content systems", "3 weeks", "Learn scripting, storytelling, visual structure and repeatable production.", ["Hooks", "Scripts", "Storytelling", "Design"], "Publish 10 structured pieces"),
      phase("Distribution", "3 weeks", "Adapt content to platforms and learn from analytics.", ["Platforms", "SEO", "Analytics", "Community"], "Run a 30-day publishing challenge"),
      phase("Portfolio & monetization", "3 weeks", "Package your work and test realistic revenue paths.", ["Portfolio", "Brand deals", "Services", "Products"], "Build a creator media kit"),
    ],
  },
  "Research Scientist": {
    title: "Research Scientist",
    category: "Science",
    summary: "Design experiments, analyze evidence and communicate scientific findings.",
    education: ["Science", "Engineering"],
    skills: ["Research", "Mathematics", "Statistics", "Data Analysis", "Scientific Writing", "Experimentation"],
    interests: ["Research", "Scientific Discovery", "Data & Analytics", "Technology"],
    roadmap: [
      phase("Research methods", "4 weeks", "Learn literature review, hypotheses, study design and research ethics.", ["Literature", "Hypotheses", "Study design", "Ethics"], "Write a mini research proposal"),
      phase("Statistics & analysis", "4 weeks", "Analyze experimental data and understand uncertainty.", ["Statistics", "Python", "Visualization", "Inference"], "Analyze a public scientific dataset"),
      phase("Experimentation", "5 weeks", "Plan reproducible experiments and document methods carefully.", ["Experiments", "Reproducibility", "Lab notes", "Validation"], "Run and document a small study"),
      phase("Scientific communication", "3 weeks", "Write and present results clearly and accurately.", ["Writing", "Figures", "Peer review", "Presentation"], "Create a research poster and report"),
    ],
  },
  "Financial Analyst": {
    title: "Financial Analyst",
    category: "Finance",
    summary: "Use financial statements, models and data to support business and investment decisions.",
    education: ["Business / Management", "Science", "Engineering"],
    skills: ["Finance", "Accounting", "Microsoft Excel", "Statistics", "Data Analysis", "Business Analytics"],
    interests: ["Finance", "Business Analytics", "Data & Analytics", "Business & Startups"],
    roadmap: [
      phase("Accounting fundamentals", "3 weeks", "Understand income statements, balance sheets and cash flow.", ["Accounting", "Statements", "Ratios", "Cash flow"], "Analyze a public company"),
      phase("Excel & modeling", "4 weeks", "Build reliable financial models and scenario analysis.", ["Excel", "Forecasting", "Scenarios", "Valuation"], "Build a three-statement model"),
      phase("Analysis & valuation", "4 weeks", "Evaluate performance, risk and valuation drivers.", ["KPIs", "Valuation", "Sensitivity", "Risk"], "Create an investment-style analysis"),
      phase("Communication", "2–3 weeks", "Present financial conclusions clearly to decision-makers.", ["Charts", "Memos", "Presentation", "Recommendations"], "Publish a financial analysis deck"),
    ],
  },
};

export const careersByEducation: Record<Education, string[]> = educationOptions.reduce(
  (acc, education) => {
    acc[education] = Object.values(careerCatalog)
      .filter((career) => career.education.includes(education))
      .map((career) => career.title);
    return acc;
  },
  {} as Record<Education, string[]>,
);

const experienceScores: Record<ExperienceLevel, number> = {
  "Complete beginner": 2,
  "Less than 1 year": 5,
  "1–2 years": 7,
  "2–4 years": 9,
  "4+ years": 10,
};

export function calculateMatch(input: {
  education: Education;
  skills: string[];
  career: string;
  experience: ExperienceLevel;
  interests: string[];
}) {
  const career = careerCatalog[input.career];
  if (!career) {
    return {
      matchPercentage: 0,
      breakdown: { education: 0, skills: 0, interests: 0, experience: 0 } satisfies ScoreBreakdown,
      matchingSkills: [] as string[],
      missingSkills: [] as string[],
    };
  }

  const matchingSkills = career.skills.filter((skill) => input.skills.includes(skill));
  const missingSkills = career.skills.filter((skill) => !input.skills.includes(skill));
  const matchingInterests = career.interests.filter((interest) => input.interests.includes(interest));

  const education = career.education.includes(input.education) ? 25 : 8;
  const skills = Math.round((matchingSkills.length / career.skills.length) * 45);
  const interests = career.interests.length
    ? Math.round((matchingInterests.length / career.interests.length) * 20)
    : 10;
  const experience = experienceScores[input.experience];
  const matchPercentage = Math.min(100, education + skills + interests + experience);

  return {
    matchPercentage,
    breakdown: { education, skills, interests, experience } satisfies ScoreBreakdown,
    matchingSkills,
    missingSkills,
  };
}

export function getMatchLabel(score: number) {
  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Strong match";
  if (score >= 55) return "Good potential";
  if (score >= 40) return "Developing match";
  return "Early-stage match";
}
