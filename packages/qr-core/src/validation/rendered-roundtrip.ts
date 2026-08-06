/**
 * Verificación round-trip (Fase 04, criterio "la exportación falla si no
 * decodifica"). Trabaja a nivel de matriz: codifica, aplica la excavación del
 * logo, renderiza RGB y decodifica con el MISMO decodificador del motor.
 *
 * - La web lo usa para el badge de escaneabilidad (barato, sin sharp).
 * - La API decodifica además el PNG final real (píxeles de sharp) con
 *   `decodeRgbImage` y compara contra el payload canónico.
 */

import type { EccLevel } from "../domain/qr-options.js";
import type { QrMatrix } from "../domain/qr-result.js";
import {
  decodeRgbImage,
  encodeMatrix,
  type RgbImage,
  renderMatrixRgb,
} from "../renderers/qr-encoder.adapter.js";

export { decodeRgbImage, type RgbImage };

export interface RoundTripVerdict {
  /** El payload se recuperó íntegro tras la excavación. */
  payloadMatches: boolean;
  /** Había un QR decodificable (aunque fuera otro payload). */
  decodes: boolean;
  /** Módulos oscuros perdidos por la excavación. */
  lostModules: number;
  /** Total de módulos de la matriz. */
  totalModules: number;
}

export function verifyMatrixRoundTrip(input: {
  payload: string;
  ecc: EccLevel;
  /** Máscara de excavación (módulos bajo el logo). */
  excavation?: boolean[][] | undefined;
}): RoundTripVerdict {
  const matrix = encodeMatrix(input.payload, input.ecc);
  const excavated = applyExcavation(matrix, input.excavation);
  const image = renderMatrixRgb(excavated);
  let decoded: string | undefined;
  try {
    decoded = decodeRgbImage(image);
  } catch {
    decoded = undefined;
  }
  return {
    payloadMatches: decoded === input.payload,
    decodes: decoded !== undefined,
    lostModules: countLostModules(matrix, input.excavation),
    totalModules: matrix.moduleCount * matrix.moduleCount,
  };
}

/** Copia la matriz con los módulos excavados convertidos a fondo (false). */
function applyExcavation(matrix: QrMatrix, excavation: boolean[][] | undefined): QrMatrix {
  if (excavation === undefined) {
    return matrix;
  }
  const modules = matrix.modules.map((row, y) =>
    row.map((dark, x) => dark && excavation[y]?.[x] !== true),
  );
  return { ...matrix, modules };
}

function countLostModules(matrix: QrMatrix, excavation: boolean[][] | undefined): number {
  if (excavation === undefined) {
    return 0;
  }
  let lost = 0;
  matrix.modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark && excavation[y]?.[x] === true) {
        lost += 1;
      }
    });
  });
  return lost;
}
