/**
 * CLI de migraciones: `npm run db:migrate -w apps/api` (up) o
 * `npm run db:migrate:down` (revierte la última). Usa la misma config/env.
 */
import { apiConfig } from "@acore/config";
import { runMigrations } from "./migrate.js";
import { createDatabase } from "./pool.js";

const direction = process.argv[2] === "down" ? "down" : "up";
const config = apiConfig(process.env);
const database = createDatabase(config);

try {
  const result = await runMigrations(
    database.pool,
    direction === "down" ? { direction: "down", step: 1 } : { direction: "up" },
  );
  if (result.applied.length > 0) {
    console.log(`[db:migrate] aplicadas: ${result.applied.join(", ")}`);
  } else if (result.reverted.length > 0) {
    console.log(`[db:migrate] revertida: ${result.reverted.join(", ")}`);
  } else {
    console.log("[db:migrate] sin cambios");
  }
} finally {
  await database.close();
}
