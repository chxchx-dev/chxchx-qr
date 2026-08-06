/** Matriz en bruto (2D de booleanos) para canvas, vista previa o avanzado. */
import type { EccLevel } from "../domain/qr-options.js";
import { encodeMatrix } from "./qr-encoder.adapter.js";

export function renderRaw(payload: string, ecc: EccLevel): boolean[][] {
  return encodeMatrix(payload, ecc).modules;
}
