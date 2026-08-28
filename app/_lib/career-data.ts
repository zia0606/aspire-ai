export type Profile = {
  education: string;
  skills: string[];
  career: string;
  experience: string;
  interests: string[];
  matchPercentage: number;
  matchScore?: number;
  matchBreakdown?: {
    education: number;
    skills: number;
    interests: number;
    experience: number;
  };
};

export const educationOptions = [
  "Computer Science",
  "Engineering",
  "Business / Management",
  "Arts / Humanities",
  "Science",
  "Other",
];

export const skillsByEducation: Record<string, string[]> = {
  "Computer Science": ["HTML", "CSS", "JavaScript", "TypeScript", "Python", "Java", "C / C++", "SQL", "React", "Node.js", "Git & GitHub", "AI / Machine Learning", "Cybersecurity"],
  Engineering: ["Problem Solving", "Mathematics", "AutoCAD", "Python", "Project Management", "Data Analysis", "Electronics", "Communication"],
  "Business / Management": ["Marketing", "Sales", "Finance", "Excel", "Leadership", "Communication", "Business Strategy", "Project Management"],
  "Arts / Humanities": ["Writing", "Research", "Communication", "Graphic Design", "Content Creation", "Social Media", "Photography", "Public Speaking"],
  Science: ["Research", "Data Analysis", "Mathematics", "Python", "Laboratory Skills", "Technical Writing", "Problem Solving"],
  Other: ["Communication", "Problem Solving", "Teamwork", "Leadership", "Digital Skills", "Creativity", "Time Management"],
};

export const careersByEducation: Record<string, string[]> = {
  "Computer Science": ["Full Stack Developer", "AI / ML Engineer", "Cybersecurity Analyst", "Data Analyst", "UI/UX Designer"],
  Engineering: ["Software Engineer", "Product Manager", "Data Analyst", "Entrepreneur"],
  "Business / Management": ["Digital Marketer", "Business Analyst", "Product Manager", "Entrepreneur"],
  "Arts / Humanities": ["UI/UX Designer", "Content Strategist", "Digital Marketer", "Entrepreneur"],
  Science: ["Data Analyst", "AI / ML Engineer", "Research Analyst", "Software Engineer"],
  Other: ["Full Stack Developer", "UI/UX Designer", "Digital Marketer", "Entrepreneur"],
};

export const interestOptions = [
  "Building products", "Solving problems", "Artificial intelligence", "Design and creativity",
  "Business and startups", "Data and research", "Helping people", "Technology and security",
];

export const careerRequirements: Record<string, { skills: string[]; interests: string[] }> = {
  "Full Stack Developer": { skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git & GitHub"], interests: ["Building products", "Solving problems"] },
  "AI / ML Engineer": { skills: ["Python", "Mathematics", "Data Analysis", "AI / Machine Learning", "SQL"], interests: ["Artificial intelligence", "Data and research", "Solving problems"] },
  "Cybersecurity Analyst": { skills: ["Cybersecurity", "Python", "Problem Solving", "Git & GitHub"], interests: ["Technology and security", "Solving problems"] },
  "Data Analyst": { skills: ["Data Analysis", "SQL", "Python", "Excel", "Mathematics"], interests: ["Data and research", "Solving problems"] },
  "UI/UX Designer": { skills: ["Graphic Design", "Research", "Communication", "Creativity"], interests: ["Design and creativity", "Building products", "Helping people"] },
  "Software Engineer": { skills: ["Python", "Java", "C / C++", "Problem Solving", "Git & GitHub"], interests: ["Building products", "Solving problems"] },
  "Product Manager": { skills: ["Project Management", "Communication", "Leadership", "Business Strategy"], interests: ["Building products", "Business and startups", "Helping people"] },
  "Digital Marketer": { skills: ["Marketing", "Content Creation", "Social Media", "Communication"], interests: ["Design and creativity", "Business and startups"] },
  "Business Analyst": { skills: ["Data Analysis", "Excel", "Communication", "Business Strategy"], interests: ["Data and research", "Business and startups", "Solving problems"] },
  Entrepreneur: { skills: ["Sales", "Marketing", "Leadership", "Finance", "Communication"], interests: ["Business and startups", "Building products", "Solving problems"] },
  "Content Strategist": { skills: ["Writing", "Research", "Content Creation", "Social Media"], interests: ["Design and creativity", "Helping people"] },
  "Research Analyst": { skills: ["Research", "Data Analysis", "Technical Writing", "Mathematics"], interests: ["Data and research", "Solving problems"] },
};

export function calculateMatch(profile: Omit<Profile, "matchPercentage">) {
  const requirements = careerRequirements[profile.career] ?? { skills: [], interests: [] };
  const matchingSkills = requirements.skills.filter((skill) => profile.skills.includes(skill));
  const matchingInterests = requirements.interests.filter((interest) => profile.interests.includes(interest));
  const education = profile.education ? 20 : 0;
  const skills = requirements.skills.length ? Math.round(Math.min(matchingSkills.length / requirements.skills.length, 1) * 45) : 25;
  const interests = requirements.interests.length ? Math.round(Math.min(matchingInterests.length / requirements.interests.length, 1) * 25) : 15;
  const experienceScores: Record<string, number> = { "Just starting": 4, "Some practice": 7, "Project experience": 9, "Professional experience": 10 };
  const experience = experienceScores[profile.experience] ?? 0;
  const matchPercentage = Math.min(100, education + skills + interests + experience);
  return { matchPercentage, breakdown: { education, skills, interests, experience }, matchingSkills };
}

export function readProfile(): Profile | null {
  try {
    const value = localStorage.getItem("aspire-profile");
    return value ? (JSON.parse(value) as Profile) : null;
  } catch {
    return null;
  }
}
