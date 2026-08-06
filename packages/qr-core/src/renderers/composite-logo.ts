/**
 * Composite de logo (Fase 04): produce el SVG final con el logo embebido.
 * - `renderExcavatedSvg`: el QR SIN los módulos bajo la caja del logo (base
 *   para PNG: sharp rasteriza esto y compone el logo a nivel de píxel).
 * - `renderSvgWithLogo`: SVG con `<image>` del logo embebido (para la vista
 *   previa del navegador y la descarga SVG).
 *
 * El logo llega SIEMPRE como data URI PNG re-encodado por la API (nunca un SVG
 * de usuario). El href se escapa por defensa aunque base64 no usa `<>&"`.
 */

import { buildExcavationMask, type LogoPlacement } from "../customization/logo-placement.js";
import type { QrMatrix } from "../domain/qr-result.js";
import { renderSvg, type SvgRenderOptions } from "./svg.renderer.js";

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Píxeles de la caja del logo dentro del SVG (coordenadas del viewBox). */
export function logoBoxInSvgUnits(
  matrix: QrMatrix,
  placement: LogoPlacement,
  options: SvgRenderOptions,
): { x: number; y: number; width: number; height: number } {
  const viewSize = matrix.moduleCount + options.marginModules * 2;
  const unit = options.size / viewSize;
  return {
    x: (placement.x + options.marginModules) * unit,
    y: (placement.y + options.marginModules) * unit,
    width: placement.boxModules * unit,
    height: placement.boxModules * unit,
  };
}

/** SVG del QR con la caja del logo excavada (sin la imagen del logo). */
export function renderExcavatedSvg(
  matrix: QrMatrix,
  options: SvgRenderOptions,
  placement: LogoPlacement,
): string {
  return renderSvg(matrix, { ...options, skip: buildExcavationMask(matrix, placement) });
}

/** SVG final con el logo embebido (vista previa y descarga SVG). */
export function renderSvgWithLogo(
  matrix: QrMatrix,
  options: SvgRenderOptions,
  placement: LogoPlacement,
  logoDataUri: string,
): string {
  const base = renderExcavatedSvg(matrix, options, placement);
  const box = logoBoxInSvgUnits(matrix, placement, options);
  const image =
    `<image href="${escapeXmlAttribute(logoDataUri)}" x="${box.x}" y="${box.y}" ` +
    `width="${box.width}" height="${box.height}" preserveAspectRatio="xMidYMid meet"/>`;
  return base.replace("</svg>", `${image}</svg>`);
}
