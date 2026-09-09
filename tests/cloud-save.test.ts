/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";

function successfulResponse() {
  return Promise.resolve(new Response(JSON.stringify({ saved: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
}

describe("cloud save reliability", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("shows a confirmed save only after the server returns saved:true", async () => {
    const identity = await import("../app/_lib/workspace-identity");
    identity.prepareWorkspaceForUser("user-a");
    const fetchMock = vi.fn(successfulResponse);
    vi.stubGlobal("fetch", fetchMock);
    const cloud = await import("../app/_lib/cloud-save");

    const result = await cloud.queueCloudSave({ type: "applications", applications: [] });

    expect(result.ok).toBe(true);
    expect(result.pending).toBe(0);
    expect(cloud.pendingCloudSaveCount("user-a")).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem("aspire-cloud-save-queue-v1")).toBeNull();
  });

  it("keeps a failed upload queued and succeeds on a later retry", async () => {
    const identity = await import("../app/_lib/workspace-identity");
    identity.prepareWorkspaceForUser("user-a");
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const cloud = await import("../app/_lib/cloud-save");

    const first = await cloud.queueCloudSave({ type: "portfolio", evidence: [] });
    expect(first.ok).toBe(false);
    expect(first.pending).toBe(1);
    expect(cloud.hasPendingCloudSaves("user-a")).toBe(true);

    fetchMock.mockImplementation(successfulResponse);
    const retry = await cloud.flushPendingCloudSaves("user-a", { attempts: 2 });

    expect(retry.ok).toBe(true);
    expect(retry.pending).toBe(0);
    expect(cloud.hasPendingCloudSaves("user-a")).toBe(false);
  });

  it("coalesces repeated board saves so the newest state replaces the older pending state", async () => {
    const identity = await import("../app/_lib/workspace-identity");
    identity.prepareWorkspaceForUser("user-a");
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const cloud = await import("../app/_lib/cloud-save");

    await cloud.queueCloudSave({ type: "applications", applications: [{ id: "old" }] });
    await cloud.queueCloudSave({ type: "applications", applications: [{ id: "new" }] });

    const queue = JSON.parse(window.localStorage.getItem("aspire-cloud-save-queue-v1") ?? "[]") as Array<{ payload: { applications?: Array<{ id?: string }> } }>;
    expect(queue).toHaveLength(1);
    expect(queue[0]?.payload.applications?.[0]?.id).toBe("new");
  });

  it("keeps guest work local instead of creating a cross-account retry queue", async () => {
    const fetchMock = vi.fn(successfulResponse);
    vi.stubGlobal("fetch", fetchMock);
    const cloud = await import("../app/_lib/cloud-save");

    const result = await cloud.queueCloudSave({ type: "profile", profile: { guest: true } });

    expect(result.localOnly).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("aspire-cloud-save-queue-v1")).toBeNull();
  });
});
