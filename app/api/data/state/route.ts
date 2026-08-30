import { getAuth } from "../../../_lib/server/auth";
import { getDatabasePool } from "../../../_lib/server/database";
import { isProfileV2 } from "../../../_lib/profile-validation";

type SaveRequest =
  | { type: "profile"; profile: unknown }
  | { type: "roadmap"; career: unknown; completed: unknown }
  | { type: "resume"; result: unknown }
  | { type: "applications"; applications: unknown };

const stages = new Set(["Saved", "Applied", "Interview", "Offer", "Rejected", "Withdrawn"]);

function isApplication(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" && item.id.length <= 120 &&
    typeof item.company === "string" && item.company.length <= 200 &&
    typeof item.role === "string" && item.role.length <= 200 &&
    typeof item.stage === "string" && stages.has(item.stage) &&
    typeof item.location === "string" && item.location.length <= 200 &&
    typeof item.url === "string" && item.url.length <= 1200 &&
    typeof item.source === "string" && item.source.length <= 200 &&
    typeof item.nextAction === "string" && item.nextAction.length <= 500 &&
    typeof item.dueDate === "string" && item.dueDate.length <= 40 &&
    typeof item.notes === "string" && item.notes.length <= 5000 &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

async function getUserId(request: Request) {
  const auth = getAuth();
  if (!auth) return null;
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

export async function GET(request: Request) {
  const database = getDatabasePool();
  const auth = getAuth();

  if (!database || !auth) {
    return Response.json({ mode: "local", signedIn: false });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return Response.json({ mode: "guest", signedIn: false });
  }

  const [profileResult, roadmapResult, resumeResult, applicationsResult] = await Promise.all([
    database.query(
      "select profile, updated_at from aspire_profiles where user_id = $1 limit 1",
      [userId],
    ),
    database.query(
      "select career, completed, updated_at from aspire_roadmap_progress where user_id = $1 order by updated_at desc",
      [userId],
    ),
    database.query(
      "select id, target_career, resume_score, result, created_at from aspire_resume_analyses where user_id = $1 order by created_at desc limit 10",
      [userId],
    ),
    database.query(
      "select applications, updated_at from aspire_application_boards where user_id = $1 limit 1",
      [userId],
    ),
  ]);

  return Response.json({
    mode: "cloud",
    signedIn: true,
    profile: profileResult.rows[0]?.profile ?? null,
    roadmaps: roadmapResult.rows.map((row) => ({
      career: row.career,
      completed: row.completed,
      updatedAt: row.updated_at,
    })),
    resumeAnalyses: resumeResult.rows.map((row) => ({
      id: row.id,
      targetCareer: row.target_career,
      resumeScore: row.resume_score,
      result: row.result,
      createdAt: row.created_at,
    })),
    applications: applicationsResult.rows[0]?.applications ?? [],
  });
}

export async function POST(request: Request) {
  const database = getDatabasePool();
  const auth = getAuth();

  if (!database || !auth) {
    return Response.json({ saved: false, mode: "local" });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return Response.json({ saved: false, mode: "guest" }, { status: 401 });
  }

  let body: SaveRequest;
  try {
    body = (await request.json()) as SaveRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.type === "profile") {
    if (!isProfileV2(body.profile)) {
      return Response.json({ error: "Invalid Aspire profile." }, { status: 400 });
    }

    await database.query(
      `insert into aspire_profiles (user_id, profile, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (user_id)
       do update set profile = excluded.profile, updated_at = now()`,
      [userId, JSON.stringify(body.profile)],
    );

    return Response.json({ saved: true, type: "profile" });
  }

  if (body.type === "roadmap") {
    if (typeof body.career !== "string" || !body.career.trim() || body.career.length > 160) {
      return Response.json({ error: "Invalid career." }, { status: 400 });
    }

    if (!Array.isArray(body.completed)) {
      return Response.json({ error: "Invalid roadmap progress." }, { status: 400 });
    }

    const completed = body.completed.filter(
      (item): item is number => Number.isInteger(item) && item >= 0 && item < 100,
    );

    await database.query(
      `insert into aspire_roadmap_progress (user_id, career, completed, updated_at)
       values ($1, $2, $3::jsonb, now())
       on conflict (user_id, career)
       do update set completed = excluded.completed, updated_at = now()`,
      [userId, body.career, JSON.stringify(completed)],
    );

    return Response.json({ saved: true, type: "roadmap" });
  }

  if (body.type === "resume") {
    if (!body.result || typeof body.result !== "object") {
      return Response.json({ error: "Invalid resume result." }, { status: 400 });
    }

    const result = body.result as Record<string, unknown>;
    const targetCareer = typeof result.targetCareer === "string" ? result.targetCareer : "Unknown";
    const resumeScore = typeof result.resumeScore === "number" && Number.isFinite(result.resumeScore)
      ? Math.max(0, Math.min(100, Math.round(result.resumeScore)))
      : 0;
    const id = crypto.randomUUID();

    await database.query(
      `insert into aspire_resume_analyses (id, user_id, target_career, resume_score, result, created_at)
       values ($1, $2, $3, $4, $5::jsonb, now())`,
      [id, userId, targetCareer, resumeScore, JSON.stringify(result)],
    );

    return Response.json({ saved: true, type: "resume", id });
  }

  if (body.type === "applications") {
    if (!Array.isArray(body.applications) || body.applications.length > 250 || !body.applications.every(isApplication)) {
      return Response.json({ error: "Invalid applications board." }, { status: 400 });
    }

    await database.query(
      `insert into aspire_application_boards (user_id, applications, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (user_id)
       do update set applications = excluded.applications, updated_at = now()`,
      [userId, JSON.stringify(body.applications)],
    );

    return Response.json({ saved: true, type: "applications" });
  }

  return Response.json({ error: "Unsupported save type." }, { status: 400 });
}
