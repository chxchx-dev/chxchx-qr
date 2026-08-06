import { describe, expect, it } from "vitest";
import { encodeMatrix, renderGif, renderQr, renderRaw, renderSvg } from "../src/index.js";

const OPTIONS = {
  format: "svg",
  ecc: "medium",
  size: 256,
  marginModules: 4,
  foreground: "#000000",
  background: "#FFFFFF",
} as const;

describe("renderQr", () => {
  it("renderiza un SVG válido, dimensionado y sin contenido peligroso", () => {
    const result = renderQr({ content: { type: "text", text: "hola" }, options: OPTIONS });
    expect(result.format).toBe("svg");
    expect(result.contentType).toBe("image/svg+xml");
    expect(result.filename).toBe("qr-code.svg");
    const svg = result.body as string;
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('viewBox="0 0 ');
    expect(svg).toContain("#000000");
    expect(svg.toLowerCase()).not.toContain("<script");
    expect(svg.toLowerCase()).not.toContain("foreignobject");
    expect(svg.toLowerCase()).not.toContain("href=");
  });

  it("renderiza un GIF con firma GIF87a", () => {
    const result = renderQr({
      content: { type: "text", text: "hola" },
      options: { ...OPTIONS, format: "gif" },
    });
    expect(result.format).toBe("gif");
    expect(result.contentType).toBe("image/gif");
    expect(result.filename).toBe("qr-code.gif");
    const bytes = result.body as Uint8Array;
    const header = Array.from(bytes.slice(0, 6), (byte) => String.fromCharCode(byte)).join("");
    expect(header).toBe("GIF87a");
  });

  it("renderGif aísla el cálculo de escala", () => {
    const gif = renderGif("hola", { ecc: "medium", marginModules: 4, size: 256 });
    expect(gif.length).toBeGreaterThan(0);
  });
});

describe("renderSvg", () => {
  it("respeta tamaño, margen y colores", () => {
    const matrix = encodeMatrix("hola", "medium");
    const svg = renderSvg(matrix, {
      size: 512,
      marginModules: 2,
      foreground: "#123456",
      background: "#FFFFFF",
    });
    expect(svg).toContain('width="512"');
    expect(svg).toContain('height="512"');
    expect(svg).toContain("#123456");
    expect(svg).toContain("#FFFFFF");
  });
});

describe("renderRaw", () => {
  it("devuelve la matriz 2D de módulos", () => {
    const raw = renderRaw("hola", "low");
    expect(Array.isArray(raw)).toBe(true);
    expect(raw.length).toBeGreaterThan(0);
    expect(raw[0]).toBeInstanceOf(Array);
  });
});
