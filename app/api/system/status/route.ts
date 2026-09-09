import { isAuthConfigured } from "../../../_lib/server/auth";
import { getDatabasePool, isDatabaseConfigured } from "../../../_lib/server/database";
import { inspectDatabaseHealth } from "../../../_lib/server/database-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = isDatabaseConfigured();
  const authConfigured = isAuthConfigured();
  const health = await inspectDatabaseHealth(getDatabasePool());
  const cloudReady = Boolean(
    databaseConfigured &&
    authConfigured &&
    health.connected &&
    health.requiredTablesReady,
  );

  return Response.json(
    {
      databaseConfigured,
      authConfigured,
      databaseConnected: health.connected,
      requiredTablesReady: health.requiredTablesReady,
      missingTables: health.missingTables,
      databaseLatencyMs: health.latencyMs,
      cloudReady,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
