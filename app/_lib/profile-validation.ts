import {
  educationOptions,
  experienceOptions,
  type Profile,
  type ScoreBreakdown,
} from "./career-data";

const educationSet = new Set<string>(educationOptions);
const experienceSet = new Set<string>(experienceOptions);

type MigratedProfile = Profile & {
  migration?: {
    sourceVersion: string;
    estimatedBreakdown: boolean;
  };
};

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function validBreakdown(value: unknown): value is ScoreBreakdown {
  if (!value || typeof value !== "object") return false;
  const breakdown = value as Partial<ScoreBreakdown>;
  return (
    finiteNumber(breakdown.education) &&
    finiteNumber(breakdown.skills) &&
    finiteNumber(breakdown.interests) &&
    finiteNumber(breakdown.experience)
  );
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return null;
  const strings = value.filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 100);
  return strings.length === value.length ? strings : null;
}

function estimatedBreakdown(matchPercentage: number): ScoreBreakdown {
  // Older Aspire profiles did not always store the component breakdown. Preserve
  // their original Career Match exactly and reconstruct only a neutral display
  // breakdown using the original 20/50/20/10 component weights.
  const education = Math.round(matchPercentage * 0.2);
  const skills = Math.round(matchPercentage * 0.5);
  const interests = Math.round(matchPercentage * 0.2);
  const experience = Math.max(0, Math.round(matchPercentage - education - skills - interests));
  return { education, skills, interests, experience };
}

export function isProfileV2(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<Profile>;

  return (
    profile.version === 2 &&
    typeof profile.education === "string" && educationSet.has(profile.education) &&
    typeof profile.career === "string" && profile.career.trim().length > 0 && profile.career.length <= 200 &&
    typeof profile.experience === "string" && experienceSet.has(profile.experience) &&
    Array.isArray(profile.skills) && profile.skills.length <= 100 &&
    profile.skills.every((item) => typeof item === "string") &&
    Array.isArray(profile.interests) && profile.interests.length <= 100 &&
    profile.interests.every((item) => typeof item === "string") &&
    finiteNumber(profile.matchPercentage) &&
    (profile.matchPercentage as number) >= 0 &&
    (profile.matchPercentage as number) <= 100 &&
    validBreakdown(profile.matchBreakdown) &&
    typeof profile.createdAt === "string" &&
    typeof profile.updatedAt === "string"
  );
}

export function upgradeProfile(value: unknown): Profile | null {
  if (isProfileV2(value)) return value;
  if (!value || typeof value !== "object") return null;

  const legacy = value as Record<string, unknown>;
  const education = typeof legacy.education === "string" ? legacy.education : "";
  const experience = typeof legacy.experience === "string" ? legacy.experience : "";
  const careerValue = legacy.career ?? legacy.careerGoal;
  const career = typeof careerValue === "string" ? careerValue.trim() : "";
  const skills = cleanStringArray(legacy.skills);
  const interests = cleanStringArray(legacy.interests);
  const matchValue = legacy.matchPercentage ?? legacy.percentage ?? legacy.score;
  const matchPercentage = finiteNumber(matchValue) ? Math.round(matchValue as number) : Number.NaN;

  if (
    !educationSet.has(education) ||
    !experienceSet.has(experience) ||
    !career || career.length > 200 ||
    !skills || !interests ||
    !Number.isFinite(matchPercentage) || matchPercentage < 0 || matchPercentage > 100
  ) {
    return null;
  }

  const storedBreakdown = validBreakdown(legacy.matchBreakdown)
    ? legacy.matchBreakdown
    : null;
  const now = new Date().toISOString();
  const createdAt = typeof legacy.createdAt === "string" && legacy.createdAt
    ? legacy.createdAt
    : typeof legacy.updatedAt === "string" && legacy.updatedAt
      ? legacy.updatedAt
      : now;
  const updatedAt = typeof legacy.updatedAt === "string" && legacy.updatedAt
    ? legacy.updatedAt
    : createdAt;

  const migrated: MigratedProfile = {
    version: 2,
    education: education as Profile["education"],
    skills,
    career,
    experience: experience as Profile["experience"],
    interests,
    matchPercentage,
    matchBreakdown: storedBreakdown ?? estimatedBreakdown(matchPercentage),
    createdAt,
    updatedAt,
    migration: {
      sourceVersion: typeof legacy.version === "number" ? String(legacy.version) : "legacy",
      estimatedBreakdown: !storedBreakdown,
    },
  };

  return migrated;
}

export function profileUsesEstimatedLegacyBreakdown(profile: Profile) {
  const migration = (profile as MigratedProfile).migration;
  return migration?.estimatedBreakdown === true;
}
