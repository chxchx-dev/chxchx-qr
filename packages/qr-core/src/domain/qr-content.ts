/** Tipos de dominio del contenido QR (DTO validado vive en @acore/contracts). */
import type { QrContent } from "@acore/contracts";

export type { QrContent };

/** Un payload canónico es siempre una única string. */
export type CanonicalPayload = string;

export type ContentWarning = string;

export interface BuildPayloadResult {
  payload: CanonicalPayload;
  warnings: ContentWarning[];
}
