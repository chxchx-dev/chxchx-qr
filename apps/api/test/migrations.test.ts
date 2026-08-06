/**
 * Tests de migraciones (Fase 06, criterio "migraciones reproducibles"):
 * up sobre DB vacía, down reversible y re-up idempotente. Usa una DB propia
 * para no interferir con los otros suites.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runMigrations } from "../src/infrastructure/database/migrate.js";
import type { Database } from "../src/infrastructure/database/pool.js";
import { ensureTestDb, testDatabaseUrl } from "./db-helpers.js";

const SUITE_DB = testDatabaseUrl("migrations");

let database: Database;

beforeAll(async () => {
  database = await ensureTestDb(SUITE_DB);
});

afterAll(async () => {
  await database.close();
});

async function tableExists(name: string): Promise<boolean> {
  const result = await database.pool.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
    [name],
  );
  return (result.rowCount ?? 0) > 0;
}

async function migrationVersion(name: string): Promise<number | undefined> {
  const result = await database.pool.query<{ version: number }>(
    "SELECT version FROM schema_migrations WHERE name = $1",
    [name],
  );
  return result.rows[0]?.version;
}

/** Nombres sin prefijo NNNN_ (así se guardan en schema_migrations). */
const MIGRATION_NAMES = [
  "create_dynamic_qrs",
  "create_idempotency_keys",
  "create_audit_events",
  "create_users",
  "create_sessions",
  "assign_dynamic_qr_owner",
  "create_scan_events",
  "create_scan_aggregates",
  "create_abuse_reports",
  "create_admin_roles",
] as const;

describe("migraciones (up/down)", () => {
  it("aplica las 10 migraciones sobre la DB (runner de producción)", async () => {
    for (const name of MIGRATION_NAMES) {
      const version = await migrationVersion(name);
      expect(version, `migración ${name} aplicada`).toBeDefined();
    }
    expect(await tableExists("dynamic_qrs")).toBe(true);
    expect(await tableExists("idempotency_keys")).toBe(true);
    expect(await tableExists("audit_events")).toBe(true);
    expect(await tableExists("users")).toBe(true);
    expect(await tableExists("sessions")).toBe(true);
    expect(await tableExists("scan_events")).toBe(true);
    expect(await tableExists("scan_aggregates")).toBe(true);
    expect(await tableExists("abuse_reports")).toBe(true);
    expect(await tableExists("admin_roles")).toBe(true);
    expect(await tableExists("schema_migrations")).toBe(true);
  });

  it("re-up es idempotente (no reintenta migraciones ya aplicadas)", async () => {
    const result = await runMigrations(database.pool, { direction: "up" });
    expect(result.applied).toEqual([]);
  });

  it("down revierte la última migración y up la vuelve a aplicar", async () => {
    const down = await runMigrations(database.pool, { direction: "down", step: 1 });
    expect(down.reverted).toEqual(["0010_create_admin_roles"]);
    // La 0010 es reversible; las anteriores permanecen.
    expect(await tableExists("admin_roles")).toBe(false);
    expect(await tableExists("scan_events")).toBe(true);
    expect(await tableExists("users")).toBe(true);

    const up = await runMigrations(database.pool, { direction: "up" });
    expect(up.applied).toEqual(["0010_create_admin_roles"]);
    expect(await tableExists("admin_roles")).toBe(true);
  });
});
