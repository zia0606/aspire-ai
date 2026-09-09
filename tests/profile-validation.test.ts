import { describe, expect, it } from "vitest";
import {
  isProfileV2,
  profileUsesEstimatedLegacyBreakdown,
  upgradeProfile,
} from "../app/_lib/profile-validation";

const currentProfile = {
  version: 2 as const,
  education: "Computer Science" as const,
  skills: ["JavaScript", "React"],
  career: "Full Stack Developer",
  experience: "Less than 1 year" as const,
  interests: ["Building websites"],
  matchPercentage: 64,
  matchBreakdown: { education: 20, skills: 26, interests: 12, experience: 6 },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("profile compatibility", () => {
  it("keeps a valid v2 profile unchanged", () => {
    const upgraded = upgradeProfile(currentProfile);
    expect(upgraded).toBe(currentProfile);
    expect(isProfileV2(upgraded)).toBe(true);
  });

  it("upgrades a legacy profile without changing its saved Career Match", () => {
    const upgraded = upgradeProfile({
      education: "Computer Science",
      skills: ["JavaScript", "React"],
      careerGoal: "Full Stack Developer",
      experience: "Less than 1 year",
      interests: ["Building websites"],
      matchPercentage: 64,
    });

    expect(upgraded).not.toBeNull();
    expect(upgraded?.version).toBe(2);
    expect(upgraded?.career).toBe("Full Stack Developer");
    expect(upgraded?.matchPercentage).toBe(64);
    expect(isProfileV2(upgraded)).toBe(true);
    expect(profileUsesEstimatedLegacyBreakdown(upgraded!)).toBe(true);

    const breakdown = upgraded!.matchBreakdown;
    expect(breakdown.education + breakdown.skills + breakdown.interests + breakdown.experience).toBe(64);
  });

  it("rejects malformed legacy data instead of silently inventing a profile", () => {
    expect(upgradeProfile({
      education: "Unknown degree",
      career: "Full Stack Developer",
      experience: "Less than 1 year",
      skills: [],
      interests: [],
      matchPercentage: 90,
    })).toBeNull();
  });
});
