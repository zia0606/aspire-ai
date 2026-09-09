import type { Pool } from "pg";

export const REQUIRED_DATABASE_TABLES = [
  "user",
  "session",
  "account",
  "verification",
  "aspire_profiles",
  "aspire_roadmap_progress",
  "aspire_resume_analyses",
  "aspire_application_boards",
  "aspire_portfolio_boards",
  "aspire_interview_boards",
] as const;

export type DatabaseHealth = {
  configured: boolean;
  connected: boolean;
  requiredTablesReady: boolean;
  missingTables: string[];
  latencyMs: number | null;
};

export async function inspectDatabaseHealth(
  database: Pick<Pool, "query"> | null,
): Promise<DatabaseHealth> {
  if (!database) {
    return {
      configured: false,
      connected: false,
      requiredTablesReady: false,
      missingTables: [...REQUIRED_DATABASE_TABLES],
      latencyMs: null,
    };
  }

  const startedAt = Date.now();
  try {
    await database.query("select 1 as ok");
    const result = await database.query<{ table_name: string }>(
      `select table_name
       from information_schema.tables
       where table_schema = 'public'
         and table_name = any($1::text[])`,
      [[...REQUIRED_DATABASE_TABLES]],
    );
    const existing = new Set(result.rows.map((row) => row.table_name));
    const missingTables = REQUIRED_DATABASE_TABLES.filter((table) => !existing.has(table));

    return {
      configured: true,
      connected: true,
      requiredTablesReady: missingTables.length === 0,
      missingTables,
      latencyMs: Date.now() - startedAt,
    };
  } catch {
    return {
      configured: true,
      connected: false,
      requiredTablesReady: false,
      missingTables: [],
      latencyMs: Date.now() - startedAt,
    };
  }
}
