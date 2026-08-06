/**
 * Política de logos (docs/07 §10 y Fase 04): solo PNG/JPEG/WebP por firma
 * mágica, máx. 2 MB, máx. 1024×1024. Los límites se aplican SIEMPRE en el
 * servidor; el navegador solo informa. Nunca se confía en la extensión ni en
 * el MIME declarado.
 */
import { LOGO_LIMITS } from "@acore/contracts";
import { QrLogoInvalidError, QrLogoTooLargeError } from "../domain/qr-errors.js";

export type DetectedImageFormat = "png" | "jpeg" | "webp";

/** Firma mágica: PNG (8 bytes), JPEG (FF D8 FF), WebP (RIFF....WEBP). */
export function detectImageFormat(bytes: Uint8Array): DetectedImageFormat | null {
  const head = (index: number): number | undefined => bytes[index];
  if (
    bytes.length >= 8 &&
    head(0) === 0x89 &&
    head(1) === 0x50 &&
    head(2) === 0x4e &&
    head(3) === 0x47 &&
    head(4) === 0x0d &&
    head(5) === 0x0a &&
    head(6) === 0x1a &&
    head(7) === 0x0a
  ) {
    return "png";
  }
  if (bytes.length >= 3 && head(0) === 0xff && head(1) === 0xd8 && head(2) === 0xff) {
    return "jpeg";
  }
  if (bytes.length >= 12) {
    const text = (index: number): string | undefined =>
      bytes[index] === undefined ? undefined : String.fromCharCode(bytes[index]);
    if (text(0) === "R" && text(1) === "I" && text(2) === "F" && text(3) === "F") {
      if (text(8) === "W" && text(9) === "E" && text(10) === "B" && text(11) === "P") {
        return "webp";
      }
    }
  }
  return null;
}

export interface LogoPolicyLimits {
  maxBytes: number;
  maxDimension: number;
  maxAreaFraction: number;
}

export const DEFAULT_LOGO_POLICY: LogoPolicyLimits = {
  maxBytes: LOGO_LIMITS.maxBytes,
  maxDimension: LOGO_LIMITS.maxDimension,
  maxAreaFraction: LOGO_LIMITS.maxAreaFraction,
};

export interface LogoCheckInput {
  bytes: Uint8Array;
  /** Dimensiones ya decodificadas (las obtiene sharp en la API). */
  width: number;
  height: number;
  policy?: Pick<LogoPolicyLimits, "maxBytes" | "maxDimension">;
}

/**
 * Valida un logo de entrada. Lanza:
 * - QrLogoInvalidError si el tipo no está permitido o no es una imagen;
 * - QrLogoTooLargeError si excede bytes o dimensiones.
 */
export function assertLogoAllowed(input: LogoCheckInput): void {
  const policy = input.policy ?? DEFAULT_LOGO_POLICY;
  const format = detectImageFormat(input.bytes);
  if (format === null) {
    throw new QrLogoInvalidError(
      "El archivo no es una imagen PNG, JPEG o WebP válida. Los SVG no están permitidos.",
    );
  }
  if (input.bytes.length > policy.maxBytes) {
    throw new QrLogoTooLargeError(
      `El logo supera el tamaño máximo de ${Math.round(policy.maxBytes / (1024 * 1024))} MB.`,
    );
  }
  if (input.width > policy.maxDimension || input.height > policy.maxDimension) {
    throw new QrLogoTooLargeError(
      `El logo supera la dimensión máxima de ${policy.maxDimension}×${policy.maxDimension} px.`,
    );
  }
}
