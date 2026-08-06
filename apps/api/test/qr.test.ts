import { once } from "node:events";
import type { Server } from "node:http";
import { apiConfig } from "@acore/config";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const openServers: Server[] = [];

async function startTestServer(): Promise<{ baseUrl: string }> {
  const config = apiConfig({ NODE_ENV: "test", PORT: "0" });
  const app = createApp(config);
  const server = app.listen(0);
  openServers.push(server);
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("El servidor no expone una dirección TCP válida");
  }
  return { baseUrl: `http://127.0.0.1:${address.port}` };
}

afterEach(() => {
  while (openServers.length > 0) {
    const server = openServers.pop();
    if (server?.listening) {
      server.close();
    }
  }
});

const SVG_OPTIONS = {
  format: "svg",
  ecc: "medium",
  size: 256,
  marginModules: 4,
  foreground: "#000000",
  background: "#FFFFFF",
};
const VALID_BODY = {
  content: { type: "url", url: "https://example.com" },
  options: SVG_OPTIONS,
};

async function post(baseUrl: string, path: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/qr/validate", () => {
  it("responde 200 con payload canónico, densidad y sin warnings", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/validate", VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("x-request-id")).toBeTruthy();
    const body = (await res.json()) as {
      valid: boolean;
      canonicalPayload: string;
      density: string;
      warnings: string[];
      recommendations: string[];
    };
    expect(body.valid).toBe(true);
    expect(body.canonicalPayload).toBe("https://example.com/");
    expect(body.density).toBe("safe");
    expect(body.warnings).toEqual([]);
  });

  it("avisa con http: y con teléfonos no internacionales", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/validate", {
      content: { type: "phone", phone: "600 123 456" },
    });
    const body = (await res.json()) as { warnings: string[] };
    expect(body.warnings.some((w) => w.includes("internacional"))).toBe(true);
  });

  it("aplica opciones por defecto cuando no se envían", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/validate", {
      content: { type: "text", text: "hola" },
    });
    expect(res.status).toBe(200);
  });

  it("responde 422 con QR_PAYLOAD_TOO_LARGE en overflow", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/validate", {
      content: { type: "url", url: `https://example.com/${"x".repeat(1800)}` },
      options: { ...SVG_OPTIONS, ecc: "high" },
    });
    expect(res.status).toBe(422);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
    const body = (await res.json()) as { status: number; code: string; requestId?: string };
    expect(body.status).toBe(422);
    expect(body.code).toBe("QR_PAYLOAD_TOO_LARGE");
    expect(body.requestId).toBeTruthy();
  });

  it("responde 400 QR_SCHEMA_INVALID con tipo desconocido", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/validate", {
      content: { type: "desconocido" },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_SCHEMA_INVALID");
  });

  it("responde 400 con URL peligrosa (javascript:)", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/validate", {
      content: { type: "url", url: "javascript:alert(1)" },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_SCHEMA_INVALID");
  });

  it("responde 400 con WiFi WPA sin contraseña", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/validate", {
      content: { type: "wifi", ssid: "MiRed", networkType: "WPA" },
    });
    expect(res.status).toBe(400);
  });

  it("responde 422 con colores invertidos", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/validate", {
      content: { type: "text", text: "hola" },
      options: { ...SVG_OPTIONS, foreground: "#FFFFFF", background: "#000000" },
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_INVERTED_COLORS");
  });

  it("con formato gif los colores se ignoran: 200 con advertencia", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/validate", {
      content: { type: "text", text: "hola" },
      options: { ...SVG_OPTIONS, format: "gif", foreground: "#FFFFFF", background: "#000000" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { warnings: string[] };
    expect(body.warnings.some((w) => w.includes("SVG"))).toBe(true);
  });

  it("responde 400 con body vacío", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/validate", {});
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/qr/render", () => {
  it("devuelve SVG con headers correctos y sin contenido peligroso", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/render", VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/svg+xml");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="qr-code.svg"');
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    const svg = await res.text();
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('viewBox="0 0 ');
    expect(svg).toContain("#000000");
    expect(svg.toLowerCase()).not.toContain("<script");
    expect(svg.toLowerCase()).not.toContain("foreignobject");
    expect(svg.toLowerCase()).not.toContain("href=");
    expect(svg.toLowerCase()).not.toContain("onload");
  });

  it("devuelve GIF con firma GIF87a", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/render", {
      content: { type: "text", text: "hola" },
      options: { ...SVG_OPTIONS, format: "gif" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/gif");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="qr-code.gif"');
    const bytes = new Uint8Array(await res.arrayBuffer());
    const header = Array.from(bytes.slice(0, 6), (byte) => String.fromCharCode(byte)).join("");
    expect(header).toBe("GIF87a");
  });

  it("devuelve PNG desde la Fase 04 (firma \\x89PNG y headers)", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/render", {
      content: { type: "text", text: "hola" },
      options: { ...SVG_OPTIONS, format: "png", ecc: "high" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x4e);
    expect(bytes[3]).toBe(0x47);
  });

  it("responde 422 con contraste insuficiente", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/render", {
      content: { type: "text", text: "hola" },
      options: { ...SVG_OPTIONS, foreground: "#808080" },
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_CONTRAST_TOO_LOW");
  });

  it("responde 422 con overflow en render", async () => {
    const { baseUrl } = await startTestServer();
    const res = await post(baseUrl, "/api/v1/qr/render", {
      content: { type: "url", url: `https://example.com/${"x".repeat(1800)}` },
      options: { ...SVG_OPTIONS, ecc: "high" },
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("QR_PAYLOAD_TOO_LARGE");
  });
});
