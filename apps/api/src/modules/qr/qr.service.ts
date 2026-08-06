/**
 * Servicio del módulo QR: normaliza la petición y orquesta el render de SVG,
 * GIF y PNG (Fase 04). Para PNG/logo delega en el pipeline de `qr-core` con el
 * rasterizador sharp inyectado y verifica la escaneabilidad final.
 */
import { QR_OPTIONS_DEFAULTS, type QrContent, type QrRenderOptions } from "@acore/contracts";
import {
  assertEccAllowedForLogo,
  assertValidContrast,
  assertWithinAbsoluteCapacity,
  buildCanonicalPayload,
  encodeMatrix,
  findSafeLogoPlacement,
  QrLogoUnsupportedFormatError,
  type QrRenderResult,
  QrRenderUnscannableError,
  renderPng,
  renderQr,
  renderSvgWithLogo,
} from "@acore/qr-core";
import { sharpPngRasterizer, verifyPngPayload } from "./png.rasterizer.js";

export interface QrRequestInput {
  content: QrContent;
  options?: QrRenderOptions | undefined;
}

export interface ResolvedQrRequest {
  content: QrContent;
  options: QrRenderOptions;
}

/** Aplica los valores por defecto del contrato cuando faltan opciones. */
export function resolveQrRequest(input: QrRequestInput): ResolvedQrRequest {
  return { content: input.content, options: input.options ?? { ...QR_OPTIONS_DEFAULTS } };
}

/**
 * Renderiza con el motor único (qr-core) y las extensiones de la Fase 04:
 * - GIF + logo → 422 (el encoder GIF no admite logo);
 * - logo + ECC ≠ high → 422 (política de escaneabilidad);
 * - SVG + logo → SVG con `<image>` embebido tras verificar la matriz (round-trip);
 * - PNG (± logo) → rasterizado con sharp y decode final del PNG real.
 */
export async function renderQrResolved(input: ResolvedQrRequest): Promise<QrRenderResult> {
  const { content, options } = input;
  const logo = options.logo;
  const hasLogo = logo !== undefined;

  if (hasLogo && options.format === "gif") {
    throw new QrLogoUnsupportedFormatError(
      "El formato GIF no admite logos en esta versión: usa SVG o PNG.",
    );
  }
  assertEccAllowedForLogo(options.ecc, hasLogo);

  if (options.format === "png") {
    const result = await renderPng({ content, options, logoDataUri: logo }, sharpPngRasterizer);
    // Decode final: la exportación falla si el artefacto real no decodifica.
    const { payload } = buildCanonicalPayload(content);
    await verifyPngPayload(result.body as Uint8Array, payload);
    return result;
  }

  if (hasLogo) {
    // SVG con logo: colocación segura verificada a nivel de matriz (el SVG no
    // se rasteriza aquí; la caja se reduce hasta que el round-trip decodifica).
    const { payload } = buildCanonicalPayload(content);
    assertWithinAbsoluteCapacity(payload);
    assertValidContrast(options.foreground, options.background);
    const matrix = encodeMatrix(payload, options.ecc);
    const { placement, verdict } = findSafeLogoPlacement({ payload, ecc: options.ecc });
    if (!verdict.payloadMatches) {
      throw new QrRenderUnscannableError(
        "El QR con logo no decodifica el contenido: reduce el tamaño del logo o usa un enlace más corto.",
      );
    }
    const svg = renderSvgWithLogo(
      matrix,
      {
        size: options.size,
        marginModules: options.marginModules,
        foreground: options.foreground,
        background: options.background,
      },
      placement,
      logo,
    );
    return { body: svg, contentType: "image/svg+xml", filename: "qr-code.svg", format: "svg" };
  }

  return renderQr(input);
}
