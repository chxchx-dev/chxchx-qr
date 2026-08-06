/** Vista previa local e inmediata con qr-core (mismo motor que la API). */

import type { QrRenderOptions } from "@acore/contracts";
import {
  buildCanonicalPayload,
  encodeMatrix,
  findSafeLogoPlacement,
  type RoundTripVerdict,
  renderSvg,
  renderSvgWithLogo,
} from "@acore/qr-core";
import { useMemo } from "react";
import type { ContentDraft, QrContentType } from "../generator.types";
import { validateDraft } from "../lib/validate-draft";

export interface QrPreviewState {
  /** SVG generado localmente con las opciones de exportación (paridad). */
  svg: string | undefined;
  /** Versión de la matriz (para densidad local). */
  version: number | undefined;
  /** Veredicto round-trip de la matriz con logo (si hay logo). */
  roundTrip: RoundTripVerdict | undefined;
}

export function useQrPreview(input: {
  type: QrContentType;
  draft: ContentDraft;
  options: QrRenderOptions;
}): QrPreviewState {
  return useMemo(() => {
    const { dto } = validateDraft(input.type, input.draft);
    if (dto === undefined) {
      return { svg: undefined, version: undefined, roundTrip: undefined };
    }
    try {
      const { payload } = buildCanonicalPayload(dto);
      const matrix = encodeMatrix(payload, input.options.ecc);
      const svgOptions = {
        size: input.options.size,
        marginModules: input.options.marginModules,
        foreground: input.options.foreground,
        background: input.options.background,
      };
      if (input.options.logo !== undefined) {
        // Misma colocación segura que la API: la caja se reduce hasta que la
        // matriz sigue decodificando (paridad preview/export).
        const { placement, verdict } = findSafeLogoPlacement({
          payload,
          ecc: input.options.ecc,
        });
        return {
          svg: renderSvgWithLogo(matrix, svgOptions, placement, input.options.logo),
          version: matrix.version,
          roundTrip: verdict,
        };
      }
      return {
        svg: renderSvg(matrix, svgOptions),
        version: matrix.version,
        roundTrip: undefined,
      };
    } catch {
      // Payload sobre capacidad (overflow): la preview se queda vacía y la API
      // validación lo bloquea con el mensaje adecuado.
      return { svg: undefined, version: undefined, roundTrip: undefined };
    }
  }, [input.type, input.draft, input.options]);
}
