/**
 * Colocación segura del logo (Fase 04): caja centrada, ≤20% del área del QR,
 * y nunca invade los finder patterns ni sus separadores (banda [8, count-8]).
 *
 * `findSafeLogoPlacement` parte de la caja máxima permitida y la REDUCE hasta
 * que la verificación round-trip a nivel de matriz decodifica el payload: para
 * versiones pequeñas, una caja del 20% del área destruye demasiados módulos
 * contiguos (evidencia: v3-high con caja 12/29 no decodifica). El verificador
 * es el árbitro real de escaneabilidad.
 */
import { LOGO_LIMITS } from "@acore/contracts";
import type { EccLevel } from "../domain/qr-options.js";
import type { QrMatrix } from "../domain/qr-result.js";
import { encodeMatrix } from "../renderers/qr-encoder.adapter.js";
import type { RoundTripVerdict } from "../validation/rendered-roundtrip.js";
import { verifyMatrixRoundTrip } from "../validation/rendered-roundtrip.js";

/** Finder (7 módulos) + separador (1 módulo): zona que nunca se toca. */
const PROTECTED_BAND = 8;
/** Paso de reducción de la caja (par, mantiene la simetría). */
const SHRINK_STEP = 2;
/** Caja mínima admitida (2×2 módulos). */
const MIN_BOX = 2;

export interface LogoPlacement {
  /** Lado de la caja del logo en módulos. */
  boxModules: number;
  /** Módulo inicial X (esquina superior izquierda). */
  x: number;
  /** Módulo inicial Y (esquina superior izquierda). */
  y: number;
}

export function computeLogoPlacement(
  matrix: QrMatrix,
  maxAreaFraction: number = LOGO_LIMITS.maxAreaFraction,
): LogoPlacement {
  const { moduleCount } = matrix;
  // Por área: lado ≈ sqrt(fracción del área).
  const maxByArea = Math.floor(moduleCount * Math.sqrt(maxAreaFraction));
  // Por zona segura: la caja debe caber dentro de [8, count-8].
  const maxBySafeZone = Math.max(MIN_BOX, moduleCount - 2 * PROTECTED_BAND);
  const boxModules = Math.max(MIN_BOX, Math.min(maxByArea, maxBySafeZone));
  const x = Math.floor((moduleCount - boxModules) / 2);
  const y = Math.floor((moduleCount - boxModules) / 2);
  return { boxModules, x, y };
}

export interface SafeLogoPlacement {
  placement: LogoPlacement;
  /** Veredicto round-trip de la caja elegida (payloadMatches = true salvo mínimo). */
  verdict: RoundTripVerdict;
}

/**
 * Encuentra la caja de logo más grande que sigue decodificando el payload con
 * el ECC dado. Empieza en el máximo (20% del área / zona segura) y reduce hasta
 * `MIN_BOX`. El caller decide si un fallo en el mínimo es bloqueante.
 */
export function findSafeLogoPlacement(input: {
  payload: string;
  ecc: EccLevel;
  maxAreaFraction?: number;
}): SafeLogoPlacement {
  const matrix = encodeMatrix(input.payload, input.ecc);
  const base = computeLogoPlacement(matrix, input.maxAreaFraction);
  let boxModules = base.boxModules;
  while (boxModules >= MIN_BOX) {
    const x = Math.floor((matrix.moduleCount - boxModules) / 2);
    const y = Math.floor((matrix.moduleCount - boxModules) / 2);
    const placement: LogoPlacement = { boxModules, x, y };
    const verdict = verifyMatrixRoundTrip({
      payload: input.payload,
      ecc: input.ecc,
      excavation: buildExcavationMask(matrix, placement),
    });
    if (verdict.payloadMatches) {
      return { placement, verdict };
    }
    boxModules -= SHRINK_STEP;
  }
  // Mínimo absoluto: devuelve el fallo para que el caller lo convierta en error.
  const placement = computeLogoPlacement(matrix, input.maxAreaFraction);
  const verdict = verifyMatrixRoundTrip({
    payload: input.payload,
    ecc: input.ecc,
    excavation: buildExcavationMask(matrix, placement),
  });
  return { placement, verdict };
}

/**
 * Máscara de excavación: `true` = módulo que no se dibuja (queda del color del
 * fondo, y el logo se compone encima en la exportación).
 */
export function buildExcavationMask(matrix: QrMatrix, placement: LogoPlacement): boolean[][] {
  const mask = matrix.modules.map((row) => row.map(() => false));
  for (let y = placement.y; y < placement.y + placement.boxModules; y += 1) {
    const row = mask[y];
    if (row === undefined || y < 0 || y >= matrix.moduleCount) {
      continue;
    }
    for (let x = placement.x; x < placement.x + placement.boxModules; x += 1) {
      if (x >= 0 && x < matrix.moduleCount) {
        row[x] = true;
      }
    }
  }
  return mask;
}
