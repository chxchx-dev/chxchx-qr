/**
 * Errores de dominio de analítica (Fase 08) y su traducción a Problem Details.
 * Reutiliza el mapeo de errores de DB de dynamic-qrs (DQR_DB_UNAVAILABLE).
 */
import { ErrorCodes } from "@acore/contracts";
import type { NextFunction, Response } from "express";
import { sendProblem } from "../../errors.js";
import { isDatabaseError } from "../dynamic-qrs/dynamic-qr.errors.js";

export class AnalyticsNotFoundError extends Error {}
export class AnalyticsInvalidRangeError extends Error {}

export function handleAnalyticsError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof AnalyticsNotFoundError) {
    // Ajeno o inexistente: mismo 404, sin revelar existencia (aislamiento A/B).
    sendProblem(res, 404, ErrorCodes.ANL_NOT_FOUND, "QR dinámico no encontrado");
    return;
  }
  if (error instanceof AnalyticsInvalidRangeError) {
    sendProblem(
      res,
      422,
      ErrorCodes.ANL_INVALID_RANGE,
      "Rango de analítica inválido",
      error.message,
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
