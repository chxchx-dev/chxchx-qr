/**
 * Tests de la redirección pública (Fase 06 + 07): /r/{slug} → 302 / 200
 * pausado / 410 expirado / 404. La creación de QRs usa sesión (Fase 07); la
 * redirección en sí es pública (sin auth). Sin cache de navegador (no-cache) y
 * cache en memoria desactivada (TTL=0) para tests deterministas.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "../src/infrastructure/database/pool.js";
import {
  dynamicQrTestEnv,
  ensureTestDb,
  registerUser,
  resetTestDb,
  sessionHeaders,
  type TestSession,
  testDatabaseUrl,
} from "./db-helpers.js";
import { startTestServer } from "./helpers.js";

const SUITE_DB = testDatabaseUrl("redirect");
const ENV = dynamicQrTestEnv(SUITE_DB);

let database: Database;
let baseUrl: string;
let session: TestSession;

beforeAll(async () => {
  database = await ensureTestDb(SUITE_DB);
});

// Server por test: el afterEach de helpers.ts cierra los servers abiertos.
beforeEach(async () => {
  await resetTestDb(database);
  ({ baseUrl } = await startTestServer(ENV, { database }));
  session = await registerUser(baseUrl);
});

afterAll(async () => {
  await database.close();
});

async function create(body: Record<string, unknown>): Promise<{ id: string; slug: string }> {
  const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
    method: "POST",
    headers: sessionHeaders(session, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; slug: string };
}

describe("GET /r/:slug", () => {
  it("activo → 302 con Location, headers seguros y sin cache de navegador", async () => {
    const { slug } = await create({
      name: "Menu",
      destinationUrl: "https://restaurant.example/menu",
    });
    const res = await fetch(`${baseUrl}/r/${slug}`, { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://restaurant.example/menu");
    expect(res.headers.get("Cache-Control")).toContain("no-cache");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
  });

  it("el destino cambiado se refleja sin regenerar el QR", async () => {
    const { id, slug } = await create({
      name: "Menu",
      destinationUrl: "https://restaurant.example/menu",
    });
    const patch = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${id}`, {
      method: "PATCH",
      headers: sessionHeaders(session, {
        "Content-Type": "application/json",
        "If-Match": "v1",
      }),
      body: JSON.stringify({ destinationUrl: "https://restaurant.example/menu-agosto" }),
    });
    expect(patch.status).toBe(200);

    const res = await fetch(`${baseUrl}/r/${slug}`, { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://restaurant.example/menu-agosto");
  });

  it("pausado → 200 página segura con CSP sandbox que no revela el destino", async () => {
    const { slug } = await create({
      name: "Promo",
      destinationUrl: "https://example.com/secreto",
      active: false,
    });
    const res = await fetch(`${baseUrl}/r/${slug}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(res.headers.get("Content-Security-Policy")).toBe("sandbox");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = await res.text();
    expect(body).toContain("pausado");
    expect(body).not.toContain("example.com/secreto");
  });

  it("expirado → 410 y transición perezosa a status expired", async () => {
    const { id, slug } = await create({
      name: "Promo",
      destinationUrl: "https://example.com/promo",
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    // Se fuerza la expiración a pasado directamente en la DB (determinista).
    await database.pool.query(
      "UPDATE dynamic_qrs SET expires_at = now() - interval '1 second' WHERE id = $1",
      [id],
    );

    const res = await fetch(`${baseUrl}/r/${slug}`, { redirect: "manual" });
    expect(res.status).toBe(410);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(((await res.json()) as { code: string }).code).toBe("DQR_EXPIRED");

    // La transición perezosa dejó el estado en expired.
    const row = await database.pool.query<{ status: string }>(
      "SELECT status FROM dynamic_qrs WHERE id = $1",
      [id],
    );
    expect(row.rows[0]?.status).toBe("expired");
  });

  it("slug desconocido → 404 sin revelar nada", async () => {
    const res = await fetch(`${baseUrl}/r/slug-que-no-existe`, { redirect: "manual" });
    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(((await res.json()) as { code: string }).code).toBe("DQR_NOT_FOUND");
  });
});
