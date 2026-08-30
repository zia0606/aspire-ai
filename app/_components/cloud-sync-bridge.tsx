"use client";

import { useEffect, useRef } from "react";
import {
  hydrateApplications,
  isApplicationRecord,
  readApplicationsLocal,
} from "../_lib/application-store";
import { authClient } from "../_lib/auth-client";
import type { Profile } from "../_lib/career-data";
import {
  hydrateInterviewPractice,
  isInterviewPracticeRecord,
  readInterviewPracticeLocal,
} from "../_lib/interview-store";
import {
  hydratePortfolio,
  isPortfolioEvidence,
  readPortfolioLocal,
} from "../_lib/portfolio-store";
import { isProfileV2 } from "../_lib/profile-validation";
import {
  hydrateProfile,
  hydrateRoadmapProgress,
  readProfileLocal,
  readRoadmapProgressLocal,
} from "../_lib/profile-store";

type CloudState = {
  mode?: "local" | "guest" | "cloud";
  signedIn?: boolean;
  profile?: unknown;
  roadmaps?: Array<{ career?: unknown; completed?: unknown }>;
  applications?: unknown;
  portfolioEvidence?: unknown;
  interviewPractice?: unknown;
};

function postState(payload: unknown) {
  return fetch("/api/data/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export default function CloudSyncBridge() {
  const { data: session } = authClient.useSession();
  const syncedUser = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || syncedUser.current === userId) return;
    syncedUser.current = userId;

    let cancelled = false;

    async function sync() {
      try {
        const response = await fetch("/api/data/state", { cache: "no-store" });
        if (!response.ok) return;
        const state = (await response.json()) as CloudState;
        if (cancelled || state.mode !== "cloud") return;

        const localProfile = readProfileLocal();
        const cloudProfile = isProfileV2(state.profile) ? (state.profile as Profile) : null;
        let activeProfile = localProfile;

        if (cloudProfile) {
          hydrateProfile(cloudProfile);
          activeProfile = cloudProfile;
        } else if (localProfile) {
          await postState({ type: "profile", profile: localProfile });
        }

        const roadmaps = Array.isArray(state.roadmaps) ? state.roadmaps : [];
        for (const roadmap of roadmaps) {
          if (typeof roadmap.career !== "string" || !Array.isArray(roadmap.completed)) continue;
          const completed = roadmap.completed.filter(
            (item): item is number => Number.isInteger(item) && item >= 0,
          );
          hydrateRoadmapProgress(roadmap.career, completed);
        }

        if (activeProfile) {
          const hasCloudRoadmap = roadmaps.some((item) => item.career === activeProfile?.career);
          if (!hasCloudRoadmap) {
            const localCompleted = readRoadmapProgressLocal(activeProfile.career);
            if (localCompleted.length) {
              await postState({
                type: "roadmap",
                career: activeProfile.career,
                completed: localCompleted,
              });
            }
          }
        }

        const localApplications = readApplicationsLocal();
        const cloudApplications = Array.isArray(state.applications)
          ? state.applications.filter(isApplicationRecord)
          : [];

        if (cloudApplications.length) {
          hydrateApplications(cloudApplications);
        } else if (localApplications.length) {
          await postState({ type: "applications", applications: localApplications });
        }

        const localPortfolio = readPortfolioLocal();
        const cloudPortfolio = Array.isArray(state.portfolioEvidence)
          ? state.portfolioEvidence.filter(isPortfolioEvidence)
          : [];

        if (cloudPortfolio.length) {
          hydratePortfolio(cloudPortfolio);
        } else if (localPortfolio.length) {
          await postState({ type: "portfolio", evidence: localPortfolio });
        }

        const localInterview = readInterviewPracticeLocal();
        const cloudInterview = Array.isArray(state.interviewPractice)
          ? state.interviewPractice.filter(isInterviewPracticeRecord)
          : [];

        if (cloudInterview.length) {
          hydrateInterviewPractice(cloudInterview);
        } else if (localInterview.length) {
          await postState({ type: "interview", practice: localInterview });
        }
      } catch {
        // Keep the existing local state if cloud sync cannot be reached.
      }
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  return null;
}
