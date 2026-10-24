import { describe, expect, it } from "vitest";
import { parsePngHeader, postJson, startTestServer } from "./helpers.js";

describe("POST /api/v1/qr/render (PNG)", () => {
  it("genera y verifica un PNG QR con el tamaño solicitado", async () => {
    const { baseUrl } = await startTestServer();
    const res = await postJson(baseUrl, "/api/v1/qr/render", {
      content: { type: "text", text: "hola" },
      options: {
        format: "png",
        ecc: "medium",
        size: 128,
        marginModules: 4,
        foreground: "#000000",
        background: "#FFFFFF",
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="qr-code.png"');
    expect(res.headers.get("cache-control")).toBe("no-store");
    const header = parsePngHeader(new Uint8Array(await res.arrayBuffer()));
    expect(header.signatureOk).toBe(true);
    expect(header.width).toBe(128);
    expect(header.height).toBe(128);
  });
});
