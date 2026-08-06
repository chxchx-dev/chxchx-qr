import { describe, expect, it } from "vitest";
import {
  buildCanonicalPayload,
  computeLogoPlacement,
  encodeMatrix,
  logoBoxInSvgUnits,
  renderExcavatedSvg,
  renderSvg,
  renderSvgWithLogo,
} from "../src/index.js";

const LOGO_DATA_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";

function buildSvgOptions() {
  return {
    size: 512,
    marginModules: 4,
    foreground: "#000000",
    background: "#FFFFFF",
  };
}

describe("composite-logo", () => {
  it("la excavación reduce el path respecto al SVG sin logo", () => {
    const { payload } = buildCanonicalPayload({ type: "text", text: "Logo seguro" });
    const matrix = encodeMatrix(payload, "high");
    const placement = computeLogoPlacement(matrix);
    const plain = renderSvg(matrix, buildSvgOptions());
    const excavated = renderExcavatedSvg(matrix, buildSvgOptions(), placement);
    expect(excavated).not.toBe(plain);
    // El path excavado es más corto (menos comandos M…z).
    const countCommands = (svg: string): number => (svg.match(/M\d+ \d+h1v1h-1z/g) ?? []).length;
    expect(countCommands(excavated)).toBeLessThan(countCommands(plain));
  });

  it("renderSvgWithLogo embebe el logo como <image> y escapa el href", () => {
    const { payload } = buildCanonicalPayload({ type: "text", text: "Con logo" });
    const matrix = encodeMatrix(payload, "high");
    const placement = computeLogoPlacement(matrix);
    const svg = renderSvgWithLogo(matrix, buildSvgOptions(), placement, LOGO_DATA_URI);
    expect(svg).toContain("<image");
    expect(svg).toContain(LOGO_DATA_URI);
    expect(svg.endsWith("</svg>")).toBe(true);
    // Sin scripts ni contenido externo.
    expect(svg.toLowerCase()).not.toContain("<script");
    expect(svg.toLowerCase()).not.toContain("foreignobject");
  });

  it("logoBoxInSvgUnits mapea la caja de módulos a píxeles del SVG", () => {
    const count = 25;
    const matrix = {
      modules: Array.from({ length: count }, () => Array.from({ length: count }, () => false)),
      moduleCount: count,
      version: 2,
    };
    const placement = computeLogoPlacement(matrix);
    const box = logoBoxInSvgUnits(matrix, placement, buildSvgOptions());
    const viewSize = count + 4 * 2;
    const unit = 512 / viewSize;
    expect(box.width).toBeCloseTo(placement.boxModules * unit);
    expect(box.height).toBeCloseTo(placement.boxModules * unit);
    expect(box.x).toBeCloseTo((placement.x + 4) * unit);
    expect(box.y).toBeCloseTo((placement.y + 4) * unit);
  });
});
