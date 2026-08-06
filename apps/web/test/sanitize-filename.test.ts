import { describe, expect, it } from "vitest";
import { sanitizeFilename } from "../src/shared/lib/sanitize-filename";

describe("sanitizeFilename", () => {
  it("reemplaza separadores de ruta y caracteres prohibidos", () => {
    expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j')).toBe("a-b-c-d-e-f-g-h-i-j");
  });

  it("elimina caracteres de control", () => {
    expect(sanitizeFilename("hola\u0000mundo\u001f")).toBe("hola-mundo-");
  });

  it("normaliza espacios y recorta", () => {
    expect(sanitizeFilename("  hola   mundo  ")).toBe("hola mundo");
  });

  it("elimina puntos iniciales y finales (evita archivos ocultos)", () => {
    expect(sanitizeFilename("...secreto")).toBe("secreto");
    expect(sanitizeFilename("qr.")).toBe("qr");
    expect(sanitizeFilename("..")).toBe("qr-code");
  });

  it("limita a 80 caracteres", () => {
    expect(sanitizeFilename("x".repeat(200)).length).toBe(80);
  });

  it("devuelve qr-code cuando queda vacío", () => {
    expect(sanitizeFilename("   ")).toBe("qr-code");
    expect(sanitizeFilename("")).toBe("qr-code");
  });
});
