/**
 * Sesión opaca (Fase 07, ADR-005): token aleatorio de 32 bytes (256 bits); la
 * DB guarda solo sha256(token). El valor de la cookie es `token.firma` con
 * firma HMAC-SHA256 usando SESSION_SECRET_CURRENT; la verificación prueba
 * CURRENT y PREVIOUS (rotación gradual, docs/12 §12).
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_BYTES = 32;

/** Nuevo token de sesión (base64url, sin padding). */
export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Hash que se guarda en la DB (nunca el token original). */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Valor de cookie: `token.firma` (HMAC-SHA256 con el secreto activo). */
export function signSessionValue(token: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(token).digest("base64url");
  return `${token}.${signature}`;
}

/**
 * Verifica y devuelve el token si la firma es válida con alguno de los
 * secretos (current, luego previous). undefined si está forjada/dañada.
 */
export function verifySessionValue(value: string, secrets: readonly string[]): string | undefined {
  const separator = value.lastIndexOf(".");
  if (separator <= 0 || separator === value.length - 1) {
    return undefined;
  }
  const token = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (token.length === 0 || signature.length === 0) {
    return undefined;
  }
  for (const secret of secrets) {
    const expected = createHmac("sha256", secret).update(token).digest("base64url");
    if (safeEqual(signature, expected)) {
      return token;
    }
  }
  return undefined;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export interface SessionCookieOptions {
  name: string;
  value: string;
  /** Segundos de vida (Max-Age y caducidad de la sesión en la DB). */
  maxAgeSeconds: number;
  secure: boolean;
  path?: string;
}

/** Serializa la cookie de sesión: HttpOnly, SameSite=Lax, Secure en prod. */
export function serializeSessionCookie(options: SessionCookieOptions): string {
  const parts = [
    `${options.name}=${options.value}`,
    "HttpOnly",
    "SameSite=Lax",
    `Path=${options.path ?? "/"}`,
    `Max-Age=${options.maxAgeSeconds}`,
  ];
  if (options.secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/** Cookie de expiración inmediata (logout). */
export function clearSessionCookie(name: string, secure: boolean, path = "/"): string {
  const parts = [`${name}=`, "HttpOnly", "SameSite=Lax", `Path=${path}`, "Max-Age=0"];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/** Parser mínimo del header Cookie (una sola cookie por request, sin librerías). */
export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (header === undefined) {
    return cookies;
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) {
      continue;
    }
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key !== "") {
      cookies[key] = value;
    }
  }
  return cookies;
}
