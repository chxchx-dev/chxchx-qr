/**
 * Módulo de analítica (Fase 08): construye el servicio (lecturas del endpoint)
 * y el recorder (escritura no-bloqueante desde el redirect). Solo se crea si
 * ANALYTICS_ENABLED=true (el HMAC es obligatorio entonces, fallo temprano).
 */
import type { ApiConfig } from "@acore/config";
import type { Database } from "../../infrastructure/database/pool.js";
import { type AnalyticsService, createAnalyticsService } from "./analytics.service.js";
import { createScanRecorder, type ScanRecorder } from "./scan-event.js";

export interface AnalyticsModule {
  service: AnalyticsService;
  recorder: ScanRecorder;
}

export function createAnalyticsModule(config: ApiConfig, database: Database): AnalyticsModule {
  const secret = config.ANALYTICS_HMAC_SECRET_CURRENT;
  if (secret === undefined || secret === "") {
    // Fallo temprano: la config ya lo exige; aquí por seguridad.
    throw new Error("ANALYTICS_HMAC_SECRET_CURRENT es obligatoria con ANALYTICS_ENABLED=true");
  }
  return {
    service: createAnalyticsService({ pool: database.pool }),
    recorder: createScanRecorder({ pool: database.pool, hmacSecret: secret }),
  };
}
