/** Tipos de dominio del contenido QR (DTO validado vive en @chxchx/contracts). */
import type { QrContent } from "@chxchx/contracts";

export type { QrContent };

/** Un payload canónico es siempre una única string. */
export type CanonicalPayload = string;

export type ContentWarning = string;

export interface BuildPayloadResult {
  payload: CanonicalPayload;
  warnings: ContentWarning[];
}
