import type { Profile } from "./career-data";

export function isProfileV2(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<Profile>;
  const breakdown = profile.matchBreakdown;

  return (
    profile.version === 2 &&
    typeof profile.education === "string" &&
    typeof profile.career === "string" &&
    typeof profile.experience === "string" &&
    Array.isArray(profile.skills) &&
    profile.skills.every((item) => typeof item === "string") &&
    Array.isArray(profile.interests) &&
    profile.interests.every((item) => typeof item === "string") &&
    typeof profile.matchPercentage === "number" &&
    Number.isFinite(profile.matchPercentage) &&
    profile.matchPercentage >= 0 &&
    profile.matchPercentage <= 100 &&
    Boolean(breakdown) &&
    typeof breakdown?.education === "number" &&
    typeof breakdown?.skills === "number" &&
    typeof breakdown?.interests === "number" &&
    typeof breakdown?.experience === "number" &&
    typeof profile.createdAt === "string" &&
    typeof profile.updatedAt === "string"
  );
}
