/**
 * Runner de migraciones SQL (ADR-006): archivos `NNNN_name.sql` (up) y
 * `NNNN_name.down.sql` (down opcional). Cada migración se aplica en su propia
 * transacción y se registra en `schema_migrations`. Un `pg_advisory_lock`
 * impide que dos procesos apliquen migraciones a la vez (arranque concurrente).
 */
import { promises as fs } from "node:fs";
import type { Pool, PoolClient } from "pg";

/** Fijo, arbitrario: identifica el lock de migraciones de acore-qr. */
const MIGRATION_LOCK_ID = 84_320_007;

export interface Migration {
  version: number;
  name: string;
  up: string;
  down: string | undefined;
}

const MIGRATIONS_URL = new URL("./migrations/", import.meta.url);

export async function loadMigrations(): Promise<Migration[]> {
  const files = await fs.readdir(MIGRATIONS_URL);
  // Solo los archivos NNNN_name.sql (los .down.sql son el `down` de cada una).
  const upFiles = files
    .filter((file) => /^\d{4}_.+\.sql$/.test(file) && !file.endsWith(".down.sql"))
    .sort();
  const migrations: Migration[] = [];
  for (const file of upFiles) {
    const version = Number.parseInt(file.slice(0, 4), 10);
    const name = file.slice(5, -4);
    const downFile = file.replace(/\.sql$/, ".down.sql");
    const [up, down] = await Promise.all([
      fs.readFile(new URL(file, MIGRATIONS_URL), "utf8"),
      fs.readFile(new URL(downFile, MIGRATIONS_URL), "utf8").catch(() => undefined),
    ]);
    migrations.push({ version, name, up, down });
  }
  return migrations;
}

async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version integer PRIMARY KEY,
      name text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function appliedVersions(client: PoolClient): Promise<Set<number>> {
  const result = await client.query<{ version: number }>("SELECT version FROM schema_migrations");
  return new Set(result.rows.map((row) => row.version));
}

async function applyUp(client: PoolClient, migration: Migration): Promise<void> {
  await client.query("BEGIN");
  try {
    await client.query(migration.up);
    await client.query("INSERT INTO schema_migrations (version, name) VALUES ($1, $2)", [
      migration.version,
      migration.name,
    ]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function applyDown(client: PoolClient, migration: Migration): Promise<void> {
  if (migration.down === undefined) {
    throw new Error(`La migración ${migration.version} (${migration.name}) no tiene down definido`);
  }
  await client.query("BEGIN");
  try {
    await client.query(migration.down);
    await client.query("DELETE FROM schema_migrations WHERE version = $1", [migration.version]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

/** Etiqueta estable del migration, p. ej. "0003_create_audit_events". */
function label(migration: Migration): string {
  return `${String(migration.version).padStart(4, "0")}_${migration.name}`;
}

export interface MigrationResult {
  applied: string[];
  reverted: string[];
}

/**
 * Aplica (up) o revierte (down) migraciones. `step` solo aplica al down
 * (cuántas versiones revertir; por defecto 1). Devuelve lo ejecutado.
 */
export async function runMigrations(
  pool: Pool,
  options: { direction?: "up" | "down"; step?: number } = {},
): Promise<MigrationResult> {
  const direction = options.direction ?? "up";
  const step = options.step ?? 1;
  const client = await pool.connect();
  const applied: string[] = [];
  const reverted: string[] = [];
  try {
    await client.query("SELECT pg_advisory_lock($1::bigint)", [MIGRATION_LOCK_ID]);
    await ensureMigrationsTable(client);
    const migrations = await loadMigrations();
    const already = await appliedVersions(client);

    if (direction === "up") {
      for (const migration of migrations) {
        if (already.has(migration.version)) {
          continue;
        }
        await applyUp(client, migration);
        applied.push(label(migration));
      }
    } else {
      const toRevert = [...migrations]
        .filter((migration) => already.has(migration.version))
        .sort((a, b) => b.version - a.version)
        .slice(0, Math.max(0, step));
      for (const migration of toRevert) {
        await applyDown(client, migration);
        reverted.push(label(migration));
      }
    }
    return { applied, reverted };
  } finally {
    await client
      .query("SELECT pg_advisory_unlock($1::bigint)", [MIGRATION_LOCK_ID])
      .catch(() => undefined);
    client.release();
  }
}
