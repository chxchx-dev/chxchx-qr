/**
 * Política de destino (Fase 06): el destino debe ser una URL http(s) válida
 * sin credenciales (misma SAFE_URL_SCHEMA que el contenido URL del generador)
 * y la expiración debe ser futura. Defensa en profundidad: el controlador ya
 * valida el esquema (400); aquí se revalida a nivel de servicio (422).
 */
import { SAFE_URL_SCHEMA } from "@acore/contracts";
import {
  DynamicQrExpiresInPastError,
  DynamicQrInvalidDestinationError,
} from "./dynamic-qr.errors.js";

export function assertValidDestination(url: string): void {
  const result = SAFE_URL_SCHEMA.safeParse(url);
  if (!result.success) {
    throw new DynamicQrInvalidDestinationError();
  }
}

export function assertFutureExpiration(expiresAt: string | null | undefined): void {
  if (expiresAt === undefined || expiresAt === null) {
    return;
  }
  if (Number.isNaN(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now()) {
    throw new DynamicQrExpiresInPastError();
  }
}
