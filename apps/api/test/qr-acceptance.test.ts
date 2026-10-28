import type { QrContent, QrRenderOptions } from "@chxchx/contracts";
import { buildCanonicalPayload, decodeRgbImage } from "@chxchx/qr-core";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { postJson, startTestServer } from "./helpers.js";

const CONTENT_CASES: QrContent[] = [
  { type: "text", text: "Chxchx QR acceptance" },
  { type: "url", url: "https://example.com/acceptance?source=qr" },
  { type: "email", email: "hola@example.com", subject: "Prueba", body: "QR estático" },
  { type: "phone", phone: "+573001234567" },
  { type: "sms", phone: "+573001234567", body: "Cita mañana a las 10" },
  {
    type: "wifi",
    ssid: "Chxchx-WiFi",
    password: "prueba-qr-2026",
    networkType: "WPA",
    hidden: false,
  },
  { type: "vcard", name: "Ana", lastname: "García", email: "ana@example.com" },
  {
    type: "calendar",
    summary: "Revisión del generador",
    start: "2026-08-05T15:00:00Z",
    end: "2026-08-05T16:00:00Z",
  },
  { type: "geo", lat: 4.711, lng: -74.0721, label: "Bogotá" },
];

const FORMATS = ["svg", "png", "gif"] as const;

const BASE_OPTIONS: Omit<QrRenderOptions, "format"> = {
  ecc: "medium",
  size: 256,
  marginModules: 4,
  foreground: "#000000",
  background: "#FFFFFF",
};

describe("aceptación del generador: 9 tipos × 3 formatos", () => {
  it("todos los archivos emitidos por la API decodifican al payload esperado", async () => {
    const { baseUrl } = await startTestServer();

    for (const content of CONTENT_CASES) {
      const { payload } = buildCanonicalPayload(content);

      for (const format of FORMATS) {
        const response = await postJson(baseUrl, "/api/v1/qr/render", {
          content,
          options: { ...BASE_OPTIONS, format },
        });

        expect(response.status, `${content.type}/${format}`).toBe(200);
        expect(response.headers.get("content-type"), `${content.type}/${format}`).toContain(
          format === "svg" ? "image/svg+xml" : `image/${format}`,
        );

        const imageBytes = Buffer.from(await response.arrayBuffer());
        const { data, info } = await sharp(imageBytes)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        const decoded = decodeRgbImage(
          { width: info.width, height: info.height, data: new Uint8Array(data) },
          4,
        );

        expect(decoded, `${content.type}/${format}`).toBe(payload);
      }
    }
  });
});
