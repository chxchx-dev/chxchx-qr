/**
 * Middleware de rol admin (Fase 08): debe correr después de requireAuth (usa
 * res.locals.user). Consulta admin_roles; sin rol → 403 ADM_FORBIDDEN. Falla de
 * DB → 503 (no confundir indisponibilidad con falta de permisos).
 */
import { ErrorCodes } from "@acore/contracts";
import type { RequestHandler } from "express";
import type { Pool } from "pg";
import { sendProblem } from "../../errors.js";
import { createAdminRepository } from "./abuse.repository.js";

export function createRequireAdmin(input: { pool: Pool }): RequestHandler {
  const repo = createAdminRepository(input.pool);
  return (_req, res, next) => {
    const user = res.locals.user as { id: string } | undefined;
    if (user === undefined) {
      sendProblem(res, 401, ErrorCodes.AUTH_UNAUTHENTICATED, "Sesión requerida");
      return;
    }
    void repo
      .isAdmin(input.pool, user.id)
      .then((isAdmin) => {
        if (!isAdmin) {
          sendProblem(res, 403, ErrorCodes.ADM_FORBIDDEN, "Se requieren permisos de administrador");
          return;
        }
        next();
      })
      .catch((error: unknown) => {
        console.error("[admin] no se pudo verificar el rol", error);
        sendProblem(
          res,
          503,
          ErrorCodes.DQR_DB_UNAVAILABLE,
          "Base de datos no disponible",
          "Inténtalo de nuevo en unos segundos.",
        );
      });
  };
}
