"use client";

import { useEffect, useRef } from "react";
import {
  hydrateApplications,
  isApplicationRecord,
  readApplicationsLocal,
} from "../_lib/application-store";
import { authClient } from "../_lib/auth-client";
import {
  flushPendingCloudSaves,
  hasPendingCloudSaves,
  queueCloudSave,
} from "../_lib/cloud-save";
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
import { upgradeProfile } from "../_lib/profile-validation";
import {
  hydrateProfile,
  hydrateRoadmapProgress,
  readProfileLocal,
  readRoadmapProgressLocal,
} from "../_lib/profile-store";
import {
  getActiveWorkspaceUser,
  markWorkspaceSignedOut,
  prepareWorkspaceForUser,
} from "../_lib/workspace-identity";

type CloudState = {
  mode?: "local" | "guest" | "cloud";
  signedIn?: boolean;
  profile?: unknown;
  roadmaps?: Array<{ career?: unknown; completed?: unknown }>;
  applications?: unknown;
  portfolioEvidence?: unknown;
  interviewPractice?: unknown;
};

export default function CloudSyncBridge() {
  const { data: session, isPending } = authClient.useSession();
  const syncedUser = useRef<string | null>(null);

  useEffect(() => {
    if (isPending) return;

    const userId = session?.user?.id;
    if (!userId) {
      const activeUser = getActiveWorkspaceUser();
      if (activeUser) markWorkspaceSignedOut(activeUser);
      syncedUser.current = null;
      return;
    }

    if (syncedUser.current === userId) return;

    const workspace = prepareWorkspaceForUser(userId);
    syncedUser.current = userId;
    let cancelled = false;

    async function sync() {
      try {
        // Never let an older cloud snapshot overwrite newer local changes that are
        // still waiting for upload. Retry those first and preserve local state if
        // the network is still unavailable.
        if (hasPendingCloudSaves(userId)) {
          const pendingResult = await flushPendingCloudSaves(userId, { attempts: 2 });
          if (!pendingResult.ok || cancelled) return;
        }

        const response = await fetch("/api/data/state", { cache: "no-store" });
        if (!response.ok) return;
        const state = (await response.json()) as CloudState;
        if (cancelled || state.mode !== "cloud") return;

        const localProfile = readProfileLocal();
        const cloudProfile = upgradeProfile(state.profile);
        let activeProfile = localProfile;

        if (cloudProfile) {
          hydrateProfile(cloudProfile);
          activeProfile = cloudProfile;
        } else if (localProfile && workspace.allowLocalImport) {
          await queueCloudSave({ type: "profile", profile: localProfile });
        }

        const roadmaps = Array.isArray(state.roadmaps) ? state.roadmaps : [];
        for (const roadmap of roadmaps) {
          if (typeof roadmap.career !== "string" || !Array.isArray(roadmap.completed)) continue;
          const completed = roadmap.completed.filter(
            (item): item is number => Number.isInteger(item) && item >= 0,
          );
          hydrateRoadmapProgress(roadmap.career, completed);
        }

        if (activeProfile && workspace.allowLocalImport) {
          const hasCloudRoadmap = roadmaps.some((item) => item.career === activeProfile?.career);
          if (!hasCloudRoadmap) {
            const localCompleted = readRoadmapProgressLocal(activeProfile.career);
            if (localCompleted.length) {
              await queueCloudSave({
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
        } else if (localApplications.length && workspace.allowLocalImport) {
          await queueCloudSave({ type: "applications", applications: localApplications });
        }

        const localPortfolio = readPortfolioLocal();
        const cloudPortfolio = Array.isArray(state.portfolioEvidence)
          ? state.portfolioEvidence.filter(isPortfolioEvidence)
          : [];

        if (cloudPortfolio.length) {
          hydratePortfolio(cloudPortfolio);
        } else if (localPortfolio.length && workspace.allowLocalImport) {
          await queueCloudSave({ type: "portfolio", evidence: localPortfolio });
        }

        const localInterview = readInterviewPracticeLocal();
        const cloudInterview = Array.isArray(state.interviewPractice)
          ? state.interviewPractice.filter(isInterviewPracticeRecord)
          : [];

        if (cloudInterview.length) {
          hydrateInterviewPractice(cloudInterview);
        } else if (localInterview.length && workspace.allowLocalImport) {
          await queueCloudSave({ type: "interview", practice: localInterview });
        }
      } catch {
        // Keep the local workspace intact. The save queue will retry when the
        // connection returns rather than silently throwing local work away.
      }
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [isPending, session?.user?.id]);

  return null;
}
