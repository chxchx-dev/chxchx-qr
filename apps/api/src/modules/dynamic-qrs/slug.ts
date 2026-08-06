/**
 * Slugs de QR dinámicos (docs/06 §7): criptográficos, sin caracteres ambiguos,
 * no secuenciales, con palabras reservadas y longitud configurable. El usuario
 * nunca elige el slug en MVP.
 */
import { randomInt } from "node:crypto";

/** 58 caracteres sin ambiguos (se excluyen 0/O/1/l/I). */
const SLUG_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** Rutas internas reservadas (por si un slug colisionara con ellas). */
export const RESERVED_SLUGS = new Set(["api", "health", "f", "r", "assets", "favicon.ico"]);

export function generateSlug(length: number): string {
  let slug = "";
  for (let index = 0; index < length; index++) {
    slug += SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)];
  }
  return slug;
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/** Entropía del alfabeto (bits por carácter), útil en tests y docs. */
export const SLUG_ENTROPY_PER_CHAR = Math.log2(SLUG_ALPHABET.length);
