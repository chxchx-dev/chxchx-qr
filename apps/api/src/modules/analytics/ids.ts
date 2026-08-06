/** Helpers de ids opacos del módulo de analítica (docs/06 §2). */
import { randomUUID } from "node:crypto";

/** Id externo de evento de escaneo (scn_<uuid>); nunca una secuencia. */
export function newScanEventId(): string {
  return `scn_${randomUUID()}`;
}

/** Id externo de reporte de abuso (rep_<uuid>). */
export function newAbuseReportId(): string {
  return `rep_${randomUUID()}`;
}
