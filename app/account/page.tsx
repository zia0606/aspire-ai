"use client";

import { FormEvent, useEffect, useState } from "react";
import AppNav from "../_components/app-nav";
import { authClient } from "../_lib/auth-client";
import {
  cloudSaveLabel,
  flushPendingCloudSaves,
  hasPendingCloudSaves,
  useCloudSaveStatus,
} from "../_lib/cloud-save";
import { useProfile } from "../_lib/profile-store";
import { markWorkspaceSignedOut } from "../_lib/workspace-identity";

type Status = {
  databaseConfigured: boolean;
  authConfigured: boolean;
  databaseConnected: boolean;
  requiredTablesReady: boolean;
  missingTables: string[];
  databaseLatencyMs: number | null;
  cloudReady: boolean;
};

const fallbackStatus: Status = {
  databaseConfigured: false,
  authConfigured: false,
  databaseConnected: false,
  requiredTablesReady: false,
  missingTables: [],
  databaseLatencyMs: null,
  cloudReady: false,
};

export default function AccountPage() {
  const profile = useProfile();
  const { data: session, isPending } = authClient.useSession();
  const saveState = useCloudSaveStatus();
  const [status, setStatus] = useState<Status | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    void fetch("/api/system/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setStatus(data as Status))
      .catch(() => setStatus(fallbackStatus));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!status?.cloudReady) {
      const reason = status?.databaseConnected === false
        ? "Neon cannot be reached right now."
        : status?.requiredTablesReady === false
          ? "The required database tables are not ready."
          : "Cloud accounts are not connected yet.";
      setMessage(`${reason} Your local Aspire workspace is unchanged.`);
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({
          name: name.trim() || "Aspire user",
          email: email.trim(),
          password,
        });

        if (result.error) {
          setMessage(result.error.message || "Could not create the account.");
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
        });

        if (result.error) {
          setMessage(result.error.message || "Could not sign in.");
          return;
        }
      }

      setMessage("Signed in. Aspire is restoring and syncing your workspace now.");
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      setMessage("The account service could not be reached. Your local data is unchanged.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    const userId = session?.user?.id;
    if (!userId) return;

    setMessage("");
    setSigningOut(true);

    try {
      if (hasPendingCloudSaves(userId)) {
        setMessage("Finishing pending cloud saves before sign-out…");
        let syncResult = await flushPendingCloudSaves(userId, { attempts: 3 });
        if (!syncResult.ok) {
          syncResult = await flushPendingCloudSaves(userId, { attempts: 2 });
        }

        if (!syncResult.ok) {
          const discard = window.confirm(
            "Some recent Aspire changes could not be saved to Neon. Signing out now will clear this browser copy of those unsaved changes.\n\nChoose Cancel to stay signed in and keep the local changes, or OK to sign out anyway.",
          );
          if (!discard) {
            setMessage("Sign-out cancelled. Your local changes are still here and Aspire will keep retrying cloud save.");
            return;
          }
        }
      }

      const result = await authClient.signOut();
      if (result.error) {
        setMessage(result.error.message || "Could not sign out. Your local data is unchanged.");
        return;
      }

      markWorkspaceSignedOut(userId);
      window.location.assign("/account");
    } catch {
      setMessage("Could not sign out. Your local data is unchanged.");
    } finally {
      setSigningOut(false);
    }
  }

  const signedIn = Boolean(session?.user?.id);
  const syncLabel = cloudSaveLabel(saveState, signedIn);
  const syncClass = saveState.status === "failed"
    ? "status-pill status-pill-warning"
    : saveState.status === "saved"
      ? "status-pill status-pill-success"
      : "status-pill status-good";

  return (
    <main className="page-shell">
      <AppNav active="account" />

      <div className="page-content narrow-page">
        <div className="section-kicker">Account & sync</div>
        <h1 className="page-title">Keep your career workspace with you.</h1>
        <p className="page-lede">
          Aspire still works without an account. Signing in adds cloud persistence so the same assessment, roadmap and saved analyses can follow you to another browser or device.
        </p>

        <section className="workspace-panel account-panel">
          {isPending ? (
            <p className="muted-copy">Checking account status…</p>
          ) : session?.user ? (
            <div className="account-signed-in">
              <div>
                <span className={syncClass}>{syncLabel}</span>
                <h2 className="panel-title">{session.user.name || session.user.email}</h2>
                <p className="muted-copy">{session.user.email}</p>
                {saveState.status === "failed" && (
                  <button
                    type="button"
                    className="button-quiet mt-2"
                    onClick={() => void flushPendingCloudSaves(session.user.id, { attempts: 2 })}
                  >
                    Retry cloud save now
                  </button>
                )}
              </div>

              <div className="account-summary-grid">
                <div>
                  <span className="metric-label">Saved direction</span>
                  <strong>{profile?.career ?? "No assessment yet"}</strong>
                </div>
                <div>
                  <span className="metric-label">Career match</span>
                  <strong>{profile ? `${profile.matchPercentage}%` : "—"}</strong>
                </div>
                <div>
                  <span className="metric-label">Pending saves</span>
                  <strong>{saveState.pending}</strong>
                </div>
              </div>

              <p className="info-note">
                {saveState.status === "failed"
                  ? `${saveState.message} Your browser copy is being kept and Aspire will retry automatically.`
                  : "Local storage is the immediate working copy. Confirmed saves are mirrored to Neon and restored when you sign in on another browser."}
              </p>

              {status && (
                <p className="muted-copy">
                  Neon: {status.databaseConnected ? "connected" : "unavailable"} · Database schema: {status.requiredTablesReady ? "ready" : `${status.missingTables.length || "some"} table(s) missing`}
                  {status.databaseLatencyMs !== null ? ` · ${status.databaseLatencyMs} ms health check` : ""}
                </p>
              )}

              {message && <p className="form-message">{message}</p>}

              <button
                type="button"
                className="button-secondary"
                onClick={() => void signOut()}
                disabled={signingOut}
              >
                {signingOut ? "Finishing saves & signing out…" : "Sign out"}
              </button>
            </div>
          ) : (
            <div className="account-auth-grid">
              <div>
                <span className={`status-pill ${status?.cloudReady ? "status-good" : "status-neutral"}`}>
                  {status?.cloudReady ? "Cloud ready" : "Local mode"}
                </span>
                <h2 className="panel-title">{mode === "signin" ? "Sign in" : "Create an account"}</h2>
                <p className="muted-copy">
                  {status?.cloudReady
                    ? "On a first-ever sign-in, Aspire can import a guest workspace. After an account logout or switch, it starts clean and restores only that account's Neon data."
                    : status?.databaseConnected === false && status?.databaseConfigured
                      ? "Neon is configured but is not reachable right now. Your local workspace remains available."
                      : status?.requiredTablesReady === false && status?.databaseConnected
                        ? `Database connected, but required tables are missing${status.missingTables.length ? `: ${status.missingTables.join(", ")}` : "."}`
                        : "The account UI is ready, but cloud persistence is not fully available yet. Your local workspace is not blocked."}
                </p>

                <div className="segmented-control" aria-label="Account mode">
                  <button type="button" className={mode === "signin" ? "segment-active" : ""} onClick={() => setMode("signin")}>Sign in</button>
                  <button type="button" className={mode === "signup" ? "segment-active" : ""} onClick={() => setMode("signup")}>Create account</button>
                </div>
              </div>

              <form onSubmit={submit} className="account-form">
                {mode === "signup" && (
                  <label>
                    <span>Name</span>
                    <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Your name" />
                  </label>
                )}

                <label>
                  <span>Email</span>
                  <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required placeholder="you@example.com" />
                </label>

                <label>
                  <span>Password</span>
                  <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} required autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="At least 8 characters" />
                </label>

                {message && <p className="form-message">{message}</p>}

                <button type="submit" className="button-primary" disabled={submitting || status?.cloudReady === false}>
                  {submitting ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
