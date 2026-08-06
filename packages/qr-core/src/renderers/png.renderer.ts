/**
 * Pipeline PNG (Fase 04, ADR-007). `qr-core` es navegable: NO importa sharp.
 * El rasterizador SVG→PNG se inyecta (la API lo implementa con sharp y además
 * compone el logo a nivel de píxel y decodifica el PNG final).
 *
 * Flujo: payload canónico → contraste → matriz → SVG excavado (con la caja del
 * logo vacía) → rasterizado → PNG. La caja del logo se comunica al rasterizador
 * en píxeles del PNG destino.
 */
import type { QrContent, QrRenderOptions } from "@acore/contracts";
import { findSafeLogoPlacement } from "../customization/logo-placement.js";
import type { QrRenderResult } from "../domain/qr-result.js";
import { buildCanonicalPayload } from "../services/build-canonical-payload.js";
import { assertWithinAbsoluteCapacity } from "../validation/capacity.js";
import { assertValidContrast } from "../validation/contrast.js";
import { logoBoxInSvgUnits, renderExcavatedSvg } from "./composite-logo.js";
import { encodeMatrix } from "./qr-encoder.adapter.js";
import { renderSvg } from "./svg.renderer.js";

export interface PngRasterizerInput {
  /** SVG del QR (con la caja del logo excavada si hay logo). */
  svg: string;
  /** Tamaño del PNG de salida (px). */
  size: number;
  /** Caja del logo en píxeles del PNG (si hay logo). */
  logoBox?: { x: number; y: number; width: number; height: number } | undefined;
  /** Logo re-encodado como data URI PNG (lo compone el rasterizador). */
  logoDataUri?: string | undefined;
}

export type PngRasterizer = (input: PngRasterizerInput) => Promise<Uint8Array>;

export interface RenderPngInput {
  content: QrContent;
  /** Opciones con format === "png" (ya validadas por el contrato). */
  options: QrRenderOptions;
  /** Logo re-encodado (data URI) si el usuario añadió uno. */
  logoDataUri?: string | undefined;
}

export async function renderPng(
  input: RenderPngInput,
  rasterize: PngRasterizer,
): Promise<QrRenderResult> {
  const { payload } = buildCanonicalPayload(input.content);
  assertWithinAbsoluteCapacity(payload);
  assertValidContrast(input.options.foreground, input.options.background);
  const matrix = encodeMatrix(payload, input.options.ecc);
  const svgOptions = {
    size: input.options.size,
    marginModules: input.options.marginModules,
    foreground: input.options.foreground,
    background: input.options.background,
  };

  // Con logo, la caja se ajusta a la colocación segura (round-trip verificado).
  let svg: string;
  let logoBox: PngRasterizerInput["logoBox"];
  if (input.logoDataUri === undefined) {
    svg = renderSvg(matrix, svgOptions);
  } else {
    const placement = findSafeLogoPlacement({ payload, ecc: input.options.ecc }).placement;
    svg = renderExcavatedSvg(matrix, svgOptions, placement);
    logoBox = logoBoxInSvgUnits(matrix, placement, svgOptions);
  }

  const body = await rasterize({
    svg,
    size: input.options.size,
    ...(input.logoDataUri !== undefined ? { logoBox, logoDataUri: input.logoDataUri } : {}),
  });
  return { body, contentType: "image/png", filename: "qr-code.png", format: "png" };
}
