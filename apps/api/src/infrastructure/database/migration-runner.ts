/**
 * Migraciones: puntos de entrada para arranque del server, CLI (npm run
 * db:migrate) y tests. La autoridad es `runMigrations` (advisory lock + tx).
 */

import { runMigrations } from "./migrate.js";
import type { Database } from "./pool.js";

export async function migrateDatabase(database: Database): Promise<string[]> {
  const result = await runMigrations(database.pool, { direction: "up" });
  return result.applied;
}

export async function rollbackOneMigration(database: Database): Promise<string[]> {
  const result = await runMigrations(database.pool, { direction: "down", step: 1 });
  return result.reverted;
}
