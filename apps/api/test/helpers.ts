import { once } from "node:events";
import type { Server } from "node:http";
import { apiConfig } from "@chxchx/config";
import { afterEach } from "vitest";
import { createApp } from "../src/app.js";

const openServers: Server[] = [];

export async function startTestServer(env: Record<string, string> = {}): Promise<{
  baseUrl: string;
}> {
  const config = apiConfig({ NODE_ENV: "test", PORT: "0", ...env });
  const app = createApp(config);
  const server = app.listen(0, "127.0.0.1");
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
