/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest";
import {
  getActiveWorkspaceUser,
  getLastSignedOutWorkspaceUser,
  markWorkspaceSignedOut,
  prepareWorkspaceForUser,
} from "../app/_lib/workspace-identity";

describe("workspace account isolation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("allows a first-ever account to import an intentional guest workspace", () => {
    window.localStorage.setItem("aspire-profile-v2", JSON.stringify({ guest: true }));

    const prepared = prepareWorkspaceForUser("user-a");

    expect(prepared.allowLocalImport).toBe(true);
    expect(prepared.accountSwitch).toBe(false);
    expect(window.localStorage.getItem("aspire-profile-v2")).not.toBeNull();
    expect(getActiveWorkspaceUser()).toBe("user-a");
  });

  it("clears account A workspace on logout and blocks stale data from entering account B", () => {
    prepareWorkspaceForUser("user-a");
    window.localStorage.setItem("aspire-profile-v2", JSON.stringify({ owner: "A" }));
    window.localStorage.setItem("aspire-applications-v1", JSON.stringify([{ owner: "A" }]));

    markWorkspaceSignedOut("user-a");

    expect(window.localStorage.getItem("aspire-profile-v2")).toBeNull();
    expect(window.localStorage.getItem("aspire-applications-v1")).toBeNull();
    expect(getActiveWorkspaceUser()).toBeNull();
    expect(getLastSignedOutWorkspaceUser()).toBe("user-a");

    // Simulates a stale second tab writing browser-local state after A logged out.
    window.localStorage.setItem("aspire-profile-v2", JSON.stringify({ staleOwner: "A" }));

    const preparedForB = prepareWorkspaceForUser("user-b");

    expect(preparedForB.allowLocalImport).toBe(false);
    expect(window.localStorage.getItem("aspire-profile-v2")).toBeNull();
    expect(getActiveWorkspaceUser()).toBe("user-b");
    expect(getLastSignedOutWorkspaceUser()).toBeNull();
  });

  it("clears local workspace on a direct A to B account switch", () => {
    prepareWorkspaceForUser("user-a");
    window.localStorage.setItem("aspire-portfolio-evidence-v1", JSON.stringify([{ owner: "A" }]));

    const prepared = prepareWorkspaceForUser("user-b");

    expect(prepared.accountSwitch).toBe(true);
    expect(prepared.allowLocalImport).toBe(false);
    expect(window.localStorage.getItem("aspire-portfolio-evidence-v1")).toBeNull();
    expect(getActiveWorkspaceUser()).toBe("user-b");
  });
});
