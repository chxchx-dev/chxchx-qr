import { once } from "node:events";
import type { Server } from "node:http";
import { apiConfig } from "@acore/config";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const openServers: Server[] = [];

function startTestServer(): Promise<{ server: Server; baseUrl: string }> {
  const config = apiConfig({ NODE_ENV: "test", PORT: "0" });
  const app = createApp(config);
  const server = app.listen(0, "127.0.0.1");
  openServers.push(server);
  return once(server, "listening").then(() => {
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("El servidor no expone una dirección TCP válida");
    }
    return { server, baseUrl: `http://127.0.0.1:${address.port}` };
  });
}

afterEach(() => {
  while (openServers.length > 0) {
    const server = openServers.pop();
    if (server?.listening) {
      server.close();
    }
  }
});

describe("health", () => {
  it("GET /health/live responde 200 con estado ok", async () => {
    const { baseUrl } = await startTestServer();
    const res = await fetch(`${baseUrl}/health/live`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; service: string; version: string };
    expect(body.status).toBe("ok");
    expect(body.service).toBe("qr-api");
    expect(typeof body.version).toBe("string");
  });

  it("GET /health/ready responde 200 con el motor QR disponible", async () => {
    const { baseUrl } = await startTestServer();
    const res = await fetch(`${baseUrl}/health/ready`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; checks: { qrEngine: string } };
    expect(body.status).toBe("ready");
    expect(body.checks.qrEngine).toBe("ok");
  });

  it("todas las respuestas incluyen X-Request-Id", async () => {
    const { baseUrl } = await startTestServer();
    const res = await fetch(`${baseUrl}/health/live`);
    const requestId = res.headers.get("x-request-id");
    expect(requestId).toBeTruthy();
  });
});

describe("errores", () => {
  it("responde 404 Problem Details con request ID para rutas desconocidas", async () => {
    const { baseUrl } = await startTestServer();
    const res = await fetch(`${baseUrl}/no-existe`);
    expect(res.status).toBe(404);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    const body = (await res.json()) as { status: number; code: string };
    expect(body.status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
  });

  it("devuelve 400 Problem Details con JSON malformado", async () => {
    const { baseUrl } = await startTestServer();
    const res = await fetch(`${baseUrl}/health/live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{no-es-json",
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { status: number; code: string };
    expect(body.status).toBe(400);
    expect(body.code).toBe("BAD_REQUEST");
  });
});

describe("shutdown", () => {
  it("cierra el servidor limpiamente sin error", async () => {
    const { server } = await startTestServer();
    const closed = new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    await expect(closed).resolves.toBeUndefined();
  });
});
