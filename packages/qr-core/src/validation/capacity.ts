/** Validación de capacidad y clasificación de densidad (04 §15). */
import { QrPayloadTooLargeError } from "../domain/qr-errors.js";
import type { QrDensity } from "../domain/qr-options.js";

export const QR_VERSION_MIN = 1;
export const QR_VERSION_MAX = 40;

/** Cota teórica absoluta del estándar (modo numérico, versión 40): 7089 dígitos. */
export const QR_ABSOLUTE_MAX_CHARS = 7089;

/**
 * Clasifica la densidad a partir de la versión de la matriz.
 * safe: v1-9 · dense: v10-19 · critical: v20-40 · overflow se rechaza antes.
 */
export function classifyDensity(version: number): QrDensity {
  if (version >= 20) {
    return "critical";
  }
  if (version >= 10) {
    return "dense";
  }
  return "safe";
}

export function densityRecommendations(density: QrDensity): string[] {
  switch (density) {
    case "dense":
      return ["Contenido denso: considera un tamaño mayor o más margen para facilitar el escaneo."];
    case "critical":
      return ["Contenido muy denso: evita la personalización agresiva o usa un enlace más corto."];
    case "overflow":
      return ["El contenido excede la capacidad: usa un enlace en lugar de incrustarlo."];
    case "safe":
      return [];
  }
}

/** Rechazo temprano antes de codificar cuando es matemáticamente imposible. */
export function assertWithinAbsoluteCapacity(payload: string): void {
  if (payload.length > QR_ABSOLUTE_MAX_CHARS) {
    throw new QrPayloadTooLargeError(
      "El contenido excede la capacidad del código QR: usa un enlace en lugar de incrustarlo.",
    );
  }
}
