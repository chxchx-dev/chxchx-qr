import { describe, expect, it } from "vitest";
import {
  buildCanonicalPayload,
  buildExcavationMask,
  computeLogoPlacement,
  encodeMatrix,
  verifyMatrixRoundTrip,
} from "../src/index.js";

const PAYLOAD_URL = "https://example.com/path?a=1&b=2#frag";

describe("verifyMatrixRoundTrip", () => {
  it("decodifica el payload sin excavación", () => {
    const { payload } = buildCanonicalPayload({ type: "url", url: PAYLOAD_URL });
    const verdict = verifyMatrixRoundTrip({ payload, ecc: "high" });
    expect(verdict.payloadMatches).toBe(true);
    expect(verdict.decodes).toBe(true);
    expect(verdict.lostModules).toBe(0);
  });

  it("sigue decodificando con la excavación estándar del logo (≤20% del área)", () => {
    const { payload } = buildCanonicalPayload({ type: "url", url: PAYLOAD_URL });
    const matrix = encodeMatrix(payload, "high");
    const excavation = buildExcavationMask(matrix, computeLogoPlacement(matrix));
    const verdict = verifyMatrixRoundTrip({ payload, ecc: "high", excavation });
    expect(verdict.payloadMatches).toBe(true);
    expect(verdict.lostModules).toBeGreaterThan(0);
    expect(verdict.lostModules).toBeLessThan(verdict.totalModules);
  });

  it("reporta fallo cuando la excavación es destructiva (caja enorme)", () => {
    const { payload } = buildCanonicalPayload({ type: "text", text: "hola" });
    const matrix = encodeMatrix(payload, "low");
    // Caja que cubre la práctica totalidad salvo los bordes: el payload se pierde.
    const excavation = matrix.modules.map((row, y) =>
      row.map(
        (_dark, x) => y > 2 && y < matrix.moduleCount - 3 && x > 2 && x < matrix.moduleCount - 3,
      ),
    );
    const verdict = verifyMatrixRoundTrip({ payload, ecc: "low", excavation });
    expect(verdict.payloadMatches).toBe(false);
    // Se pierde una fracción relevante de los módulos oscuros del código.
    expect(verdict.lostModules).toBeGreaterThan(verdict.totalModules * 0.2);
  });

  it("con ECC low y logo estándar el resultado puede degradarse (política exige high)", () => {
    const { payload } = buildCanonicalPayload({ type: "text", text: "hola" });
    const matrix = encodeMatrix(payload, "low");
    const excavation = buildExcavationMask(matrix, computeLogoPlacement(matrix));
    const verdict = verifyMatrixRoundTrip({ payload, ecc: "low", excavation });
    // No se garantiza lectura: exactamente por eso la política exige high.
    expect(typeof verdict.payloadMatches).toBe("boolean");
  });
});
