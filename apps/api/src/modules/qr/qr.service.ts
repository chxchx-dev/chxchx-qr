/** Adapta el motor QR puro a los formatos servidos por la API. */
import {
  QR_OPTIONS_DEFAULTS as DEFAULT_OPTIONS,
  type QrContent,
  type QrRenderOptions,
} from "@acore/contracts";
import { buildCanonicalPayload, type QrRenderResult, renderPng, renderQr } from "@acore/qr-core";
import { sharpPngRasterizer, verifyPngPayload } from "./png.rasterizer.js";

export interface QrRequestInput {
  content: QrContent;
  options?: QrRenderOptions | undefined;
}

export interface ResolvedQrRequest {
  content: QrContent;
  options: QrRenderOptions;
}

/** Aplica los valores por defecto compartidos cuando faltan opciones. */
export function resolveQrRequest(input: QrRequestInput): ResolvedQrRequest {
  return { content: input.content, options: input.options ?? { ...DEFAULT_OPTIONS } };
}

/** Renderiza SVG/GIF con qr-core y PNG con el rasterizador local de la API. */
export async function renderQrResolved(input: ResolvedQrRequest): Promise<QrRenderResult> {
  if (input.options.format !== "png") return renderQr(input);

  const result = await renderPng(
    { content: input.content, options: input.options },
    sharpPngRasterizer,
  );
  const { payload } = buildCanonicalPayload(input.content);
  await verifyPngPayload(result.body as Uint8Array, payload);
  return result;
}
