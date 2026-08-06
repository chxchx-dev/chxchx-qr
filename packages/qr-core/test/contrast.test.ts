import { describe, expect, it } from "vitest";
import {
  assertValidContrast,
  contrastRatio,
  MIN_CONTRAST_RATIO,
  parseHexColor,
  QrContrastTooLowError,
  QrInvertedColorsError,
} from "../src/index.js";

describe("parseHexColor", () => {
  it("parsea #RGB y #RRGGBB", () => {
    expect(parseHexColor("#ABC")).toEqual({ r: 170, g: 187, b: 204 });
    expect(parseHexColor("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHexColor("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe("contrastRatio", () => {
  it("negro sobre blanco es 21:1 (máximo WCAG)", () => {
    expect(contrastRatio(parseHexColor("#000000"), parseHexColor("#FFFFFF"))).toBeCloseTo(21, 5);
  });

  it("blanco sobre negro también es 21:1", () => {
    expect(contrastRatio(parseHexColor("#FFFFFF"), parseHexColor("#000000"))).toBeCloseTo(21, 5);
  });
});

describe("assertValidContrast", () => {
  it("acepta el par por defecto", () => {
    expect(() => assertValidContrast("#000000", "#FFFFFF")).not.toThrow();
  });

  it("bloquea combinaciones invertidas (foreground más claro)", () => {
    expect(() => assertValidContrast("#FFFFFF", "#000000")).toThrow(QrInvertedColorsError);
    expect(() => assertValidContrast("#CCCCCC", "#888888")).toThrow(QrInvertedColorsError);
  });

  it("bloquea contraste insuficiente (< 4.5:1)", () => {
    // gris medio sobre blanco: ratio ≈ 3.9:1
    expect(() => assertValidContrast("#808080", "#FFFFFF")).toThrow(QrContrastTooLowError);
  });

  it("acepta una combinación válida justo por encima del umbral", () => {
    // #767676 sobre blanco: ratio ≈ 4.54:1
    expect(() => assertValidContrast("#767676", "#FFFFFF")).not.toThrow();
  });

  it("expone el umbral documentado", () => {
    expect(MIN_CONTRAST_RATIO).toBe(4.5);
  });
});
