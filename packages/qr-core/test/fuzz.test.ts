import { describe, expect, it } from "vitest";
import { buildCanonicalPayload, encodeMatrix } from "../src/index.js";

/** PRNG determinista (mulberry32) para que el fuzz sea reproducible. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHARS = 'abcXYZ0123 áéíóúñü çàè-_,;:"\\\n\t\u00a0\u2028\u2029😀🚀漢字日本語❤️\u2764';

describe("fuzz básico", () => {
  it("200 cadenas Unicode aleatorias bajo el límite no cuelgan ni lanzan errores inesperados", {
    timeout: 30_000,
  }, () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 200; i += 1) {
      const length = Math.floor(rand() * 500);
      let raw = "";
      for (let j = 0; j < length; j += 1) {
        raw += CHARS[Math.floor(rand() * CHARS.length)] ?? "";
      }
      const safe = raw.trim() === "" ? "x" : raw;
      const { payload } = buildCanonicalPayload({ type: "text", text: safe });
      expect(payload.length).toBeLessThanOrEqual(500);
      // Debe codificar sin colgar ni lanzar (los overflow no aplican bajo el límite).
      expect(() => encodeMatrix(payload, "medium")).not.toThrow();
    }
  });
});
