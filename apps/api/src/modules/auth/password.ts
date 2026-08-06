/**
 * Contraseñas (Fase 07, docs/07 §12): scrypt de Node con salt aleatorio y
 * parámetros versionados embebidos en el propio hash.
 *
 * Formato almacenado:
 *   scrypt$N$r$p$<salt base64>$<derived key base64>
 *
 * Almacenar los parámetros permite re-hashear con parámetros nuevos sin romper
 * los hashes existentes. Nunca se registran contraseñas ni hashes.
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_BYTES = 32;

export interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

export async function hashPassword(password: string, params: ScryptParams): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password, salt, KEY_BYTES, {
    N: params.N,
    r: params.r,
    p: params.p,
  });
  return `scrypt$${params.N}$${params.r}$${params.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

/**
 * Verifica una contraseña contra un hash almacenado. Comparación timing-safe.
 * Devuelve false ante formato desconocido o error de scrypt (nunca lanza).
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }
  const N = Number.parseInt(parts[1] ?? "", 10);
  const r = Number.parseInt(parts[2] ?? "", 10);
  const p = Number.parseInt(parts[3] ?? "", 10);
  const salt = Buffer.from(parts[4] ?? "", "base64");
  const expected = Buffer.from(parts[5] ?? "", "base64");
  if (salt.length === 0 || expected.length === 0 || !(N > 0) || !(r > 0) || !(p > 0)) {
    return false;
  }
  try {
    const key = await scrypt(password, salt, expected.length, { N, r, p });
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
