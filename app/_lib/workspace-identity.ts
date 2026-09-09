"use client";

import { clearLocalAspireWorkspace } from "./local-workspace";

const ACTIVE_USER_KEY = "aspire-active-user-v1";
const LAST_SIGNED_OUT_USER_KEY = "aspire-last-signed-out-user-v1";

function read(key: string) {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(key);
  return value?.trim() || null;
}

export function getActiveWorkspaceUser() {
  return read(ACTIVE_USER_KEY);
}

export function getLastSignedOutWorkspaceUser() {
  return read(LAST_SIGNED_OUT_USER_KEY);
}

export function prepareWorkspaceForUser(userId: string) {
  if (typeof window === "undefined") {
    return { allowLocalImport: false, accountSwitch: false };
  }

  const activeUser = getActiveWorkspaceUser();
  const lastSignedOutUser = getLastSignedOutWorkspaceUser();
  const accountSwitch = Boolean(activeUser && activeUser !== userId);
  const mustStartClean = accountSwitch || Boolean(lastSignedOutUser);

  if (mustStartClean) {
    clearLocalAspireWorkspace();
  }

  window.localStorage.setItem(ACTIVE_USER_KEY, userId);
  window.localStorage.removeItem(LAST_SIGNED_OUT_USER_KEY);

  return {
    // A first-ever sign-in may intentionally import a guest workspace. After any
    // account logout/switch we start clean so one account can never inherit another.
    allowLocalImport: !mustStartClean,
    accountSwitch,
  };
}

export function markWorkspaceSignedOut(userId: string) {
  if (typeof window === "undefined") return;

  clearLocalAspireWorkspace();
  window.localStorage.removeItem(ACTIVE_USER_KEY);
  window.localStorage.setItem(LAST_SIGNED_OUT_USER_KEY, userId);
}

export function clearWorkspaceIdentityForTests() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_USER_KEY);
  window.localStorage.removeItem(LAST_SIGNED_OUT_USER_KEY);
}
