/** Tipos de resultado del motor QR. */
import type { QrDensity, QrFormat } from "./qr-options.js";

/** Matriz de módulos puros (sin zona silenciosa). */
export interface QrMatrix {
  modules: boolean[][];
  moduleCount: number;
  /** Versión QR 1..40, derivada de moduleCount = 17 + 4*version. */
  version: number;
}

export interface QrValidationResult {
  valid: true;
  canonicalPayload: string;
  density: QrDensity;
  warnings: string[];
  recommendations: string[];
}

export interface QrRenderResult {
  body: string | Uint8Array;
  contentType: "image/svg+xml" | "image/gif" | "image/png";
  filename: string;
  format: QrFormat;
}
