/**
 * Job de agregación y retención (Fase 08): compacta scan_events en
 * scan_aggregates (upsert idempotente por (qr_id, day, device_family)) y purga
 * los eventos crudos más viejos que ANALYTICS_RAW_RETENTION_DAYS. Se arranca
 * desde server.ts cuando ANALYTICS_ENABLED=true; en tests se invoca el ciclo
 * directamente (startTestServer no arranca jobs).
 *
 * Backfill: cada ciclo agrega los días históricos pendientes (dentro de la
 * retención) y SIEMPRE reprocesa hoy (sigue recibiendo eventos). Un día saltado
 * por un ciclo fallido se recupera; la ventana acotada por la retención evita
 * trabajo infinito (hallazgo del revisor de Fase 08).
 */
import type { Pool } from "pg";
import { createAnalyticsRepository } from "./analytics.repository.js";

/** Día de hoy en YYYY-MM-DD UTC (fronteras fijas: el pool usa TZ UTC). */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function runAggregationCycle(input: {
  pool: Pool;
  retentionDays: number;
}): Promise<void> {
  const repo = createAnalyticsRepository(input.pool);
  // Días históricos sin agregar (NOT EXISTS) hasta ayer; hoy siempre se
  // reprocesa (upsert): los eventos tardíos del día no se pierden.
  const missing = await repo.missingHistoricalDays(input.pool, input.retentionDays);
  for (const day of missing) {
    await repo.upsertDaily(input.pool, day);
  }
  await repo.upsertDaily(input.pool, todayKey());
  await repo.purgeEvents(input.pool, input.retentionDays);
}

export function startAggregationJob(input: {
  pool: Pool;
  intervalMs: number;
  retentionDays: number;
}): { stop: () => void } {
  let timer: NodeJS.Timeout | undefined;
  const run = (): void => {
    void runAggregationCycle({ pool: input.pool, retentionDays: input.retentionDays }).catch(
      (error: unknown) => {
        // Un ciclo fallido no detiene el proceso; se reintenta en el siguiente.
        console.warn("[analytics] ciclo de agregación falló", error);
      },
    );
  };
  // Primer ciclo al arranque (sin esperar al intervalo) + intervalo periódico.
  run();
  timer = setInterval(run, input.intervalMs);
  timer.unref();
  return {
    stop: () => {
      if (timer !== undefined) {
        clearInterval(timer);
      }
    },
  };
}
