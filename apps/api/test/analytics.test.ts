/**
 * Tests de analítica (Fase 08) contra PostgreSQL real: registro no-bloqueante
 * desde el redirect, privacidad (hash diario, bots separados, referrer), rango
 * y granularidad, aislamiento por owner, agregación idempotente y retención.
 */

import type { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "../src/infrastructure/database/pool.js";
import { runAggregationCycle } from "../src/modules/analytics/aggregation.job.js";
import { classifyUserAgent } from "../src/modules/analytics/bot-policy.js";
import { dailyVisitorHash } from "../src/modules/analytics/visitor-hash.js";
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

const SUITE_DB = testDatabaseUrl("analytics");
const ENV = dynamicQrTestEnv(SUITE_DB);

const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const BOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

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
): Promise<{ id: string; slug: string }> {
  const res = await fetch(`${baseUrl}/api/v1/dynamic-qrs`, {
    method: "POST",
    headers: sessionHeaders(session, { "Content-Type": "application/json" }),
    body: JSON.stringify({ name: "Analítica", destinationUrl: "https://example.com/a" }),
  });
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; slug: string };
}

async function scan(
  baseUrl: string,
  slug: string,
  headers: Record<string, string> = {},
): Promise<number> {
  const res = await fetch(`${baseUrl}/r/${slug}`, { redirect: "manual", headers });
  return res.status;
}

/** Espera (con tope) a que el recorder no-bloqueante haya insertado el evento. */
async function waitForEvent(pool: Pool, qrId: string): Promise<void> {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const result = await pool.query<{ one: number }>(
      "SELECT 1 AS one FROM scan_events WHERE qr_id = $1",
      [qrId],
    );
    if ((result.rowCount ?? 0) > 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("el evento de escaneo no se registró a tiempo");
}

async function getAnalytics(
  baseUrl: string,
  session: TestSession,
  id: string,
  query = "",
): Promise<Response> {
  return fetch(`${baseUrl}/api/v1/dynamic-qrs/${id}/analytics${query}`, {
    headers: sessionHeaders(session),
  });
}

describe("visitor-hash (privacidad)", () => {
  it("rota a diario: mismo visitante → hash distinto al día siguiente", () => {
    const secret = "secreto-hmac-de-test-0123456789abcdef";
    const day = new Date("2026-08-06T12:00:00.000Z");
    const nextDay = new Date("2026-08-07T12:00:00.000Z");
    const a = dailyVisitorHash(secret, "1.2.3.4", "Mozilla/5.0", day);
    const b = dailyVisitorHash(secret, "1.2.3.4", "Mozilla/5.0", nextDay);
    expect(a).toBeDefined();
    expect(a).not.toBe(b);
    expect(a).not.toContain("1.2.3.4");
  });

  it("mismo día e inputs → mismo hash; sin IP o sin UA → undefined", () => {
    const secret = "secreto-hmac-de-test-0123456789abcdef";
    const day = new Date("2026-08-06T12:00:00.000Z");
    expect(dailyVisitorHash(secret, "1.2.3.4", "Mozilla/5.0", day)).toBe(
      dailyVisitorHash(secret, "1.2.3.4", "Mozilla/5.0", day),
    );
    expect(dailyVisitorHash(secret, undefined, "Mozilla/5.0", day)).toBeUndefined();
    expect(dailyVisitorHash(secret, "1.2.3.4", "", day)).toBeUndefined();
  });
});

describe("bot-policy", () => {
  it("separa bots y estima la familia de dispositivo", () => {
    expect(classifyUserAgent(BOT_UA)).toEqual({ isBot: true, deviceFamily: "bot" });
    expect(classifyUserAgent(MOBILE_UA)).toEqual({ isBot: false, deviceFamily: "mobile" });
    expect(classifyUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0)")).toEqual({
      isBot: false,
      deviceFamily: "tablet",
    });
    expect(classifyUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)")).toEqual({
      isBot: false,
      deviceFamily: "desktop",
    });
    expect(classifyUserAgent(undefined)).toEqual({ isBot: false, deviceFamily: "unknown" });
  });
});

describe("registro no-bloqueante (redirect → scan_events)", () => {
  it("un redirect con UA y referrer registra el evento con familia y dominio", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const { id, slug } = await createOne(baseUrl, session);

    const status = await scan(baseUrl, slug, {
      "User-Agent": MOBILE_UA,
      Referer: "https://twitter.com/some/status",
    });
    expect(status).toBe(302);

    await waitForEvent(database.pool, id);
    const rows = await database.pool.query<{
      device_family: string;
      is_bot: boolean;
      visitor_hash: string | null;
      referrer_domain: string | null;
    }>(
      "SELECT device_family, is_bot, visitor_hash, referrer_domain FROM scan_events WHERE qr_id = $1",
      [id],
    );
    expect(rows.rows[0]?.device_family).toBe("mobile");
    expect(rows.rows[0]?.is_bot).toBe(false);
    expect(rows.rows[0]?.visitor_hash).not.toBeNull();
    expect(rows.rows[0]?.referrer_domain).toBe("twitter.com");
  });

  it("los bots se registran en familia bot sin visitor_hash", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const { id, slug } = await createOne(baseUrl, session);

    await scan(baseUrl, slug, { "User-Agent": BOT_UA });
    await waitForEvent(database.pool, id);
    const rows = await database.pool.query<{
      is_bot: boolean;
      device_family: string;
      visitor_hash: string | null;
    }>("SELECT is_bot, device_family, visitor_hash FROM scan_events WHERE qr_id = $1", [id]);
    expect(rows.rows[0]?.is_bot).toBe(true);
    expect(rows.rows[0]?.device_family).toBe("bot");
    expect(rows.rows[0]?.visitor_hash).toBeNull();
  });

  it("un fallo de analítica NO rompe la redirección", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const { slug } = await createOne(baseUrl, session);

    // Simula un problema de esquema en analítica: la tabla de eventos no existe.
    await database.pool.query("DROP TABLE scan_events");
    try {
      const status = await scan(baseUrl, slug, { "User-Agent": MOBILE_UA });
      expect(status).toBe(302);
    } finally {
      // Se restaura el esquema (la migración 0007 ya está registrada como aplicada).
      await database.pool.query(`
        CREATE TABLE scan_events (
          id text PRIMARY KEY,
          qr_id text NOT NULL REFERENCES dynamic_qrs(id) ON DELETE CASCADE,
          scanned_at timestamptz NOT NULL,
          visitor_hash text NULL,
          is_bot boolean NOT NULL DEFAULT false,
          device_family text NOT NULL,
          referrer_domain text NULL,
          country text NULL,
          request_id text NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await database.pool.query(
        "CREATE INDEX scan_events_qr_scanned ON scan_events (qr_id, scanned_at)",
      );
    }
  });
});

describe("endpoint de analítica", () => {
  it("totales, serie y dispositivos tras agregar dos escaneos", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const { id, slug } = await createOne(baseUrl, session);

    await scan(baseUrl, slug, { "User-Agent": MOBILE_UA });
    await scan(baseUrl, slug, { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)" });
    await waitForEvent(database.pool, id);
    // El primer escaneo puede no estar aún agregado; ambos eventos existen.
    await new Promise((resolve) => setTimeout(resolve, 100));

    await runAggregationCycle({ pool: database.pool, retentionDays: 90 });

    const res = await getAnalytics(baseUrl, session, id);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      totals: { scans: number; estimatedUnique: number };
      series: Array<{ bucket: string; scans: number }>;
      devices: Array<{ family: string; scans: number }>;
    };
    expect(body.totals.scans).toBe(2);
    expect(body.totals.estimatedUnique).toBe(2);
    expect(body.series.length).toBeGreaterThanOrEqual(1);
    expect(body.devices.map((device) => device.family).sort()).toEqual(["desktop", "mobile"]);
  });

  it("usuario B no ve la analítica del QR de A (404 ANL_NOT_FOUND)", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const sessionA = await registerUser(baseUrl);
    const sessionB = await registerUser(baseUrl);
    const { id } = await createOne(baseUrl, sessionA);

    const res = await getAnalytics(baseUrl, sessionB, id);
    expect(res.status).toBe(404);
    expect(((await res.json()) as { code: string }).code).toBe("ANL_NOT_FOUND");
  });

  it("rango mayor a 90 días → 422 ANL_INVALID_RANGE", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const { id } = await createOne(baseUrl, session);

    const from = new Date(Date.now() - 100 * 24 * 3600_000).toISOString();
    const res = await getAnalytics(baseUrl, session, id, `?from=${encodeURIComponent(from)}`);
    expect(res.status).toBe(422);
    expect(((await res.json()) as { code: string }).code).toBe("ANL_INVALID_RANGE");
  });

  it("granularidad horaria limitada a 48 horas → 422 fuera de ese rango", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const { id } = await createOne(baseUrl, session);

    const from = new Date(Date.now() - 60 * 3600_000).toISOString();
    const res = await getAnalytics(
      baseUrl,
      session,
      id,
      `?granularity=hour&from=${encodeURIComponent(from)}`,
    );
    expect(res.status).toBe(422);
    expect(((await res.json()) as { code: string }).code).toBe("ANL_INVALID_RANGE");

    const ok = await getAnalytics(
      baseUrl,
      session,
      id,
      `?granularity=hour&from=${encodeURIComponent(new Date(Date.now() - 3600_000).toISOString())}`,
    );
    expect(ok.status).toBe(200);
  });

  it("la agregación es idempotente: reprocesar el mismo día no duplica", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const { id, slug } = await createOne(baseUrl, session);

    await scan(baseUrl, slug, { "User-Agent": MOBILE_UA });
    await waitForEvent(database.pool, id);
    await new Promise((resolve) => setTimeout(resolve, 50));

    await runAggregationCycle({ pool: database.pool, retentionDays: 90 });
    await runAggregationCycle({ pool: database.pool, retentionDays: 90 });

    const res = await getAnalytics(baseUrl, session, id);
    expect(((await res.json()) as { totals: { scans: number } }).totals.scans).toBe(1);
  });

  it("la purga por retención borra los eventos crudos vencidos", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const { id, slug } = await createOne(baseUrl, session);

    // Evento viejo (más allá de la retención) insertado directamente.
    await database.pool.query(
      `INSERT INTO scan_events (id, qr_id, scanned_at, is_bot, device_family)
       VALUES ('scn_viejo', $1, now() - interval '30 days', false, 'mobile')`,
      [id],
    );
    await runAggregationCycle({ pool: database.pool, retentionDays: 7 });
    const rows = await database.pool.query("SELECT 1 FROM scan_events WHERE qr_id = $1", [id]);
    expect(rows.rowCount ?? 0).toBe(0);

    // El QR sigue redirigiendo normalmente.
    expect(await scan(baseUrl, slug)).toBe(302);
  });
});
