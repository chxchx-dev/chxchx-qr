/**
 * Adaptador sobre el paquete `qr` (ADR-002). Este es el ÚNICO archivo del
 * monorepo que importa el encoder `qr`; el resto del código usa los tipos y
 * funciones de `@chxchx/qr-core`.
 *
 * - encodeMatrix: matriz de módulos puros (sin zona silenciosa).
 * - renderGifBytes: GIF87a directo del encoder.
 * - decodeMatrix / decodeRgbImage: verificación de lectura con `jsqr`.
 */

import jsQR from "jsqr";
import encodeQR from "qr";
import { QrPayloadTooLargeError } from "../domain/qr-errors.js";
import type { EccLevel } from "../domain/qr-options.js";
import type { QrMatrix } from "../domain/qr-result.js";

type JsQrFn = (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;

/**
 * jsQR es UMD/CJS: en runtime el default import ES la función (Node lo
 * resuelve vía `__esModule`), pero su .d.ts lo declara como export default
 * y TypeScript lo ve como el namespace. Se normaliza explícitamente.
 */
const jsQRDecode: JsQrFn = (
  typeof jsQR === "function" ? jsQR : (jsQR as { default: unknown }).default
) as JsQrFn;

/** Borde mínimo exigido por el encoder (0 es inválido); se recorta tras codificar. */
const ENCODER_BORDER = 1;
/** Zona silenciosa añadida al decodificar (los escáneres reales la requieren). */
const DECODE_QUIET_ZONE = 4;
/** Escala de píxeles por módulo para la imagen de decodificación. */
const DECODE_SCALE = 8;

function isCapacityError(error: Error): boolean {
  return /capacity overflow|too (large|long)/i.test(error.message);
}

function stripBorder(modules: boolean[][], border: number): boolean[][] {
  return modules.slice(border, -border).map((row) => row.slice(border, -border));
}

/** Codifica a matriz de módulos puros. Lanza QrPayloadTooLargeError si desborda. */
export function encodeMatrix(payload: string, ecc: EccLevel): QrMatrix {
  let modules: boolean[][];
  try {
    modules = encodeQR(payload, "raw", { ecc, border: ENCODER_BORDER });
  } catch (error) {
    if (error instanceof Error && isCapacityError(error)) {
      throw new QrPayloadTooLargeError(
        "El contenido excede la capacidad del código QR: usa un enlace en lugar de incrustarlo.",
      );
    }
    throw error;
  }
  const pure = stripBorder(modules, ENCODER_BORDER);
  const moduleCount = pure.length;
  const version = (moduleCount - 17) / 4;
  return { modules: pure, moduleCount, version };
}

/** GIF sin comprimir (GIF87a) generado directamente por `qr`. */
export function renderGifBytes(
  payload: string,
  ecc: EccLevel,
  border: number,
  scale: number,
): Uint8Array {
  try {
    return encodeQR(payload, "gif", { ecc, border: Math.max(1, border), scale });
  } catch (error) {
    if (error instanceof Error && isCapacityError(error)) {
      throw new QrPayloadTooLargeError(
        "El contenido excede la capacidad del código QR: usa un enlace en lugar de incrustarlo.",
      );
    }
    throw error;
  }
}

export interface RgbImage {
  width: number;
  height: number;
  /** Píxeles RGB (3 bytes por píxel). */
  data: Uint8Array;
}

/**
 * Matriz pura → imagen RGB con zona silenciosa y escala para decodificación.
 */
export function renderMatrixRgb(
  matrix: QrMatrix,
  options: { quietZone?: number; scale?: number } = {},
): RgbImage {
  const { modules, moduleCount } = matrix;
  const quiet = options.quietZone ?? DECODE_QUIET_ZONE;
  const scale = options.scale ?? DECODE_SCALE;
  const total = moduleCount + quiet * 2;
  const size = total * scale;
  const data = new Uint8Array(size * size * 3);
  for (let y = 0; y < total; y += 1) {
    for (let x = 0; x < total; x += 1) {
      const my = y - quiet;
      const mx = x - quiet;
      const dark =
        my >= 0 && mx >= 0 && my < moduleCount && mx < moduleCount && modules[my]?.[mx] === true;
      const value = dark ? 0 : 255;
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          const index = ((y * scale + dy) * size + (x * scale + dx)) * 3;
          data[index] = value;
          data[index + 1] = value;
          data[index + 2] = value;
        }
      }
    }
  }
  return { width: size, height: size, data };
}

/**
 * Decodifica una imagen con jsQR. Acepta RGB (3 canales) o RGBA (4 canales,
 * p. ej. el raw de sharp). Lanza si no encuentra un QR legible.
 */
export function decodeRgbImage(image: RgbImage, channels: 3 | 4 = 3): string {
  const rgba = new Uint8ClampedArray(image.width * image.height * 4);
  if (channels === 4) {
    rgba.set(image.data);
  } else {
    for (let p = 0; p < image.width * image.height; p += 1) {
      const s = p * 3;
      const d = p * 4;
      rgba[d] = image.data[s] ?? 0;
      rgba[d + 1] = image.data[s + 1] ?? 0;
      rgba[d + 2] = image.data[s + 2] ?? 0;
      rgba[d + 3] = 255;
    }
  }
  const result = jsQRDecode(rgba, image.width, image.height);
  if (result === null) {
    throw new Error("No se detectó un código QR legible en la imagen.");
  }
  return result.data;
}

/**
 * Decodifica una matriz pura (verificación round-trip). Añade zona silenciosa
 * y escala la imagen como vería un escáner real.
 */
export function decodeMatrix(matrix: QrMatrix): string {
  return decodeRgbImage(renderMatrixRgb(matrix));
}
