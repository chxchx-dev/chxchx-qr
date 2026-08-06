/**
 * Errores de dominio de auth (Fase 07) y su traducción a Problem Details
 * estables. El login nunca distingue "email desconocido" de "contraseña
 * incorrecta" (anti-enumeración, docs/07 §12).
 */
import { ErrorCodes } from "@acore/contracts";
import type { NextFunction, Response } from "express";
import { sendProblem } from "../../errors.js";

export class AuthEmailInUseError extends Error {}
export class AuthInvalidCredentialsError extends Error {}
export class AuthUnauthenticatedError extends Error {}
export class AuthOriginForbiddenError extends Error {}
export class AuthCurrentPasswordInvalidError extends Error {}

export function handleAuthError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof AuthEmailInUseError) {
    sendProblem(res, 409, ErrorCodes.AUTH_EMAIL_IN_USE, "El correo ya está registrado");
    return;
  }
  if (error instanceof AuthInvalidCredentialsError) {
    sendProblem(
      res,
      401,
      ErrorCodes.AUTH_INVALID_CREDENTIALS,
      "Credenciales inválidas",
      "Correo o contraseña incorrectos.",
    );
    return;
  }
  if (error instanceof AuthUnauthenticatedError) {
    sendProblem(
      res,
      401,
      ErrorCodes.AUTH_UNAUTHENTICATED,
      "Sesión requerida",
      "Inicia sesión para continuar.",
    );
    return;
  }
  if (error instanceof AuthOriginForbiddenError) {
    sendProblem(
      res,
      403,
      ErrorCodes.AUTH_ORIGIN_FORBIDDEN,
      "Origen no permitido",
      "La solicitud no proviene de un origen autorizado.",
    );
    return;
  }
  if (error instanceof AuthCurrentPasswordInvalidError) {
    sendProblem(
      res,
      422,
      ErrorCodes.AUTH_PASSWORD_WEAK,
      "Contraseña actual incorrecta",
      "La contraseña actual no coincide.",
    );
    return;
  }
  next(error);
}
