/**
 * Contraste de color (04 §16): foreground debe ser más oscuro que background y
 * el ratio mínimo es 4.5:1 (regla conservadora de UI).
 */
import { QrContrastTooLowError, QrInvertedColorsError } from "../domain/qr-errors.js";

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export const MIN_CONTRAST_RATIO = 4.5;

/** Parsea #RGB o #RRGGBB (el esquema ya garantiza el formato). */
export function parseHexColor(hex: string): RgbColor {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  if (normalized.length === 3) {
    return {
      r: parseInt(normalized.slice(0, 1) + normalized.slice(0, 1), 16),
      g: parseInt(normalized.slice(1, 2) + normalized.slice(1, 2), 16),
      b: parseInt(normalized.slice(2, 3) + normalized.slice(2, 3), 16),
    };
  }
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function linearize(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa WCAG. */
export function relativeLuminance(color: RgbColor): number {
  return 0.2126 * linearize(color.r) + 0.7152 * linearize(color.g) + 0.0722 * linearize(color.b);
}

/** Ratio de contraste WCAG entre dos colores. */
export function contrastRatio(foreground: RgbColor, background: RgbColor): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Valida la combinación de colores. Lanza errores de dominio con códigos
 * estables (parte del contrato).
 */
export function assertValidContrast(foreground: string, background: string): void {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (relativeLuminance(fg) >= relativeLuminance(bg)) {
    throw new QrInvertedColorsError(
      "El color principal debe ser más oscuro que el fondo (combinaciones invertidas bloqueadas en esta versión).",
    );
  }
  const ratio = contrastRatio(fg, bg);
  if (ratio < MIN_CONTRAST_RATIO) {
    throw new QrContrastTooLowError(
      `El contraste entre colores es insuficiente: ${ratio.toFixed(2)}:1 (mínimo ${MIN_CONTRAST_RATIO}:1).`,
    );
  }
}
