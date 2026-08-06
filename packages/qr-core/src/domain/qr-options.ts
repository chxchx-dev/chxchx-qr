/** Tipos de dominio de las opciones de renderizado. */
import { QR_OPTIONS_DEFAULTS, type QrRenderOptions } from "@acore/contracts";

export type { QrRenderOptions };

export type QrFormat = "svg" | "gif" | "png";
export type EccLevel = "low" | "medium" | "quartile" | "high";
export type QrDensity = "safe" | "dense" | "critical" | "overflow";

/** Opciones por defecto del producto (fuente: contracts). */
export const DEFAULT_QR_OPTIONS: QrRenderOptions = { ...QR_OPTIONS_DEFAULTS };
