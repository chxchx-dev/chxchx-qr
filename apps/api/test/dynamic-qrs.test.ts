/**
 * Tests de la API de QR dinámicos (Fase 06 + 07) contra PostgreSQL real: auth
 * por sesión, ownership (aislamiento A/B), idempotencia, concurrencia y
 * duplicado. Cada suite usa su propia DB de test (vitest en paralelo).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDatabase, type Database } from "../src/infrastructure/database/pool.js";
import { generateSessionToken, signSessionValue } from "../src/modules/auth/session-token.js";
import {
  dynamicQrTestEnv,
  ensureTestDb,
  registerUser,
  resetTestDb,
  sessionHeaders,
  TEST_SESSION_SECRET,
  type TestSession,
  testDatabaseUrl,
} from "./db-helpers.js";
import { startTestServer } from "./helpers.js";

const SUITE_DB = testDatabaseUrl("dqr");
const ENV = dynamicQrTestEnv(SUITE_DB);

const VALID_BODY = {
  name: "Menú principal",
  destinationUrl: "https://restaurant.example/menu",
};

let database: Database;

beforeAll(async () => {
  database = await ensureTestDb(SUITE_DB);
});

beforeEach(async () => {
  await resetTestDb(database);
});

afterAll(async () => {
  await database.close();
});

async function createOne(
  baseUrl: string,
  session: TestSession,
  body: unknown = VALID_BODY,
): Promise<{
  id: string;
  slug: string;
  status: string;
  version: number;
}> {
  const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
    method: "POST",
    headers: sessionHeaders(session, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; slug: string; status: string; version: number };
}

describe("POST /api/v1/dynamic-qrs", () => {
  it("crea un QR dinámico con slug criptográfico y shortUrl", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers: sessionHeaders(session, { "Content-Type": "application/json" }),
      body: JSON.stringify(VALID_BODY),
    });
    expect(res.status).toBe(201);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = (await res.json()) as {
      id: string;
      slug: string;
      shortUrl: string;
      name: string;
      destinationUrl: string;
      status: string;
      version: number;
      expiresAt: string | null;
      createdAt: string;
    };
    expect(body.id.startsWith("dqr_")).toBe(true);
    expect(body.slug).toMatch(/^[A-Za-z0-9]{10}$/);
    expect(body.shortUrl).toBe(`http://127.0.0.1:4000/r/${body.slug}`);
    expect(body.name).toBe("Menú principal");
    expect(body.destinationUrl).toBe("https://restaurant.example/menu");
    expect(body.status).toBe("active");
    expect(body.version).toBe(1);
    expect(body.expiresAt).toBeNull();
    expect(Number.isNaN(Date.parse(body.createdAt))).toBe(false);
  });

  it("crea en estado paused con active:false y respeta expiresAt", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const expiresAt = new Date(Date.now() + 3600_000).toISOString();
    const created = await createOne(baseUrl, session, {
      name: "Promo",
      destinationUrl: "https://example.com/promo",
      active: false,
      expiresAt,
    });
    expect(created.status).toBe("paused");
    const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}`, {
      headers: sessionHeaders(session),
    });
    const body = (await res.json()) as { expiresAt: string };
    expect(body.expiresAt).toBe(expiresAt);
  });

  it("rechaza destinos no permitidos con 400 (esquema) y expiración pasada con 422", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const badUrl = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers: sessionHeaders(session, { "Content-Type": "application/json" }),
      body: JSON.stringify({ name: "x", destinationUrl: "javascript:alert(1)" }),
    });
    expect(badUrl.status).toBe(400);
    expect(((await badUrl.json()) as { code: string }).code).toBe("DQR_SCHEMA_INVALID");

    const past = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers: sessionHeaders(session, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        name: "x",
        destinationUrl: "https://example.com",
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    });
    expect(past.status).toBe(422);
    expect(((await past.json()) as { code: string }).code).toBe("DQR_EXPIRES_IN_PAST");
  });

  it("rechaza sin sesión (401 AUTH_UNAUTHENTICATED) y con cookie forjada (401)", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const noAuth = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    expect(noAuth.status).toBe(401);
    expect(((await noAuth.json()) as { code: string }).code).toBe("AUTH_UNAUTHENTICATED");

    const forged = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: "qr_session_test=basura.basura" },
      body: JSON.stringify(VALID_BODY),
    });
    expect(forged.status).toBe(401);
  });

  it("con la feature deshabilitada la ruta no existe (404, no se expone)", async () => {
    const { baseUrl } = await startTestServer({}, { database });
    const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    expect(res.status).toBe(404);
  });

  it("protege contra inyección SQL (parámetros, no concatenación)", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const payload = { name: "x'); DROP TABLE dynamic_qrs; --", destinationUrl: "https://a.dev" };
    const created = await createOne(baseUrl, session, payload);
    expect(created.id.startsWith("dqr_")).toBe(true);
    // La tabla sigue existiendo (el CREATE no rompió nada).
    const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      headers: sessionHeaders(session),
    });
    expect(res.status).toBe(200);
  });

  it("genera slugs distintos en 10 creaciones", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const slugs = new Set<string>();
    for (let index = 0; index < 10; index += 1) {
      const created = await createOne(baseUrl, session, { ...VALID_BODY, name: `QR ${index}` });
      slugs.add(created.slug);
    }
    expect(slugs.size).toBe(10);
  });
});

describe("idempotencia (Idempotency-Key)", () => {
  it("replay con el mismo key y body devuelve el mismo recurso", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const key = "clave-idempotente-1234";
    const headers = sessionHeaders(session, {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    });
    const first = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers,
      body: JSON.stringify(VALID_BODY),
    });
    expect(first.status).toBe(201);
    const firstBody = (await first.json()) as { id: string };

    const second = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers,
      body: JSON.stringify(VALID_BODY),
    });
    expect(second.status).toBe(201);
    const secondBody = (await second.json()) as { id: string };
    expect(secondBody.id).toBe(firstBody.id);
  });

  it("misma key con body distinto → 409 DQR_IDEMPOTENCY_CONFLICT", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const key = "clave-otra-12345678";
    const headers = sessionHeaders(session, {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    });
    const first = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers,
      body: JSON.stringify(VALID_BODY),
    });
    expect(first.status).toBe(201);

    const conflict = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...VALID_BODY, name: "otro nombre" }),
    });
    expect(conflict.status).toBe(409);
    expect(((await conflict.json()) as { code: string }).code).toBe("DQR_IDEMPOTENCY_CONFLICT");
  });

  it("la misma key en usuarios distintos no colisiona", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const sessionA = await registerUser(baseUrl);
    const sessionB = await registerUser(baseUrl);
    const key = "clave-compartida-0001";
    const headersA = sessionHeaders(sessionA, {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    });
    const headersB = sessionHeaders(sessionB, {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    });
    const first = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify(VALID_BODY),
    });
    const second = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers: headersB,
      body: JSON.stringify(VALID_BODY),
    });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const idA = ((await first.json()) as { id: string }).id;
    const idB = ((await second.json()) as { id: string }).id;
    expect(idA).not.toBe(idB);
  });
});

describe("listado y detalle", () => {
  it("lista con paginación, búsqueda y filtro por estado", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    await createOne(baseUrl, session, { ...VALID_BODY, name: "Menú verano" });
    await createOne(baseUrl, session, { ...VALID_BODY, name: "Promo invierno", active: false });

    const all = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      headers: sessionHeaders(session),
    });
    const allBody = (await all.json()) as {
      total: number;
      page: number;
      pageSize: number;
      items: unknown[];
    };
    expect(allBody.total).toBe(2);
    expect(allBody.page).toBe(1);
    expect(allBody.pageSize).toBe(20);

    const searched = await fetch(`${baseUrl}/api/v1/dynamic-qrs?search=verano`, {
      headers: sessionHeaders(session),
    });
    expect(((await searched.json()) as { total: number }).total).toBe(1);

    const paused = await fetch(`${baseUrl}/api/v1/dynamic-qrs?status=paused`, {
      headers: sessionHeaders(session),
    });
    expect(((await paused.json()) as { total: number }).total).toBe(1);

    const page = await fetch(`${baseUrl}/api/v1/dynamic-qrs?page=2&pageSize=1`, {
      headers: sessionHeaders(session),
    });
    const pageBody = (await page.json()) as { total: number; items: unknown[] };
    expect(pageBody.total).toBe(2);
    expect(pageBody.items.length).toBe(1);
  });

  it("GET /:id devuelve 200 o 404", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const created = await createOne(baseUrl, session);
    const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}`, {
      headers: sessionHeaders(session),
    });
    expect(res.status).toBe(200);
    const missing = await fetch(`${baseUrl}/api/v1/dynamic-qrs/dqr_no_existe_000`, {
      headers: sessionHeaders(session),
    });
    expect(missing.status).toBe(404);
    expect(((await missing.json()) as { code: string }).code).toBe("DQR_NOT_FOUND");
  });
});

describe("PATCH (If-Match / ETag) y DELETE", () => {
  it("actualiza destino con versión, sube la versión y responde ETag", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const created = await createOne(baseUrl, session);

    const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}`, {
      method: "PATCH",
      headers: sessionHeaders(session, { "Content-Type": "application/json", "If-Match": "v1" }),
      body: JSON.stringify({ destinationUrl: "https://restaurant.example/menu-agosto" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("ETag")).toBe('"v2"');
    const body = (await res.json()) as { version: number; destinationUrl: string };
    expect(body.version).toBe(2);
    expect(body.destinationUrl).toBe("https://restaurant.example/menu-agosto");
  });

  it("rechaza versión obsoleta (409) y exige If-Match (428)", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const created = await createOne(baseUrl, session);

    const stale = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}`, {
      method: "PATCH",
      headers: sessionHeaders(session, { "Content-Type": "application/json", "If-Match": "v1" }),
      body: JSON.stringify({ name: "a" }),
    });
    expect(stale.status).toBe(200);
    const staleAgain = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}`, {
      method: "PATCH",
      headers: sessionHeaders(session, { "Content-Type": "application/json", "If-Match": "v1" }),
      body: JSON.stringify({ name: "b" }),
    });
    expect(staleAgain.status).toBe(409);
    expect(((await staleAgain.json()) as { code: string }).code).toBe("DQR_VERSION_CONFLICT");

    const noMatch = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}`, {
      method: "PATCH",
      headers: sessionHeaders(session, { "Content-Type": "application/json" }),
      body: JSON.stringify({ name: "c" }),
    });
    expect(noMatch.status).toBe(428);
    expect(((await noMatch.json()) as { code: string }).code).toBe("DQR_VERSION_REQUIRED");
  });

  it("DELETE borra de forma suave: 204 y después 404 en GET y redirect", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const created = await createOne(baseUrl, session);
    const del = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}`, {
      method: "DELETE",
      headers: sessionHeaders(session),
    });
    expect(del.status).toBe(204);
    const get = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}`, {
      headers: sessionHeaders(session),
    });
    expect(get.status).toBe(404);
    const redirect = await fetch(`${baseUrl}/r/${created.slug}`, { redirect: "manual" });
    expect(redirect.status).toBe(404);
  });
});

describe("ownership y aislamiento (usuario A no ve a B)", () => {
  it("B no ve, no lee, no edita, no borra ni duplica los QRs de A (404)", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const sessionA = await registerUser(baseUrl);
    const sessionB = await registerUser(baseUrl);
    const created = await createOne(baseUrl, sessionA);

    // El listado de B no incluye el QR de A.
    const list = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      headers: sessionHeaders(sessionB),
    });
    expect(((await list.json()) as { total: number }).total).toBe(0);

    const paths: Array<[string, string, Record<string, string>]> = [
      ["GET", `/api/v1/dynamic-qrs/${created.id}`, {}],
      ["PATCH", `/api/v1/dynamic-qrs/${created.id}`, { "If-Match": "v1" }],
      ["DELETE", `/api/v1/dynamic-qrs/${created.id}`, {}],
      ["POST", `/api/v1/dynamic-qrs/${created.id}/duplicate`, {}],
    ];
    for (const [method, path, extra] of paths) {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: sessionHeaders(sessionB, {
          ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
          ...extra,
        }),
        ...(method === "PATCH" ? { body: JSON.stringify({ name: "intruso" }) } : {}),
      });
      expect(res.status, `${method} ${path} desde B`).toBe(404);
    }

    // El QR de A sigue intacto para A.
    const mine = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}`, {
      headers: sessionHeaders(sessionA),
    });
    expect(mine.status).toBe(200);
  });

  it("dos usuarios conviven en el mismo listado scoped", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const sessionA = await registerUser(baseUrl);
    const sessionB = await registerUser(baseUrl);
    await createOne(baseUrl, sessionA, { ...VALID_BODY, name: "de A" });
    await createOne(baseUrl, sessionB, { ...VALID_BODY, name: "de B" });

    const listA = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      headers: sessionHeaders(sessionA),
    });
    const listB = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      headers: sessionHeaders(sessionB),
    });
    const namesA = ((await listA.json()) as { items: Array<{ name: string }> }).items.map(
      (item) => item.name,
    );
    const namesB = ((await listB.json()) as { items: Array<{ name: string }> }).items.map(
      (item) => item.name,
    );
    expect(namesA).toEqual(["de A"]);
    expect(namesB).toEqual(["de B"]);
  });
});

describe("duplicado", () => {
  it("duplica el QR con slug nuevo, nombre '(copia)' y estado coherente", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const created = await createOne(baseUrl, session, {
      ...VALID_BODY,
      active: false,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });

    const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}/duplicate`, {
      method: "POST",
      headers: sessionHeaders(session),
    });
    expect(res.status).toBe(201);
    const copy = (await res.json()) as {
      id: string;
      slug: string;
      name: string;
      status: string;
      version: number;
      destinationUrl: string;
      expiresAt: string;
    };
    expect(copy.id).not.toBe(created.id);
    expect(copy.slug).not.toBe(created.slug);
    expect(copy.name).toBe("Menú principal (copia)");
    expect(copy.status).toBe("paused");
    expect(copy.version).toBe(1);
    expect(copy.destinationUrl).toBe(VALID_BODY.destinationUrl);
    expect(copy.expiresAt).not.toBeNull();

    // El original sigue ahí.
    const original = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}`, {
      headers: sessionHeaders(session),
    });
    expect(original.status).toBe(200);
  });

  it("duplicar un QR ajeno → 404", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const sessionA = await registerUser(baseUrl);
    const sessionB = await registerUser(baseUrl);
    const created = await createOne(baseUrl, sessionA);
    const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}/duplicate`, {
      method: "POST",
      headers: sessionHeaders(sessionB),
    });
    expect(res.status).toBe(404);
  });
});

describe("concurrencia y límites", () => {
  it("8 PATCHes en paralelo con la misma versión: exactamente 1 gana", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const created = await createOne(baseUrl, session);
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        fetch(`${baseUrl}/api/v1/dynamic-qrs/${created.id}`, {
          method: "PATCH",
          headers: sessionHeaders(session, {
            "Content-Type": "application/json",
            "If-Match": "v1",
          }),
          body: JSON.stringify({ name: `intento ${index}` }),
        }),
      ),
    );
    const statuses = results.map((res) => res.status).sort();
    expect(statuses.filter((status) => status === 200).length).toBe(1);
    expect(statuses.filter((status) => status === 409).length).toBe(7);
  });

  it("limita las mutaciones (429 DQR_RATE_LIMITED)", async () => {
    const { baseUrl } = await startTestServer(
      { ...ENV, RATE_LIMIT_DQR_CREATE_PER_MINUTE: "2" },
      { database },
    );
    const session = await registerUser(baseUrl);
    await createOne(baseUrl, session);
    await createOne(baseUrl, session);
    const third = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
      method: "POST",
      headers: sessionHeaders(session, { "Content-Type": "application/json" }),
      body: JSON.stringify(VALID_BODY),
    });
    expect(third.status).toBe(429);
    expect(((await third.json()) as { code: string }).code).toBe("DQR_RATE_LIMITED");
  });

  it("DB caída → 503 DQR_DB_UNAVAILABLE", async () => {
    const broken = createDatabase({
      DATABASE_URL: "postgres://127.0.0.1:1/noexiste",
      DATABASE_POOL_MIN: 1,
      DATABASE_POOL_MAX: 1,
      DATABASE_SSL: false,
      DATABASE_STATEMENT_TIMEOUT_MS: 1000,
    } as unknown as Parameters<typeof createDatabase>[0]);
    try {
      const { baseUrl } = await startTestServer(ENV, { database: broken });
      // Cookie firmada con el secreto de test: la firma pasa (sin DB) y la
      // resolución de la sesión falla contra la DB caída → 503.
      const token = generateSessionToken();
      const forged = signSessionValue(token, TEST_SESSION_SECRET);
      const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `qr_session_test=${forged}` },
        body: JSON.stringify(VALID_BODY),
      });
      expect(res.status).toBe(503);
      expect(((await res.json()) as { code: string }).code).toBe("DQR_DB_UNAVAILABLE");
    } finally {
      await broken.close();
    }
  });
});
