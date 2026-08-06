/**
 * Errores de dominio de administración (Fase 08) y traducción a Problem
 * Details. Reutiliza el mapeo de DB de dynamic-qrs y el 404 de QR ajeno.
 */
import { ErrorCodes } from "@acore/contracts";
import type { NextFunction, Response } from "express";
import { sendProblem } from "../../errors.js";
import { DynamicQrNotFoundError, isDatabaseError } from "../dynamic-qrs/dynamic-qr.errors.js";

export class AdminNotFoundError extends Error {}

export function handleAdminError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof AdminNotFoundError || error instanceof DynamicQrNotFoundError) {
    sendProblem(res, 404, ErrorCodes.ADM_NOT_FOUND, "Recurso no encontrado");
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
