import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { startTestServer, uploadLogo } from "./helpers.js";

async function makeImage(options: {
  width: number;
  height: number;
  format: "png" | "jpeg" | "webp";
  noise?: boolean;
}): Promise<Buffer> {
  const { width, height, format } = options;
  if (options.noise === true) {
    const data = Buffer.alloc(width * height * 3);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.floor(Math.random() * 256);
    }
    return sharp(data, { raw: { width, height, channels: 3 } })
      .png({ compressionLevel: 1 })
      .toBuffer();
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<rect width="${width}" height="${height}" fill="#FFFFFF"/>` +
    `<rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="#2563eb"/>` +
    `</svg>`;
  const pipeline = sharp(Buffer.from(svg));
  if (format === "jpeg") return pipeline.jpeg().toBuffer();
  if (format === "webp") return pipeline.webp().toBuffer();
  return pipeline.png().toBuffer();
}

describe("POST /api/v1/qr/logo", () => {
  it("acepta PNG, JPEG y WebP y devuelve siempre un PNG re-encodado (sin metadata)", async () => {
    const { baseUrl } = await startTestServer();
    for (const format of ["png", "jpeg", "webp"] as const) {
      const mimetype =
        format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
      const res = await uploadLogo(
        baseUrl,
        await makeImage({ width: 64, height: 64, format }),
        `logo.${format}`,
        mimetype,
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        dataUri: string;
        width: number;
        height: number;
        format: string;
      };
      expect(body.dataUri.startsWith("data:image/png;base64,")).toBe(true);
      expect(body.format).toBe("png");
      expect(body.width).toBe(64);
      expect(body.height).toBe(64);
      // El data URI decodifica como PNG válido (re-encode + metadata eliminada).
      const decoded = Buffer.from(body.dataUri.split(",").at(1) ?? "", "base64");
      expect(decoded[0]).toBe(0x89);
      expect(decoded[1]).toBe(0x50);
    }
  });

  it("redimensiona logos mayores de 1024×1024 (sin ampliar los pequeños)", async () => {
    const { baseUrl } = await startTestServer();
    const big = await makeImage({ width: 2048, height: 2048, format: "png" });
    const res = await uploadLogo(baseUrl, big, "big.png");
    // 2048×2048 sólido pesa menos de 2 MB, pero excede la dimensión máxima.
    expect(res.status).toBe(413);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_LOGO_TOO_LARGE");
  });

  it("rechaza logos que superan 2 MB (413 QR_LOGO_TOO_LARGE)", async () => {
    const { baseUrl } = await startTestServer();
    const noisy = await makeImage({ width: 2048, height: 2048, format: "png", noise: true });
    expect(noisy.length).toBeGreaterThan(2 * 1024 * 1024);
    const res = await uploadLogo(baseUrl, noisy, "noisy.png");
    expect(res.status).toBe(413);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_LOGO_TOO_LARGE");
  });

  it("rechaza un SVG disfrazado de PNG (415 QR_LOGO_INVALID)", async () => {
    const { baseUrl } = await startTestServer();
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>',
    );
    const res = await uploadLogo(baseUrl, svg, "logo.svg", "image/png");
    expect(res.status).toBe(415);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_LOGO_INVALID");
  });

  it("rechaza un archivo corrupto (415 QR_LOGO_INVALID)", async () => {
    const { baseUrl } = await startTestServer();
    const corrupt = Buffer.from("esto no es una imagen pero empieza igual que PNG...");
    corrupt[0] = 0x89;
    const res = await uploadLogo(baseUrl, corrupt, "corrupt.png", "image/png");
    expect(res.status).toBe(415);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_LOGO_INVALID");
  });

  it("responde 400 si no llega el archivo en el campo logo", async () => {
    const { baseUrl } = await startTestServer();
    const form = new FormData();
    const res = await fetch(`${baseUrl}/api/v1/qr/logo`, { method: "POST", body: form });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_LOGO_INVALID");
  });
});
