/** Valida contenido + opciones: payload canónico, contraste, capacidad y densidad. */
import { QR_OPTIONS_DEFAULTS, type QrContent, type QrRenderOptions } from "@acore/contracts";
import type { QrValidationResult } from "../domain/qr-result.js";
import { encodeMatrix } from "../renderers/qr-encoder.adapter.js";
import {
  assertWithinAbsoluteCapacity,
  classifyDensity,
  densityRecommendations,
} from "../validation/capacity.js";
import { assertValidContrast } from "../validation/contrast.js";
import { buildCanonicalPayload } from "./build-canonical-payload.js";

const GIF_COLOR_WARNING = "Los colores personalizados solo se aplican al formato SVG en esta fase.";

function gifColorWarning(options: QrRenderOptions): string[] {
  if (
    options.format === "gif" &&
    (options.foreground !== QR_OPTIONS_DEFAULTS.foreground ||
      options.background !== QR_OPTIONS_DEFAULTS.background)
  ) {
    return [GIF_COLOR_WARNING];
  }
  return [];
}

export function validateQr(input: {
  content: QrContent;
  options: QrRenderOptions;
}): QrValidationResult {
  const { payload, warnings } = buildCanonicalPayload(input.content);
  // Las reglas de color/contraste aplican al render SVG; el GIF ignora colores
  // (coherente con renderQr, que no las aplica para gif).
  if (input.options.format !== "gif") {
    assertValidContrast(input.options.foreground, input.options.background);
  }
  assertWithinAbsoluteCapacity(payload);
  const matrix = encodeMatrix(payload, input.options.ecc);
  const density = classifyDensity(matrix.version);
  return {
    valid: true,
    canonicalPayload: payload,
    density,
    warnings: [...warnings, ...gifColorWarning(input.options)],
    recommendations: densityRecommendations(density),
  };
}
