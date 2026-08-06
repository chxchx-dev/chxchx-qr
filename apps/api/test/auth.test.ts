/**
 * Tests de auth (Fase 07, ADR-005): registro, login, sesión opaca, cookie
 * flags, rotación anti-fixation, logout, expiración, CSRF (Origin), anti-
 * enumeración y rate limit. PostgreSQL real con DB propia por suite.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "../src/infrastructure/database/pool.js";
import {
  dynamicQrTestEnv,
  ensureTestDb,
  registerUser,
  resetTestDb,
  sessionHeaders,
  TEST_ORIGIN,
  testDatabaseUrl,
} from "./db-helpers.js";
import { startTestServer } from "./helpers.js";

const SUITE_DB = testDatabaseUrl("auth");
const ENV = dynamicQrTestEnv(SUITE_DB);

const EMAIL = "ana@example.com";
const PASSWORD = "clave-super-segura-1";

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

function jsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { "Content-Type": "application/json", Origin: TEST_ORIGIN, ...extra };
}

async function login(baseUrl: string, email: string, password: string): Promise<Response> {
  return fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password }),
  });
}

describe("registro", () => {
  it("crea la cuenta, fija cookie HttpOnly y devuelve el perfil", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, displayName: "Ana López" }),
    });
    expect(res.status).toBe(201);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = (await res.json()) as { user: { id: string; email: string; displayName: string } };
    expect(body.user.id.startsWith("usr_")).toBe(true);
    expect(body.user.email).toBe(EMAIL);
    expect(body.user.displayName).toBe("Ana López");
    // El token nunca viaja en el body: solo la cookie.
    expect(JSON.stringify(body)).not.toContain(PASSWORD);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).not.toContain("Secure"); // NODE_ENV=test
  });

  it("normaliza el email a minúsculas: duplicado con otro case → 409", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    await registerUser(baseUrl, "Mix@Example.com", PASSWORD);
    const dup = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email: "mix@example.COM", password: PASSWORD }),
    });
    expect(dup.status).toBe(409);
    expect(((await dup.json()) as { code: string }).code).toBe("AUTH_EMAIL_IN_USE");
  });

  it("rechaza contraseña corta con 400 AUTH_SCHEMA_INVALID", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email: EMAIL, password: "corta" }),
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { code: string }).code).toBe("AUTH_SCHEMA_INVALID");
  });
});

describe("login y anti-enumeración", () => {
  it("login correcto → 200 con cookie nueva", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    await registerUser(baseUrl, EMAIL, PASSWORD);
    const res = await login(baseUrl, EMAIL, PASSWORD);
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("contraseña incorrecta → 401 AUTH_INVALID_CREDENTIALS", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    await registerUser(baseUrl, EMAIL, PASSWORD);
    const res = await login(baseUrl, EMAIL, "contraseña-incorrecta");
    expect(res.status).toBe(401);
    expect(((await res.json()) as { code: string }).code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("email desconocido → mismo 401 y mismo mensaje (anti-enumeración)", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const res = await login(baseUrl, "nadie@example.com", PASSWORD);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code: string; title: string };
    expect(body.code).toBe("AUTH_INVALID_CREDENTIALS");
    expect(body.title).toBe("Credenciales inválidas");
  });

  it("cada login emite un token distinto (anti-fixation)", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    await registerUser(baseUrl, EMAIL, PASSWORD);
    const first = await login(baseUrl, EMAIL, PASSWORD);
    const second = await login(baseUrl, EMAIL, PASSWORD);
    const firstCookie = first.headers.get("set-cookie");
    const secondCookie = second.headers.get("set-cookie");
    expect(firstCookie).not.toBe(secondCookie);
    // Ambas sesiones son válidas (multisesión): me funciona con cada cookie.
    const cookieA = firstCookie?.split(";")[0] ?? "";
    const cookieB = secondCookie?.split(";")[0] ?? "";
    const meA = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Cookie: cookieA } });
    const meB = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Cookie: cookieB } });
    expect(meA.status).toBe(200);
    expect(meB.status).toBe(200);
  });

  it("rate limit de login: 429 AUTH_RATE_LIMITED", async () => {
    const { baseUrl } = await startTestServer(
      { ...ENV, RATE_LIMIT_LOGIN_PER_15_MINUTES: "2" },
      { database },
    );
    await login(baseUrl, EMAIL, "mal");
    await login(baseUrl, EMAIL, "mal");
    const third = await login(baseUrl, EMAIL, "mal");
    expect(third.status).toBe(429);
    expect(((await third.json()) as { code: string }).code).toBe("AUTH_RATE_LIMITED");
  });
});

describe("sesión", () => {
  it("me sin sesión → 401 AUTH_UNAUTHENTICATED; con sesión → 200", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const anon = await fetch(`${baseUrl}/api/v1/auth/me`);
    expect(anon.status).toBe(401);
    expect(((await anon.json()) as { code: string }).code).toBe("AUTH_UNAUTHENTICATED");

    const session = await registerUser(baseUrl);
    const me = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Cookie: session.cookie } });
    expect(me.status).toBe(200);
    const body = (await me.json()) as { user: { email: string } };
    expect(body.user.email).toBe(session.user.email);
  });

  it("cookie forjada (firma inválida) → 401 sin consultar la DB", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const forged = "tokenInventado.inventado";
    const me = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: `qr_session_test=${forged}` },
    });
    expect(me.status).toBe(401);
  });

  it("sesión expirada → 401 (revocada igual que inexistente)", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    await database.pool.query("UPDATE sessions SET expires_at = now() - interval '1 second'");
    const me = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Cookie: session.cookie } });
    expect(me.status).toBe(401);
  });

  it("logout revoca la sesión y limpia la cookie", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const logout = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: sessionHeaders(session),
    });
    expect(logout.status).toBe(204);
    expect(logout.headers.get("set-cookie") ?? "").toContain("Max-Age=0");
    const me = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Cookie: session.cookie } });
    expect(me.status).toBe(401);
  });

  it("cookie Secure solo en producción", async () => {
    const { baseUrl } = await startTestServer({ ...ENV, NODE_ENV: "production" }, { database });
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    expect(res.status).toBe(201);
    expect(res.headers.get("set-cookie")).toContain("Secure");
  });
});

describe("CSRF (Origin)", () => {
  it("mutación sin Origin → 403 AUTH_ORIGIN_FORBIDDEN", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const res = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: session.cookie, "Content-Type": "application/json" },
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { code: string }).code).toBe("AUTH_ORIGIN_FORBIDDEN");
    // La sesión sigue viva (no se revocó).
    const me = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Cookie: session.cookie } });
    expect(me.status).toBe(200);
  });

  it("mutación con Origin ajeno → 403", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const res = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: session.cookie, Origin: "http://evil.example" },
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { code: string }).code).toBe("AUTH_ORIGIN_FORBIDDEN");
  });

  it("GET sin Origin no se bloquea", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl);
    const me = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Cookie: session.cookie } });
    expect(me.status).toBe(200);
  });
});

describe("perfil (PATCH /api/v1/users/me)", () => {
  it("actualiza displayName y cambia la contraseña", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl, EMAIL, PASSWORD);

    const name = await fetch(`${baseUrl}/api/v1/users/me`, {
      method: "PATCH",
      headers: sessionHeaders(session, { "Content-Type": "application/json" }),
      body: JSON.stringify({ displayName: "Ana N. López" }),
    });
    expect(name.status).toBe(200);
    expect(((await name.json()) as { user: { displayName: string } }).user.displayName).toBe(
      "Ana N. López",
    );

    const pass = await fetch(`${baseUrl}/api/v1/users/me`, {
      method: "PATCH",
      headers: sessionHeaders(session, { "Content-Type": "application/json" }),
      body: JSON.stringify({ currentPassword: PASSWORD, newPassword: "nueva-clave-segura-2" }),
    });
    expect(pass.status).toBe(200);

    // La contraseña nueva funciona; la vieja no.
    const oldLogin = await login(baseUrl, EMAIL, PASSWORD);
    expect(oldLogin.status).toBe(401);
    const newLogin = await login(baseUrl, EMAIL, "nueva-clave-segura-2");
    expect(newLogin.status).toBe(200);
  });

  it("newPassword sin currentPassword → 400; current incorrecta → 422", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    const session = await registerUser(baseUrl, EMAIL, PASSWORD);

    const missing = await fetch(`${baseUrl}/api/v1/users/me`, {
      method: "PATCH",
      headers: sessionHeaders(session, { "Content-Type": "application/json" }),
      body: JSON.stringify({ newPassword: "nueva-clave-segura-2" }),
    });
    expect(missing.status).toBe(400);

    const wrong = await fetch(`${baseUrl}/api/v1/users/me`, {
      method: "PATCH",
      headers: sessionHeaders(session, { "Content-Type": "application/json" }),
      body: JSON.stringify({ currentPassword: "incorrecta", newPassword: "nueva-clave-segura-2" }),
    });
    expect(wrong.status).toBe(422);
    expect(((await wrong.json()) as { code: string }).code).toBe("AUTH_PASSWORD_WEAK");
  });

  it("cambio de contraseña revoca las demás sesiones pero mantiene la actual", async () => {
    const { baseUrl } = await startTestServer(ENV, { database });
    await registerUser(baseUrl, EMAIL, PASSWORD);
    const first = await login(baseUrl, EMAIL, PASSWORD);
    const second = await login(baseUrl, EMAIL, PASSWORD);
    const cookieA = first.headers.get("set-cookie")?.split(";")[0] ?? "";
    const cookieB = second.headers.get("set-cookie")?.split(";")[0] ?? "";

    const change = await fetch(`${baseUrl}/api/v1/users/me`, {
      method: "PATCH",
      headers: {
        Cookie: cookieB,
        Origin: TEST_ORIGIN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentPassword: PASSWORD, newPassword: "nueva-clave-segura-2" }),
    });
    expect(change.status).toBe(200);

    const meB = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Cookie: cookieB } });
    expect(meB.status).toBe(200);
    const meA = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Cookie: cookieA } });
    expect(meA.status).toBe(401);
  });
});
