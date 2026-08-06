/**
 * Helpers de tests con PostgreSQL real (Fase 06 + 07): cada suite usa su propia
 * DB (`acore_qr_test_<suite>`) para poder correr en paralelo sin pisarse. La DB
 * se crea si no existe, se migra con el mismo runner de producción y se limpia
 * entre tests. Desde la Fase 07 la auth es por sesión (cookie), no Bearer.
 */

import type { ApiConfig } from "@acore/config";
import { Client, Pool } from "pg";
import { runMigrations } from "../src/infrastructure/database/migrate.js";
import { createDatabase, type Database } from "../src/infrastructure/database/pool.js";

/** Secreto de sesión usado en los tests (env común de los suites de Fase 07). */
export const TEST_SESSION_SECRET = "test-session-secret-0123456789abcdef-0123456789abcdef";

/** Origin por defecto de la web (WEB_ORIGIN default de la config). */
export const TEST_ORIGIN = "http://localhost:5173";

/** Config de entorno para arrancar el server de test con QR dinámicos. */
export function dynamicQrTestEnv(databaseUrl: string): Record<string, string> {
  return {
    DYNAMIC_QR_ENABLED: "true",
    DATABASE_URL: databaseUrl,
    SESSION_SECRET_CURRENT: TEST_SESSION_SECRET,
    SESSION_COOKIE_NAME: "qr_session_test",
    SHORT_DOMAIN: "http://127.0.0.1:4000",
    DYNAMIC_SLUG_LENGTH: "10",
    // 0 = sin cache de redirect (tests deterministas); límites altos.
    REDIRECT_CACHE_TTL_SECONDS: "0",
    RATE_LIMIT_DQR_CREATE_PER_MINUTE: "1000",
    RATE_LIMIT_DQR_READ_PER_MINUTE: "1000",
    RATE_LIMIT_REDIRECT_PER_MINUTE: "1000",
    RATE_LIMIT_LOGIN_PER_15_MINUTES: "1000",
  };
}

/** DB de test por defecto (sobrescribible vía DATABASE_URL_TEST). */
export function testDatabaseUrl(suite: string): string {
  return process.env.DATABASE_URL_TEST ?? `postgres://localhost:5432/acore_qr_test_${suite}`;
}

function adminUrl(target: string): string {
  const parsed = new URL(target);
  parsed.pathname = "/postgres";
  return parsed.toString();
}

function databaseName(target: string): string {
  const parsed = new URL(target);
  return parsed.pathname.replace(/^\//, "");
}

/**
 * Asegura que la DB de test existe y aplica las migraciones de producción.
 * Lanza con instrucciones claras si PostgreSQL no está disponible.
 */
export async function ensureTestDb(target: string): Promise<Database> {
  const admin = new Client({ connectionString: adminUrl(target) });
  try {
    await admin.connect();
    const name = databaseName(target);
    const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if ((exists.rowCount ?? 0) === 0) {
      await admin.query(`CREATE DATABASE "${name}"`);
    }
  } catch (error) {
    throw new Error(
      `PostgreSQL no está disponible para los tests de QR dinámicos (${target}). ` +
        "Arranca Postgres, p. ej.: brew services start postgresql@14. " +
        `Causa: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    await admin.end().catch(() => undefined);
  }

  const database = createDatabase({
    DATABASE_URL: target,
    DATABASE_POOL_MIN: 1,
    DATABASE_POOL_MAX: 2,
    DATABASE_SSL: false,
    DATABASE_STATEMENT_TIMEOUT_MS: 5000,
  } as Partial<ApiConfig> as ApiConfig);
  await runMigrations(database.pool, { direction: "up" });
  return database;
}

/** Vacía las tablas entre tests (CASCADE cubre las FKs de users). */
export async function resetTestDb(database: Database): Promise<void> {
  await database.pool.query(
    "TRUNCATE users, sessions, dynamic_qrs, idempotency_keys, audit_events CASCADE",
  );
}

/** Pool compartido por los tests (misma DB de test). */
export function testPool(target: string): Pool {
  return new Pool({ connectionString: target });
}

export interface TestSession {
  cookie: string;
  user: { id: string; email: string; displayName: string | null };
}

/**
 * Registra un usuario nuevo vía la API real y devuelve su cookie de sesión.
 * Cada llamada crea una cuenta distinta (email autogenerado si no se pasa).
 */
export async function registerUser(
  baseUrl: string,
  email = `user-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.dev`,
  password = "clave-segura-123456",
  displayName: string | undefined = undefined,
): Promise<TestSession> {
  const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: TEST_ORIGIN },
    body: JSON.stringify({ email, password, displayName }),
  });
  if (res.status !== 201) {
    throw new Error(`register falló (${res.status}): ${await res.text()}`);
  }
  const setCookie = res.headers.get("set-cookie");
  if (setCookie === null) {
    throw new Error("register no devolvió Set-Cookie");
  }
  const body = (await res.json()) as {
    user: { id: string; email: string; displayName: string | null };
  };
  return { cookie: setCookie.split(";")[0] ?? "", user: body.user };
}

/** Headers comunes de una petición autenticada (sesión + Origin para CSRF). */
export function sessionHeaders(
  session: TestSession,
  extra: Record<string, string> = {},
): Record<string, string> {
  return { Cookie: session.cookie, Origin: TEST_ORIGIN, ...extra };
}

export { createDatabase };
