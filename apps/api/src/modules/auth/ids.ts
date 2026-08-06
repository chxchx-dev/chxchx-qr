/** Helpers de ids opacos y hashes del módulo auth (docs/06 §2). */
import { createHash, randomUUID } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Id externo de usuario (usr_<uuid>); nunca una secuencia. */
export function newUserId(): string {
  return `usr_${randomUUID()}`;
}

/** Id externo de sesión (ses_<uuid>). */
export function newSessionId(): string {
  return `ses_${randomUUID()}`;
}
