/** Tipos del generador: estado del formulario, opciones y acciones del reducer. */
import type { QrRenderOptions } from "@acore/contracts";

export type QrContentType =
  | "text"
  | "url"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "vcard"
  | "calendar"
  | "geo"
  | "file";

export const CONTENT_TYPES: readonly QrContentType[] = [
  "text",
  "url",
  "email",
  "phone",
  "sms",
  "wifi",
  "vcard",
  "calendar",
  "geo",
  "file",
] as const;

/** Valores del formulario por tipo (números como string; solo en memoria). */
export type DraftValue = string | boolean | undefined;
export type ContentDraft = Record<string, DraftValue>;

export interface GeneratorState {
  contentType: QrContentType;
  /** Datos por tipo, solo durante la sesión (nunca en localStorage, en especial WiFi). */
  drafts: Partial<Record<QrContentType, ContentDraft>>;
  options: QrRenderOptions;
}

export type GeneratorAction =
  | { type: "SELECT_TYPE"; contentType: QrContentType }
  | { type: "UPDATE_DRAFT"; field: string; value: DraftValue }
  | { type: "RESET_DRAFT" }
  | { type: "UPDATE_OPTIONS"; options: Partial<QrRenderOptions> }
  | { type: "RESET_OPTIONS" };
