/** PNG pipeline agnóstico: qr-core crea SVG y la API inyecta su rasterizador. */
import type { QrContent, QrRenderOptions } from "@acore/contracts";
import type { QrRenderResult } from "../domain/qr-result.js";
import { buildCanonicalPayload } from "../services/build-canonical-payload.js";
import { assertWithinAbsoluteCapacity } from "../validation/capacity.js";
import { assertValidContrast } from "../validation/contrast.js";
import { encodeMatrix } from "./qr-encoder.adapter.js";
import { renderSvg } from "./svg.renderer.js";

export interface PngRasterizerInput {
  svg: string;
  size: number;
}

export type PngRasterizer = (input: PngRasterizerInput) => Promise<Uint8Array>;

export interface RenderPngInput {
  content: QrContent;
  options: QrRenderOptions;
}

export async function renderPng(
  input: RenderPngInput,
  rasterize: PngRasterizer,
): Promise<QrRenderResult> {
  const { payload } = buildCanonicalPayload(input.content);
  assertWithinAbsoluteCapacity(payload);
  assertValidContrast(input.options.foreground, input.options.background);
  const matrix = encodeMatrix(payload, input.options.ecc);
  const svg = renderSvg(matrix, {
    size: input.options.size,
    marginModules: input.options.marginModules,
    foreground: input.options.foreground,
    background: input.options.background,
  });
  const body = await rasterize({ svg, size: input.options.size });
  return { body, contentType: "image/png", filename: "qr-code.png", format: "png" };
}
