import type { Metadata } from "next";
import type { ReactNode } from "react";
import CloudSyncBridge from "./_components/cloud-sync-bridge";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aspire AI — Career Planning Workspace",
  description:
    "Assess your profile, understand your fit, build a career roadmap, review your resume and plan your next move.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CloudSyncBridge />
        {children}
      </body>
    </html>
  );
}
