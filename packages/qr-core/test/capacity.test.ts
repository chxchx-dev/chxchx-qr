import { describe, expect, it } from "vitest";
import {
  assertWithinAbsoluteCapacity,
  classifyDensity,
  encodeMatrix,
  QrPayloadTooLargeError,
  renderQr,
  validateQr,
} from "../src/index.js";

describe("capacidad", () => {
  it("clasifica densidad por versión", () => {
    expect(classifyDensity(1)).toBe("safe");
    expect(classifyDensity(9)).toBe("safe");
    expect(classifyDensity(10)).toBe("dense");
    expect(classifyDensity(19)).toBe("dense");
    expect(classifyDensity(20)).toBe("critical");
    expect(classifyDensity(40)).toBe("critical");
  });

  it("rechaza antes de codificar payloads imposibles", () => {
    expect(() => assertWithinAbsoluteCapacity("a".repeat(7089))).not.toThrow();
    expect(() => assertWithinAbsoluteCapacity("a".repeat(7090))).toThrow(QrPayloadTooLargeError);
  });

  it("el encoder lanza overflow cuando el payload no cabe", () => {
    const payload = `https://example.com/${"x".repeat(1800)}`;
    expect(() => encodeMatrix(payload, "high")).toThrow(QrPayloadTooLargeError);
    // A ECC low la misma URL sí cabe
    expect(() => encodeMatrix(payload, "low")).not.toThrow();
  });

  it("validateQr marca densidad crítica en payloads largos", () => {
    const result = validateQr({
      content: { type: "url", url: `https://example.com/${"x".repeat(800)}` },
      options: {
        format: "svg",
        ecc: "low",
        size: 1024,
        marginModules: 4,
        foreground: "#000000",
        background: "#FFFFFF",
      },
    });
    expect(result.density).toBe("critical");
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("renderQr propaga el overflow con código estable", () => {
    expect(() =>
      renderQr({
        content: { type: "url", url: `https://example.com/${"x".repeat(1800)}` },
        options: {
          format: "svg",
          ecc: "high",
          size: 1024,
          marginModules: 4,
          foreground: "#000000",
          background: "#FFFFFF",
        },
      }),
    ).toThrow(QrPayloadTooLargeError);
  });
});
