"use client";

import { type FormEvent, useMemo, useState } from "react";
import AppNav from "../_components/app-nav";
import {
  applicationStages,
  type ApplicationRecord,
  type ApplicationStage,
  useApplications,
} from "../_lib/application-store";
import { useProfile } from "../_lib/profile-store";

type Filter = "All" | "Active" | ApplicationStage;

type Draft = {
  company: string;
  role: string;
  stage: ApplicationStage;
  location: string;
  url: string;
  source: string;
  nextAction: string;
  dueDate: string;
  notes: string;
};

const emptyDraft: Draft = {
  company: "",
  role: "",
  stage: "Saved",
  location: "",
  url: "",
  source: "",
  nextAction: "",
  dueDate: "",
  notes: "",
};

const activeStages = new Set<ApplicationStage>(["Saved", "Applied", "Interview"]);
const closedStages = new Set<ApplicationStage>(["Offer", "Rejected", "Withdrawn"]);

function normalizeUrl(value: string) {
  const clean = value.trim();
  if (!clean) return "";
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

function daysUntil(value: string) {
  if (!value) return null;
  const due = new Date(`${value}T23:59:59`);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
}

function dueLabel(value: string) {
  const days = daysUntil(value);
  if (days === null) return "No deadline";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

export default function ApplicationsPage() {
  const profile = useProfile();
  const { applications, saveApplications } = useApplications();
  const [filter, setFilter] = useState<Filter>("Active");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const active = applications.filter((item) => activeStages.has(item.stage)).length;
  const interviews = applications.filter((item) => item.stage === "Interview").length;
  const offers = applications.filter((item) => item.stage === "Offer").length;
  const dueSoon = applications.filter((item) => {
    if (!activeStages.has(item.stage)) return false;
    const days = daysUntil(item.dueDate);
    return days !== null && days >= 0 && days <= 7;
  }).length;

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return applications
      .filter((item) => {
        if (filter === "All") return true;
        if (filter === "Active") return activeStages.has(item.stage);
        return item.stage === filter;
      })
      .filter((item) => {
        if (!search) return true;
        return [item.company, item.role, item.location, item.source, item.nextAction, item.notes]
          .join(" ")
          .toLowerCase()
          .includes(search);
      })
      .sort((a, b) => {
        const aDays = daysUntil(a.dueDate);
        const bDays = daysUntil(b.dueDate);
        if (aDays !== null && bDays !== null && aDays !== bDays) return aDays - bDays;
        if (aDays !== null && bDays === null) return -1;
        if (aDays === null && bDays !== null) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [applications, filter, query]);

  function beginAdd() {
    setEditingId(null);
    setDraft({ ...emptyDraft, role: profile?.career ?? "" });
    setShowForm(true);
  }

  function beginEdit(item: ApplicationRecord) {
    setEditingId(item.id);
    setDraft({
      company: item.company,
      role: item.role,
      stage: item.stage,
      location: item.location,
      url: item.url,
      source: item.source,
      nextAction: item.nextAction,
      dueDate: item.dueDate,
      notes: item.notes,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setDraft(emptyDraft);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.company.trim() || !draft.role.trim()) return;

    const now = new Date().toISOString();
    if (editingId) {
      saveApplications(
        applications.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...draft,
                company: draft.company.trim(),
                role: draft.role.trim(),
                url: normalizeUrl(draft.url),
                updatedAt: now,
              }
            : item,
        ),
      );
    } else {
      saveApplications([
        {
          id: crypto.randomUUID(),
          ...draft,
          company: draft.company.trim(),
          role: draft.role.trim(),
          url: normalizeUrl(draft.url),
          createdAt: now,
          updatedAt: now,
        },
        ...applications,
      ]);
    }

    cancelForm();
  }

  function changeStage(id: string, stage: ApplicationStage) {
    const now = new Date().toISOString();
    saveApplications(
      applications.map((item) => item.id === id ? { ...item, stage, updatedAt: now } : item),
    );
  }

  function remove(id: string) {
    saveApplications(applications.filter((item) => item.id !== id));
  }

  return (
    <main className="page-shell">
      <AppNav active="applications" />

      <section className="page-container py-10 md:py-14">
        <div className="grid gap-8 border-b border-[var(--line-strong)] pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Applications</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
              Turn career planning into real follow-through.
            </h1>
            <p className="text-muted mt-5 max-w-3xl text-lg leading-8">
              Track internships and jobs you actually care about, keep the next action visible, and move each opportunity through your pipeline without losing context.
            </p>
          </div>
          <button type="button" className="button-primary" onClick={beginAdd}>Add opportunity</button>
        </div>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Active" value={String(active)} note="Saved, applied or interviewing" />
          <Metric label="Interviews" value={String(interviews)} note="Currently in interview stage" />
          <Metric label="Offers" value={String(offers)} note="Offers recorded" />
          <Metric label="Due this week" value={String(dueSoon)} note="Active follow-ups or deadlines" />
        </section>

        {profile && (
          <div className="mt-5 border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-sm leading-6 text-[#263b85]">
            Your saved direction is <strong>{profile.career}</strong>. The tracker can include other roles too; adding an application never changes the assessment profile.
          </div>
        )}

        {showForm && (
          <ApplicationForm
            draft={draft}
            editing={Boolean(editingId)}
            onChange={setDraft}
            onSubmit={submit}
            onCancel={cancelForm}
          />
        )}

        <section className="mt-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <label>
            <span className="sr-only">Search applications</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, role, source or next action…"
              className="w-full rounded-[.7rem] border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3 outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["Active", "All", ...applicationStages] as Filter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`whitespace-nowrap rounded-[.6rem] border px-3 py-2 text-sm font-semibold ${
                  filter === item
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">Pipeline</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.03em]">
              {visible.length} opportunit{visible.length === 1 ? "y" : "ies"}
            </h2>
          </div>
          <span className="text-faint text-sm">Keep one clear next action per active application.</span>
        </div>

        {visible.length ? (
          <div className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)] bg-[var(--surface)] px-5 md:px-7">
            {visible.map((item) => (
              <ApplicationRow
                key={item.id}
                item={item}
                onEdit={() => beginEdit(item)}
                onRemove={() => remove(item.id)}
                onStage={(stage) => changeStage(item.id, stage)}
              />
            ))}
          </div>
        ) : (
          <div className="workspace-panel mt-5 p-8 text-center">
            <h2 className="text-xl font-semibold">No opportunities here yet.</h2>
            <p className="text-muted mx-auto mt-2 max-w-lg leading-7">
              Add a role you found through college, LinkedIn, a company careers page or a referral. Aspire tracks the process; it does not invent opportunities.
            </p>
            <button type="button" className="button-primary mt-5" onClick={beginAdd}>Add first opportunity</button>
          </div>
        )}

        <section className="mt-10 grid gap-5 border-t border-[var(--line-strong)] pt-8 md:grid-cols-3">
          <Guideline title="Saved" text="Capture roles worth considering. Add the source and the reason it matters before the link disappears." />
          <Guideline title="Applied" text="Write the exact follow-up action and a date. A tracker is useful only when it tells you what happens next." />
          <Guideline title="Interview" text="Use notes for people, topics and preparation. Keep sensitive information out of the tracker." />
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="workspace-panel p-5">
      <span className="metric-label">{label}</span>
      <strong className="metric-number block text-3xl font-semibold">{value}</strong>
      <p className="text-faint mt-2 text-xs leading-5">{note}</p>
    </div>
  );
}

function ApplicationForm({
  draft,
  editing,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: Draft;
  editing: boolean;
  onChange: (draft: Draft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <form onSubmit={onSubmit} className="workspace-panel mt-7 p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{editing ? "Edit opportunity" : "New opportunity"}</p>
          <h2 className="mt-2 text-2xl font-semibold">{editing ? "Update the application record" : "Capture the role while it is fresh"}</h2>
        </div>
        <button type="button" className="button-quiet" onClick={onCancel}>Cancel</button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Company" required><input value={draft.company} onChange={(e) => field("company", e.target.value)} required placeholder="Company name" /></Field>
        <Field label="Role" required><input value={draft.role} onChange={(e) => field("role", e.target.value)} required placeholder="Role or internship" /></Field>
        <Field label="Stage"><select value={draft.stage} onChange={(e) => field("stage", e.target.value as ApplicationStage)}>{applicationStages.map((stage) => <option key={stage}>{stage}</option>)}</select></Field>
        <Field label="Location"><input value={draft.location} onChange={(e) => field("location", e.target.value)} placeholder="Mumbai, Remote, Hybrid…" /></Field>
        <Field label="Opportunity link"><input value={draft.url} onChange={(e) => field("url", e.target.value)} placeholder="careers.company.com/job…" /></Field>
        <Field label="Source"><input value={draft.source} onChange={(e) => field("source", e.target.value)} placeholder="College, referral, LinkedIn…" /></Field>
        <Field label="Next action"><input value={draft.nextAction} onChange={(e) => field("nextAction", e.target.value)} placeholder="Tailor resume, follow up, prepare round 1…" /></Field>
        <Field label="Action date"><input type="date" value={draft.dueDate} onChange={(e) => field("dueDate", e.target.value)} /></Field>
      </div>

      <Field label="Notes" wide>
        <textarea value={draft.notes} onChange={(e) => field("notes", e.target.value)} rows={4} placeholder="What matters about this opportunity? Interview topics? Contact name?" />
      </Field>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="submit" className="button-primary">{editing ? "Save changes" : "Add opportunity"}</button>
        <button type="button" className="button-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function Field({ label, required = false, wide = false, children }: { label: string; required?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`application-field ${wide ? "mt-4 block" : ""}`}>
      <span>{label}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}

function ApplicationRow({
  item,
  onEdit,
  onRemove,
  onStage,
}: {
  item: ApplicationRecord;
  onEdit: () => void;
  onRemove: () => void;
  onStage: (stage: ApplicationStage) => void;
}) {
  const dueDays = daysUntil(item.dueDate);
  const urgent = dueDays !== null && dueDays <= 2 && activeStages.has(item.stage);
  const closed = closedStages.has(item.stage);

  return (
    <article className={`grid gap-5 py-6 lg:grid-cols-[1.1fr_.55fr_.9fr_auto] lg:items-center ${closed ? "opacity-65" : ""}`}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">{item.role}</h3>
          {urgent && <span className="status-pill status-pill-warning">{dueLabel(item.dueDate)}</span>}
        </div>
        <p className="text-muted mt-1 text-sm">{item.company}{item.location ? ` · ${item.location}` : ""}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--faint)]">
          {item.source && <span>Source: {item.source}</span>}
          {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent)]">Open role ↗</a>}
        </div>
      </div>

      <label className="application-field">
        <span>Stage</span>
        <select value={item.stage} onChange={(event) => onStage(event.target.value as ApplicationStage)}>
          {applicationStages.map((stage) => <option key={stage}>{stage}</option>)}
        </select>
      </label>

      <div>
        <span className="metric-label">Next action</span>
        <p className="text-sm font-medium leading-6">{item.nextAction || "Add a clear next action"}</p>
        <p className={`mt-1 text-xs ${urgent ? "text-[var(--warning)]" : "text-[var(--faint)]"}`}>{dueLabel(item.dueDate)}</p>
      </div>

      <div className="flex gap-2 lg:justify-end">
        <button type="button" className="button-secondary" onClick={onEdit}>Edit</button>
        <button type="button" className="button-quiet" onClick={onRemove}>Delete</button>
      </div>
    </article>
  );
}

function Guideline({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <span className="section-kicker">{title}</span>
      <p className="text-muted mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}
