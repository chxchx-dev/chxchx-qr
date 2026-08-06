/**
 * Rutas de administración (Fase 08): el reporte de abuso es público (sin
 * sesión, con rate limit por hora e IP); el resto de la gestión exige sesión +
 * rol admin + Origin (CSRF). Bootstrap del rol por SQL manual (decisión de la
 * fase): no hay endpoint de promoción.
 */
import type { ApiConfig } from "@acore/config";
import { ErrorCodes } from "@acore/contracts";
import { type Request, Router } from "express";
import type { Database } from "../../infrastructure/database/pool.js";
import type { AuthModule } from "../auth/auth.routes.js";
import { createRateLimiter, type RateLimitOptions } from "../qr/qr-render-limits.js";
import { createAdminController } from "./admin.controller.js";
import { createRequireAdmin } from "./admin.middleware.js";
import { createAdminService } from "./admin.service.js";

function clientKey(config: ApiConfig): RateLimitOptions["getKey"] {
  return (req: Request) => {
    const forwarded = req.header("x-forwarded-for");
    if (config.TRUST_PROXY && forwarded !== undefined) {
      return forwarded.split(",")[0]?.trim() ?? "unknown";
    }
    return req.ip ?? "unknown";
  };
}

/** Público: POST /api/v1/abuse-reports (sin sesión, rate limit por IP/hora). */
export function createAbuseReportRouter(config: ApiConfig, database: Database): Router {
  const router = Router();
  const controller = createAdminController(createAdminService({ pool: database.pool }));

  router.post(
    "/",
    createRateLimiter({
      windowMs: 60 * 60_000,
      max: config.RATE_LIMIT_ABUSE_REPORT_PER_HOUR,
      getKey: clientKey(config),
      code: ErrorCodes.ABUSE_RATE_LIMITED,
    }),
    controller.reportAbuse,
  );

  return router;
}

/** Admin: GET/POST /api/v1/admin/... (sesión + rol + Origin en mutaciones). */
export function createAdminRouter(
  _config: ApiConfig,
  database: Database,
  auth: Pick<AuthModule, "requireAuth" | "verifyOrigin">,
): Router {
  const router = Router();
  const controller = createAdminController(createAdminService({ pool: database.pool }));
  const requireAdmin = createRequireAdmin({ pool: database.pool });

  router.get("/abuse-reports", auth.requireAuth, requireAdmin, controller.listAbuseReports);
  router.post(
    "/abuse-reports/:id/resolve",
    auth.requireAuth,
    requireAdmin,
    auth.verifyOrigin,
    controller.resolveAbuseReport,
  );
  router.post(
    "/abuse-reports/:id/dismiss",
    auth.requireAuth,
    requireAdmin,
    auth.verifyOrigin,
    controller.dismissAbuseReport,
  );
  router.post(
    "/qrs/:id/block",
    auth.requireAuth,
    requireAdmin,
    auth.verifyOrigin,
    controller.blockQr,
  );
  router.post(
    "/qrs/:id/unblock",
    auth.requireAuth,
    requireAdmin,
    auth.verifyOrigin,
    controller.unblockQr,
  );
  router.post(
    "/users/:id/block",
    auth.requireAuth,
    requireAdmin,
    auth.verifyOrigin,
    controller.blockUser,
  );
  router.post(
    "/users/:id/unblock",
    auth.requireAuth,
    requireAdmin,
    auth.verifyOrigin,
    controller.unblockUser,
  );

  return router;
}
