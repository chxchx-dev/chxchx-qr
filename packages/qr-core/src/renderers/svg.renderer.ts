/**
 * Renderer SVG seguro: se genera internamente desde la matriz con un `<rect>`
 * de fondo y un único `<path>` por módulo. Sin scripts, sin enlaces, sin
 * foreignObject; los colores ya fueron validados por el contrato.
 */
import type { QrMatrix } from "../domain/qr-result.js";

export interface SvgRenderOptions {
  size: number;
  marginModules: number;
  foreground: string;
  background: string;
  /** Módulos a NO dibujar (true = excavado, p. ej. bajo el logo). */
  skip?: boolean[][] | undefined;
}

export function renderSvg(matrix: QrMatrix, options: SvgRenderOptions): string {
  const { modules, moduleCount } = matrix;
  const viewSize = moduleCount + options.marginModules * 2;
  const path: string[] = [];
  for (let y = 0; y < moduleCount; y += 1) {
    for (let x = 0; x < moduleCount; x += 1) {
      if (modules[y]?.[x] === true && options.skip?.[y]?.[x] !== true) {
        const px = x + options.marginModules;
        const py = y + options.marginModules;
        path.push(`M${px} ${py}h1v1h-1z`);
      }
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${options.size}" height="${options.size}" ` +
    `viewBox="0 0 ${viewSize} ${viewSize}" role="img" aria-label="Código QR">` +
    `<rect width="${viewSize}" height="${viewSize}" fill="${options.background}"/>` +
    `<path d="${path.join("")}" fill="${options.foreground}"/>` +
    `</svg>`
  );
}
