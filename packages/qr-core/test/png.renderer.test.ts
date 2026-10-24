import { describe, expect, it } from "vitest";
import { type PngRasterizerInput, renderPng } from "../src/index.js";

const FAKE_PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

function captureRasterizer() {
  const calls: PngRasterizerInput[] = [];
  const rasterize = async (input: PngRasterizerInput): Promise<Uint8Array> => {
    calls.push(input);
    return FAKE_PNG;
  };
  return { calls, rasterize };
}

describe("renderPng (pipeline con rasterizador inyectado)", () => {
  it("devuelve un resultado PNG con el body del rasterizador", async () => {
    const { rasterize } = captureRasterizer();
    const result = await renderPng(
      {
        content: { type: "url", url: "https://example.com" },
        options: {
          format: "png",
          ecc: "medium",
          size: 256,
          marginModules: 4,
          foreground: "#000000",
          background: "#FFFFFF",
        },
      },
      rasterize,
    );
    expect(result.contentType).toBe("image/png");
    expect(result.format).toBe("png");
    expect(result.filename).toBe("qr-code.png");
    expect(result.body).toBe(FAKE_PNG);
  });

  it("envía el SVG del QR al rasterizador", async () => {
    const { calls, rasterize } = captureRasterizer();
    await renderPng(
      {
        content: { type: "text", text: "hola" },
        options: {
          format: "png",
          ecc: "medium",
          size: 128,
          marginModules: 4,
          foreground: "#000000",
          background: "#FFFFFF",
        },
      },
      rasterize,
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]?.size).toBe(128);
    expect(calls[0]?.svg).toContain("<svg");
  });

  it("rechaza contraste insuficiente antes de rasterizar", async () => {
    const { calls, rasterize } = captureRasterizer();
    await expect(
      renderPng(
        {
          content: { type: "text", text: "hola" },
          options: {
            format: "png",
            ecc: "medium",
            size: 256,
            marginModules: 4,
            foreground: "#808080",
            background: "#FFFFFF",
          },
        },
        rasterize,
      ),
    ).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
});
