"use client";

import Link from "next/link";
import { useProfile } from "../_lib/profile-store";

type ActivePage = "assessment" | "explore" | "dashboard" | "roadmap" | "applications" | "resume" | "assistant" | "account";

const links: Array<{ href: string; label: string; key: ActivePage }> = [
  { href: "/assessment", label: "Assessment", key: "assessment" },
  { href: "/explore", label: "Explore", key: "explore" },
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/roadmap", label: "Roadmap", key: "roadmap" },
  { href: "/applications", label: "Applications", key: "applications" },
  { href: "/resume", label: "Resume", key: "resume" },
  { href: "/assistant", label: "Coach", key: "assistant" },
  { href: "/account", label: "Account", key: "account" },
];

export default function AppNav({ active }: { active: ActivePage }) {
  const profile = useProfile();

  return (
    <header className="product-nav">
      <div className="product-nav-inner">
        <Link href="/" className="brand-lockup" aria-label="Aspire AI home">
          <span className="brand-mark">A</span>
          <span className="brand-copy">
            <strong>Aspire</strong>
            <small>career workspace</small>
          </span>
        </Link>

        <nav className="product-links" aria-label="Aspire product navigation">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`product-link ${active === link.key ? "product-link-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="product-context">
          {profile ? (
            <Link href="/dashboard" className="saved-profile-chip" title={`Saved profile: ${profile.career}`}>
              <span className="saved-profile-dot" />
              <span className="saved-profile-text">{profile.career}</span>
              <strong>{profile.matchPercentage}%</strong>
            </Link>
          ) : (
            <Link href="/assessment" className="saved-profile-chip saved-profile-empty">
              No profile yet
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
