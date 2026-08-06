import { describe, expect, it } from "vitest";
import type { QrMatrix } from "../src/domain/qr-result.js";
import { buildExcavationMask, computeLogoPlacement } from "../src/index.js";

function matrixOf(count: number): QrMatrix {
  const modules = Array.from({ length: count }, () => Array.from({ length: count }, () => false));
  return { modules, moduleCount: count, version: (count - 17) / 4 };
}

describe("computeLogoPlacement", () => {
  it("deja intactos los finder patterns y sus separadores (zona [8, count-8])", () => {
    for (const count of [21, 25, 29, 33, 57]) {
      const placement = computeLogoPlacement(matrixOf(count));
      expect(placement.x).toBeGreaterThanOrEqual(8);
      expect(placement.y).toBeGreaterThanOrEqual(8);
      expect(placement.x + placement.boxModules).toBeLessThanOrEqual(count - 8);
      expect(placement.y + placement.boxModules).toBeLessThanOrEqual(count - 8);
    }
  });

  it("respeta el máximo de 20% del área", () => {
    for (const count of [21, 25, 33, 57, 97]) {
      const placement = computeLogoPlacement(matrixOf(count));
      const areaFraction = placement.boxModules ** 2 / count ** 2;
      expect(areaFraction).toBeLessThanOrEqual(0.2 + 1e-9);
    }
  });

  it("la caja queda centrada", () => {
    const count = 33;
    const placement = computeLogoPlacement(matrixOf(count));
    const expectedStart = Math.floor((count - placement.boxModules) / 2);
    expect(placement.x).toBe(expectedStart);
    expect(placement.y).toBe(expectedStart);
  });

  it("nunca devuelve una caja menor de 2 módulos", () => {
    expect(computeLogoPlacement(matrixOf(21)).boxModules).toBeGreaterThanOrEqual(2);
  });
});

describe("buildExcavationMask", () => {
  it("marca exactamente los módulos dentro de la caja", () => {
    const count = 25;
    const matrix = matrixOf(count);
    const placement = computeLogoPlacement(matrix);
    const mask = buildExcavationMask(matrix, placement);
    let excavated = 0;
    mask.forEach((row, y) => {
      row.forEach((value, x) => {
        const inside =
          x >= placement.x &&
          x < placement.x + placement.boxModules &&
          y >= placement.y &&
          y < placement.y + placement.boxModules;
        expect(value).toBe(inside);
        if (inside) {
          excavated += 1;
        }
      });
    });
    expect(excavated).toBe(placement.boxModules ** 2);
  });
});
