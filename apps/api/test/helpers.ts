import { once } from "node:events";
import type { Server } from "node:http";
import { apiConfig } from "@acore/config";
import { afterEach } from "vitest";
import { type AppDeps, createApp } from "../src/app.js";

const openServers: Server[] = [];

export async function startTestServer(
  env: Record<string, string> = {},
  deps: AppDeps = {},
): Promise<{
  baseUrl: string;
}> {
  const config = apiConfig({ NODE_ENV: "test", PORT: "0", ...env });
  const app = createApp(config, deps);
  const server = app.listen(0);
  openServers.push(server);
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("El servidor no expone una dirección TCP válida");
  }
  return { baseUrl: `http://127.0.0.1:${address.port}` };
}

export async function postJson(
  baseUrl: string,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

/** Sube un archivo de logo (multipart, campo "logo"). */
export async function uploadLogo(
  baseUrl: string,
  bytes: Uint8Array,
  filename = "logo.png",
  mimetype = "image/png",
): Promise<Response> {
  const form = new FormData();
  form.append("logo", new Blob([bytes], { type: mimetype }), filename);
  return fetch(`${baseUrl}/api/v1/qr/logo`, { method: "POST", body: form });
}

/** Sube un archivo general (multipart, campo "file") a /api/v1/files. */
export async function uploadFile(
  baseUrl: string,
  bytes: Uint8Array,
  filename: string,
  mimetype: string,
): Promise<Response> {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimetype }), filename);
  return fetch(`${baseUrl}/api/v1/files`, { method: "POST", body: form });
}

export function parsePngHeader(bytes: Uint8Array): {
  signatureOk: boolean;
  width: number;
  height: number;
} {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const signatureOk = signature.every((byte, index) => bytes[index] === byte);
  // IHDR: length(4) + "IHDR"(4) + width(4 BE) + height(4 BE)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return { signatureOk, width, height };
}

afterEach(() => {
  while (openServers.length > 0) {
    const server = openServers.pop();
    if (server?.listening) {
      server.close();
    }
  }
});
