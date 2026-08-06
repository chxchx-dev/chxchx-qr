/** Helpers de ids opacos y hashes del módulo de QR dinámicos (docs/06 §2). */
import { createHash, randomUUID } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Id externo de QR dinámico (dqr_<uuid>); nunca una secuencia. */
export function newDynamicQrId(): string {
  return `dqr_${randomUUID()}`;
}

/** Id de evento de auditoría (evt_<uuid>). */
export function newAuditEventId(): string {
  return `evt_${randomUUID()}`;
}

/** Clave de advisory lock para idempotencia (hashtext de la key hasheada). */
export function idempotencyLockId(keyHash: string): number {
  // hashtext es int4 en Postgres; el valor no necesita ser estable entre procesos.
  return hashToInt(keyHash);
}

function hashToInt(value: string): number {
  const digest = createHash("sha256").update(value).digest();
  return digest.readUInt32BE(0);
}
