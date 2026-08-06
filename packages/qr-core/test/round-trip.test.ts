import { describe, expect, it } from "vitest";
import { buildCanonicalPayload, decodeMatrix, encodeMatrix } from "../src/index.js";
import { roundTripFixtures } from "./fixtures.js";

describe("round-trip", () => {
  for (const fixture of roundTripFixtures) {
    it(`${fixture.name}: decode(encode(build(input))) === payload canónico`, () => {
      const { payload } = buildCanonicalPayload(fixture.content);
      const matrix = encodeMatrix(payload, "medium");
      const decoded = decodeMatrix(matrix);
      expect(decoded).toBe(payload);
    });
  }

  it("round-trip con ECC quartile y high", () => {
    const { payload } = buildCanonicalPayload({
      type: "url",
      url: "https://example.com/camino?clave=valor#seccion",
    });
    for (const ecc of ["quartile", "high"] as const) {
      const decoded = decodeMatrix(encodeMatrix(payload, ecc));
      expect(decoded).toBe(payload);
    }
  });
});
