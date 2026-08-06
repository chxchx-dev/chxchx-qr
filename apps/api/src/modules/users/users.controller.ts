/**
 * Controlador de perfil (Fase 07): PATCH /api/v1/users/me actualiza display
 * name y/o contraseña (con verificación de la actual). Requiere sesión.
 */
import { ErrorCodes, updateProfileSchema } from "@acore/contracts";
import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { sendProblem } from "../../errors.js";
import { handleAuthError } from "../auth/auth.errors.js";
import type { UsersService } from "./users.service.js";

function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (issue === undefined) {
    return "La entrada no cumple el contrato.";
  }
  const path = issue.path.join(".");
  return path === "" ? issue.message : `${path}: ${issue.message}`;
}

export function createUsersController(service: UsersService) {
  return {
    async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        sendProblem(
          res,
          400,
          ErrorCodes.AUTH_SCHEMA_INVALID,
          "La entrada no cumple el contrato",
          firstIssueMessage(parsed.error),
        );
        return;
      }
      const user = res.locals.user as { id: string } | undefined;
      const sessionId = res.locals.sessionId as string | undefined;
      if (user === undefined || sessionId === undefined) {
        sendProblem(res, 401, ErrorCodes.AUTH_UNAUTHENTICATED, "Sesión requerida");
        return;
      }
      try {
        const updated = await service.updateProfile(user.id, sessionId, parsed.data);
        res.set("Cache-Control", "no-store").json({ user: updated });
      } catch (error) {
        handleAuthError(error, res, next);
      }
    },
  };
}
