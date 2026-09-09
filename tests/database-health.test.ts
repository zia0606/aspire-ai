import { describe, expect, it, vi } from "vitest";
import {
  inspectDatabaseHealth,
  REQUIRED_DATABASE_TABLES,
} from "../app/_lib/server/database-health";

describe("database health inspection", () => {
  it("reports healthy only when Neon responds and every required table exists", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ ok: 1 }] })
      .mockResolvedValueOnce({
        rows: REQUIRED_DATABASE_TABLES.map((table_name) => ({ table_name })),
      });

    const health = await inspectDatabaseHealth({ query } as never);

    expect(health.connected).toBe(true);
    expect(health.requiredTablesReady).toBe(true);
    expect(health.missingTables).toEqual([]);
  });

  it("names missing tables instead of treating configuration as database health", async () => {
    const existing = REQUIRED_DATABASE_TABLES.filter((table) => table !== "aspire_profiles");
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ ok: 1 }] })
      .mockResolvedValueOnce({ rows: existing.map((table_name) => ({ table_name })) });

    const health = await inspectDatabaseHealth({ query } as never);

    expect(health.connected).toBe(true);
    expect(health.requiredTablesReady).toBe(false);
    expect(health.missingTables).toContain("aspire_profiles");
  });

  it("distinguishes an unreachable database from missing configuration", async () => {
    const query = vi.fn().mockRejectedValue(new Error("connection failed"));
    const unreachable = await inspectDatabaseHealth({ query } as never);
    const unconfigured = await inspectDatabaseHealth(null);

    expect(unreachable.configured).toBe(true);
    expect(unreachable.connected).toBe(false);
    expect(unconfigured.configured).toBe(false);
    expect(unconfigured.connected).toBe(false);
  });
});
