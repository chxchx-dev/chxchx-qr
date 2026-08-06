/**
 * Errores de dominio de QR dinámicos (Fase 06) y su traducción a
 * Problem Details estables (mismo patrón que qr.http-errors).
 */
import { ErrorCodes } from "@acore/contracts";
import type { NextFunction, Response } from "express";
import { sendProblem } from "../../errors.js";

export class DynamicQrDisabledError extends Error {}
export class DynamicQrNotFoundError extends Error {}
export class DynamicQrExpiredError extends Error {}
export class DynamicQrVersionConflictError extends Error {}
export class DynamicQrIdempotencyConflictError extends Error {}
export class DynamicQrInvalidDestinationError extends Error {}
export class DynamicQrExpiresInPastError extends Error {}
export class DynamicQrDbUnavailableError extends Error {}

/** ¿El error viene de la capa de base de datos? (pool, conexión, timeout, SQL). */
export function isDatabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    /ECONNREFUSED|connection|timeout|terminated|socket/i.test(error.message) ||
    (typeof error === "object" && error !== null && "code" in error)
  );
}

export function handleDynamicQrError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof DynamicQrDisabledError) {
    sendProblem(res, 403, ErrorCodes.DQR_DISABLED, "QR dinámicos deshabilitados");
    return;
  }
  if (error instanceof DynamicQrNotFoundError) {
    sendProblem(res, 404, ErrorCodes.DQR_NOT_FOUND, "QR dinámico no encontrado");
    return;
  }
  if (error instanceof DynamicQrExpiredError) {
    sendProblem(res, 410, ErrorCodes.DQR_EXPIRED, "El QR dinámico expiró", error.message);
    return;
  }
  if (error instanceof DynamicQrVersionConflictError) {
    sendProblem(
      res,
      409,
      ErrorCodes.DQR_VERSION_CONFLICT,
      "Versión obsoleta",
      "La versión enviada en If-Match no coincide con la actual.",
    );
    return;
  }
  if (error instanceof DynamicQrIdempotencyConflictError) {
    sendProblem(
      res,
      409,
      ErrorCodes.DQR_IDEMPOTENCY_CONFLICT,
      "Clave de idempotencia reutilizada",
      "La misma Idempotency-Key se usó con un request distinto.",
    );
    return;
  }
  if (error instanceof DynamicQrInvalidDestinationError) {
    sendProblem(
      res,
      422,
      ErrorCodes.DQR_INVALID_DESTINATION,
      "Destino no permitido",
      "El destino debe ser una URL http(s) válida sin credenciales.",
    );
    return;
  }
  if (error instanceof DynamicQrExpiresInPastError) {
    sendProblem(
      res,
      422,
      ErrorCodes.DQR_EXPIRES_IN_PAST,
      "Expiración en el pasado",
      "La expiración debe ser una fecha futura.",
    );
    return;
  }
  if (isDatabaseError(error)) {
    sendProblem(
      res,
      503,
      ErrorCodes.DQR_DB_UNAVAILABLE,
      "Base de datos no disponible",
      "Inténtalo de nuevo en unos segundos.",
    );
    return;
  }
  next(error);
}
