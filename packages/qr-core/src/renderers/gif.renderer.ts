/**
 * Renderer GIF: generado directamente por `qr` para compatibilidad simple
 * (fase 02). No soporta colores personalizados; si se piden, `validate` emite
 * una advertencia.
 */
import type { EccLevel } from "../domain/qr-options.js";
import { encodeMatrix, renderGifBytes } from "./qr-encoder.adapter.js";

/** Tope de escala: evita GIFs descomprimidos de decenas de MB (sin rate limit aún). */
const MAX_GIF_SCALE = 32;

export interface GifRenderOptions {
  ecc: EccLevel;
  marginModules: number;
  size: number;
}

export function renderGif(payload: string, options: GifRenderOptions): Uint8Array {
  const matrix = encodeMatrix(payload, options.ecc);
  const border = Math.max(1, options.marginModules);
  const totalModules = matrix.moduleCount + border * 2;
  const scale = Math.min(MAX_GIF_SCALE, Math.max(1, Math.floor(options.size / totalModules)));
  return renderGifBytes(payload, options.ecc, border, scale);
}
