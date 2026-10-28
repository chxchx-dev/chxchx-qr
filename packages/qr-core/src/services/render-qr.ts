/** Renderiza el QR a SVG o GIF (PNG servidor fuera de alcance en esta fase). */
import type { QrContent, QrRenderOptions } from "@chxchx/contracts";
import { QrUnsupportedFormatError } from "../domain/qr-errors.js";
import type { QrRenderResult } from "../domain/qr-result.js";
import { renderGif } from "../renderers/gif.renderer.js";
import { encodeMatrix } from "../renderers/qr-encoder.adapter.js";
import { renderSvg } from "../renderers/svg.renderer.js";
import { assertWithinAbsoluteCapacity } from "../validation/capacity.js";
import { assertValidContrast } from "../validation/contrast.js";
import { buildCanonicalPayload } from "./build-canonical-payload.js";

export function renderQr(input: { content: QrContent; options: QrRenderOptions }): QrRenderResult {
  const { payload } = buildCanonicalPayload(input.content);
  assertWithinAbsoluteCapacity(payload);

  switch (input.options.format) {
    case "svg": {
      assertValidContrast(input.options.foreground, input.options.background);
      const matrix = encodeMatrix(payload, input.options.ecc);
      const svg = renderSvg(matrix, {
        size: input.options.size,
        marginModules: input.options.marginModules,
        foreground: input.options.foreground,
        background: input.options.background,
      });
      return { body: svg, contentType: "image/svg+xml", filename: "qr-code.svg", format: "svg" };
    }
    case "gif": {
      const gif = renderGif(payload, {
        ecc: input.options.ecc,
        marginModules: input.options.marginModules,
        size: input.options.size,
      });
      return { body: gif, contentType: "image/gif", filename: "qr-code.gif", format: "gif" };
    }
    case "png":
      // El pipeline PNG es asíncrono (rasterizador inyectado): usa renderPng.
      throw new QrUnsupportedFormatError(
        "El PNG requiere el pipeline asíncrono renderPng con el rasterizador de la API.",
      );
  }
}
