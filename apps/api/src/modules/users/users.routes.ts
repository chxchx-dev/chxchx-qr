/**
 * Rutas de perfil (Fase 07): /api/v1/users. Solo gestión del propio perfil
 * (`/me`); no hay listado de usuarios en esta fase.
 */
import { Router } from "express";
import type { Database } from "../../infrastructure/database/pool.js";
import type { AuthModule } from "../auth/auth.routes.js";
import { createUsersController } from "./users.controller.js";
import { createUsersService } from "./users.service.js";

export function createUsersRouter(
  _database: Database,
  auth: Pick<AuthModule, "requireAuth" | "verifyOrigin" | "service">,
): Router {
  const router = Router();
  const service = createUsersService(auth.service);
  const controller = createUsersController(service);

  router.patch("/me", auth.verifyOrigin, auth.requireAuth, controller.updateProfile);

  return router;
}
