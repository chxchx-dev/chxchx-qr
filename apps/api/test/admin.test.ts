/**
 * Tests de administración (Fase 08) contra PostgreSQL real: reporte público de
 * abuso (con rate limit), rol admin (403 sin rol), bloqueo/desbloqueo de QR y
 * usuarios con auditoría, y moderación de la cola de reportes.
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

const SUITE_DB = testDatabaseUrl("admin");
const ENV = dynamicQrTestEnv(SUITE_DB);

const REASON = "El destino muestra contenido engañoso o phishing";

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
    body: JSON.stringify({ name: "Admin QR", destinationUrl: "https://example.com/a" }),
  });
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; slug: string };
}

/** Promueve a un usuario a admin directamente en la DB (bootstrap por SQL manual). */
async function promoteAdmin(userId: string): Promise<void> {
  await database.pool.query("INSERT INTO admin_roles (user_id, created_by) VALUES ($1, 'test')", [
    userId,
  ]);
}

describe("reporte público de abuso", () => {
  it("reporta un QR por slug sin sesión → 201 y queda en la cola", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const owner = await registerUser(baseUrl);
    const { slug } = await createOne(baseUrl, owner);

    const res = await fetch(`${baseUrl}/api/v1/abuse-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, reason: REASON }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; slug: string; status: string };
    expect(body.slug).toBe(slug);
    expect(body.status).toBe("open");

    const rows = await database.pool.query<{ reporter_ip_hash: string | null }>(
      "SELECT reporter_ip_hash FROM abuse_reports WHERE id = $1",
      [body.id],
    );
    // La IP se persiste hasheada, nunca completa.
    expect(rows.rows[0]?.reporter_ip_hash).not.toBeNull();
    expect(rows.rows[0]?.reporter_ip_hash).not.toContain("127.0.0.1");
  });

  it("slug inexistente → 404; motivo corto → 400", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const missing = await fetch(`${baseUrl}/api/v1/abuse-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "noExiste12", reason: REASON }),
    });
    expect(missing.status).toBe(404);
    expect(((await missing.json()) as { code: string }).code).toBe("ADM_NOT_FOUND");

    const short = await fetch(`${baseUrl}/api/v1/abuse-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "noExiste12", reason: "corto" }),
    });
    expect(short.status).toBe(400);
    expect(((await short.json()) as { code: string }).code).toBe("ABUSE_SCHEMA_INVALID");
  });

  it("rate limit propio por IP → 429 ABUSE_RATE_LIMITED", async () => {
    const { baseUrl } = await startTestServer(
      { ...ENV, RATE_LIMIT_ABUSE_REPORT_PER_HOUR: "2" },
      { database },
    );
    const owner = await registerUser(baseUrl);
    const { slug } = await createOne(baseUrl, owner);

    const report = (): Promise<Response> =>
      fetch(`${baseUrl}/api/v1/abuse-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, reason: REASON }),
      });

    expect((await report()).status).toBe(201);
    expect((await report()).status).toBe(201);
    const third = await report();
    expect(third.status).toBe(429);
    expect(((await third.json()) as { code: string }).code).toBe("ABUSE_RATE_LIMITED");
  });
});

describe("rol admin y moderación", () => {
  it("un usuario sin rol recibe 403 ADM_FORBIDDEN", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const user = await registerUser(baseUrl);
    const res = await fetch(`${baseUrl}/api/v1/admin/abuse-reports`, {
      headers: sessionHeaders(user),
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { code: string }).code).toBe("ADM_FORBIDDEN");
  });

  it("el admin ve la cola, bloquea el QR (redirect 404) y lo desbloquea", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const owner = await registerUser(baseUrl);
    const admin = await registerUser(baseUrl);
    await promoteAdmin(admin.user.id);
    const { id, slug } = await createOne(baseUrl, owner);

    // Cola con el reporte.
    await fetch(`${baseUrl}/api/v1/abuse-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, reason: REASON }),
    });
    const queue = await fetch(`${baseUrl}/api/v1/admin/abuse-reports`, {
      headers: sessionHeaders(admin),
    });
    expect(queue.status).toBe(200);
    expect(((await queue.json()) as { total: number }).total).toBe(1);

    // Bloqueo: el QR deja de redirigir y el owner ve el estado bloqueado.
    const block = await fetch(`${baseUrl}/api/v1/admin/qrs/${id}/block`, {
      method: "POST",
      headers: sessionHeaders(admin, { "Content-Type": "application/json" }),
      body: JSON.stringify({ reason: "Abuso confirmado" }),
    });
    expect(block.status).toBe(204);

    const redirect = await fetch(`${baseUrl}/r/${slug}`, { redirect: "manual" });
    expect(redirect.status).toBe(404);
    const owned = await fetch(`${baseUrl}/api/v1/dynamic-qrs/${id}`, {
      headers: sessionHeaders(owner),
    });
    expect(((await owned.json()) as { status: string }).status).toBe("blocked");

    // Auditoría con actor admin y motivo.
    const audit = await database.pool.query<{ actor_user_id: string }>(
      `SELECT actor_user_id FROM audit_events WHERE action = 'admin.block_qr' AND resource_id = $1`,
      [id],
    );
    expect(audit.rows[0]?.actor_user_id).toBe(admin.user.id);

    // Desbloqueo: vuelve a redirigir.
    const unblock = await fetch(`${baseUrl}/api/v1/admin/qrs/${id}/unblock`, {
      method: "POST",
      headers: sessionHeaders(admin, { "Content-Type": "application/json" }),
      body: JSON.stringify({ reason: "Falso positivo" }),
    });
    expect(unblock.status).toBe(204);
    expect((await fetch(`${baseUrl}/r/${slug}`, { redirect: "manual" })).status).toBe(302);
  });

  it("bloquear un usuario revoca sus sesiones (me → 401) y bloquea su login", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const admin = await registerUser(baseUrl);
    const victim = await registerUser(baseUrl);
    await promoteAdmin(admin.user.id);

    const block = await fetch(`${baseUrl}/api/v1/admin/users/${victim.user.id}/block`, {
      method: "POST",
      headers: sessionHeaders(admin, { "Content-Type": "application/json" }),
      body: JSON.stringify({ reason: "Spam masivo" }),
    });
    expect(block.status).toBe(204);

    const me = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: sessionHeaders(victim) });
    expect(me.status).toBe(401);

    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
      body: JSON.stringify({ email: victim.user.email, password: "clave-segura-123456" }),
    });
    expect(login.status).toBe(401);
    expect(((await login.json()) as { code: string }).code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("resolve/dismiss de la cola queda auditado y visible", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const owner = await registerUser(baseUrl);
    const admin = await registerUser(baseUrl);
    await promoteAdmin(admin.user.id);
    const { slug } = await createOne(baseUrl, owner);

    const created = await fetch(`${baseUrl}/api/v1/abuse-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, reason: REASON }),
    });
    const reportId = ((await created.json()) as { id: string }).id;

    const resolve = await fetch(`${baseUrl}/api/v1/admin/abuse-reports/${reportId}/resolve`, {
      method: "POST",
      headers: sessionHeaders(admin),
    });
    expect(resolve.status).toBe(204);

    const queue = await fetch(`${baseUrl}/api/v1/admin/abuse-reports?status=resolved`, {
      headers: sessionHeaders(admin),
    });
    expect(((await queue.json()) as { total: number }).total).toBe(1);
    const audit = await database.pool.query(
      "SELECT 1 FROM audit_events WHERE action = 'admin.resolve_report' AND resource_id = $1",
      [reportId],
    );
    expect(audit.rowCount ?? 0).toBe(1);
  });
});
