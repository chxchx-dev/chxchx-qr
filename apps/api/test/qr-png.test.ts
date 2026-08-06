import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { parsePngHeader, postJson, startTestServer, uploadLogo } from "./helpers.js";

async function makeLogo(
  options: { size?: number; color?: string; background?: string } = {},
): Promise<Buffer> {
  const size = options.size ?? 128;
  const color = options.color ?? "#2563eb";
  const background = options.background ?? "#FFFFFF";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<rect width="${size}" height="${size}" fill="${background}"/>` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.38}" fill="${color}"/>` +
    `</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const PNG_BASE_OPTIONS = {
  format: "png",
  ecc: "high",
  size: 256,
  marginModules: 4,
  foreground: "#000000",
  background: "#FFFFFF",
};

describe("POST /api/v1/qr/render (PNG)", () => {
  it("devuelve un PNG con firma, dimensiones y headers correctos", async () => {
    const { baseUrl } = await startTestServer();
    const res = await postJson(baseUrl, "/api/v1/qr/render", {
      content: { type: "text", text: "hola" },
      options: { ...PNG_BASE_OPTIONS, size: 128, ecc: "medium" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="qr-code.png"');
    expect(res.headers.get("cache-control")).toBe("no-store");
    const bytes = new Uint8Array(await res.arrayBuffer());
    const header = parsePngHeader(bytes);
    expect(header.signatureOk).toBe(true);
    expect(header.width).toBe(128);
    expect(header.height).toBe(128);
  });

  it("renderiza PNG con logo (re-encodado por la API) y decodifica el payload final", async () => {
    const { baseUrl } = await startTestServer();
    const logo = await makeLogo();
    const upload = await uploadLogo(baseUrl, logo);
    expect(upload.status).toBe(200);
    const { dataUri } = (await upload.json()) as { dataUri: string };

    const res = await postJson(baseUrl, "/api/v1/qr/render", {
      content: { type: "url", url: "https://ejemplo.com/ruta" },
      options: { ...PNG_BASE_OPTIONS, logo: dataUri },
    });
    expect(res.status).toBe(200);
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(parsePngHeader(bytes).signatureOk).toBe(true);
  });

  it("rechaza GIF con logo (422 QR_LOGO_UNSUPPORTED_FORMAT)", async () => {
    const { baseUrl } = await startTestServer();
    const { dataUri } = (await (await uploadLogo(baseUrl, await makeLogo())).json()) as {
      dataUri: string;
    };
    const res = await postJson(baseUrl, "/api/v1/qr/render", {
      content: { type: "text", text: "hola" },
      options: {
        format: "gif",
        ecc: "high",
        size: 256,
        marginModules: 4,
        foreground: "#000000",
        background: "#FFFFFF",
        logo: dataUri,
      },
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_LOGO_UNSUPPORTED_FORMAT");
  });

  it("rechaza logo con ECC inferior a high (422 QR_LOGO_REQUIRES_HIGH_ECC)", async () => {
    const { baseUrl } = await startTestServer();
    const { dataUri } = (await (await uploadLogo(baseUrl, await makeLogo())).json()) as {
      dataUri: string;
    };
    const res = await postJson(baseUrl, "/api/v1/qr/render", {
      content: { type: "text", text: "hola" },
      options: { ...PNG_BASE_OPTIONS, ecc: "medium", logo: dataUri },
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_LOGO_REQUIRES_HIGH_ECC");
  });

  it("rechaza un logo oscuro con payload denso que rompe la lectura (422 QR_RENDER_UNSCANNABLE)", async () => {
    const { baseUrl } = await startTestServer();
    // Logo sólido negro: cubre la caja excavada con módulos oscuros erróneos.
    const { dataUri } = (await (
      await uploadLogo(baseUrl, await makeLogo({ color: "#000000", background: "#000000" }))
    ).json()) as {
      dataUri: string;
    };
    const res = await postJson(baseUrl, "/api/v1/qr/render", {
      content: { type: "url", url: `https://ejemplo.com/${"y".repeat(180)}` },
      options: { ...PNG_BASE_OPTIONS, size: 512, logo: dataUri },
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_RENDER_UNSCANNABLE");
  });

  it("rechaza un data URI de logo no emitido por la API (415 QR_LOGO_INVALID)", async () => {
    const { baseUrl } = await startTestServer();
    const res = await postJson(baseUrl, "/api/v1/qr/render", {
      content: { type: "text", text: "hola" },
      options: { ...PNG_BASE_OPTIONS, logo: "data:image/png;base64,PHN2Zy8+" },
    });
    expect(res.status).toBe(415);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_LOGO_INVALID");
  });

  it("sirve renders PNG con logo en paralelo sin errores (concurrencia)", async () => {
    const { baseUrl } = await startTestServer();
    const { dataUri } = (await (await uploadLogo(baseUrl, await makeLogo())).json()) as {
      dataUri: string;
    };
    const parallel = Array.from({ length: 8 }, (_, index) =>
      postJson(baseUrl, "/api/v1/qr/render", {
        content: { type: "url", url: `https://ejemplo.com/ruta-${index}` },
        options: { ...PNG_BASE_OPTIONS, logo: dataUri },
      }),
    );
    const results = await Promise.all(parallel);
    for (const res of results) {
      expect(res.status).toBe(200);
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(parsePngHeader(bytes).signatureOk).toBe(true);
    }
  });
});
