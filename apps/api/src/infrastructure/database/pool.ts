/**
 * Pool de PostgreSQL (Fase 06, ADR-004/006). `pg` con SQL explícito; el pool
 * solo se crea cuando la config lo requiere (DYNAMIC_QR_ENABLED=true).
 */
import type { ApiConfig } from "@acore/config";
import { Pool } from "pg";

export interface Database {
  pool: Pool;
  close: () => Promise<void>;
}

export function createDatabase(config: ApiConfig): Database {
  if (config.DATABASE_URL === undefined || config.DATABASE_URL === "") {
    throw new Error("DATABASE_URL es obligatoria para crear el pool");
  }
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    min: config.DATABASE_POOL_MIN,
    max: config.DATABASE_POOL_MAX,
    ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
    statement_timeout: config.DATABASE_STATEMENT_TIMEOUT_MS,
    // TZ de sesión fijo a UTC: los buckets diarios de analítica y el etiquetado
    // horario (to_char) dependen de este valor; sin fijarlo serían relativos al
    // timezone del servidor PG (hallazgo del revisor de Fase 08).
    options: "-c timezone=UTC",
  });
  pool.on("error", (error) => {
    // Sin handler el proceso moriría por errores de pool en reposo.
    console.error("[db] error del pool de PostgreSQL", error.message);
  });
  return { pool, close: () => pool.end() };
}

/** Comprueba conectividad (health/ready). */
export async function checkDatabase(pool: Pool): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
