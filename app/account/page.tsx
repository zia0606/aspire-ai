"use client";

import { FormEvent, useEffect, useState } from "react";
import AppNav from "../_components/app-nav";
import { authClient } from "../_lib/auth-client";
import { useProfile } from "../_lib/profile-store";

type Status = {
  databaseConfigured: boolean;
  authConfigured: boolean;
};

export default function AccountPage() {
  const profile = useProfile();
  const { data: session, isPending } = authClient.useSession();
  const [status, setStatus] = useState<Status | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetch("/api/system/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setStatus(data as Status))
      .catch(() => setStatus({ databaseConfigured: false, authConfigured: false }));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!status?.authConfigured) {
      setMessage("Cloud accounts are not connected yet. Your local Aspire workspace is still fully available.");
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

      setMessage("Signed in. Aspire is syncing your saved workspace now.");
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      setMessage("The account service could not be reached. Your local data is unchanged.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    await authClient.signOut();
    window.location.reload();
  }

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
                <span className="status-pill status-good">Cloud sync on</span>
                <h2 className="panel-title">{session.user.name || session.user.email}</h2>
                <p className="muted-copy">{session.user.email}</p>
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
                  <span className="metric-label">Storage</span>
                  <strong>Local + cloud</strong>
                </div>
              </div>

              <p className="info-note">
                Local storage remains the immediate working copy. Aspire mirrors changes to your account and restores cloud data when you sign in on another browser.
              </p>

              <button type="button" className="button-secondary" onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
          ) : (
            <div className="account-auth-grid">
              <div>
                <span className={`status-pill ${status?.authConfigured ? "status-good" : "status-neutral"}`}>
                  {status?.authConfigured ? "Cloud ready" : "Local mode"}
                </span>
                <h2 className="panel-title">{mode === "signin" ? "Sign in" : "Create an account"}</h2>
                <p className="muted-copy">
                  {status?.authConfigured
                    ? "Your current browser profile will be imported automatically if this account has no saved Aspire profile yet."
                    : "The account UI is ready, but Neon credentials have not been connected yet. Nothing in your current workspace is blocked."}
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

                <button type="submit" className="button-primary" disabled={submitting}>
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
