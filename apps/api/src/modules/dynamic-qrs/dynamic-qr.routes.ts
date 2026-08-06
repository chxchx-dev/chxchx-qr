/**
 * Rutas de QR dinámicos (/api/v1/dynamic-qrs). Desde la Fase 07 la auth es por
 * sesión de usuario (cookie HttpOnly, ADR-005): sustituye al token interno de
 * la Fase 06. Las mutaciones verifican Origin (CSRF). El redirect público vive
 * en el módulo redirect (/r/:slug).
 */
import type { ApiConfig } from "@acore/config";
import { ErrorCodes } from "@acore/contracts";
import { type Request, Router } from "express";
import type { Database } from "../../infrastructure/database/pool.js";
import { createAnalyticsController } from "../analytics/analytics.controller.js";
import type { AnalyticsService } from "../analytics/analytics.service.js";
import type { AuthModule } from "../auth/auth.routes.js";
import { createRateLimiter, type RateLimitOptions } from "../qr/qr-render-limits.js";
import { createDynamicQrController } from "./dynamic-qr.controller.js";
import { createDynamicQrService } from "./dynamic-qr.service.js";

function clientKey(config: ApiConfig): RateLimitOptions["getKey"] {
  return (req: Request) => {
    const forwarded = req.header("x-forwarded-for");
    if (config.TRUST_PROXY && forwarded !== undefined) {
      return forwarded.split(",")[0]?.trim() ?? "unknown";
    }
    return req.ip ?? "unknown";
  };
}

export function createDynamicQrRouter(
  config: ApiConfig,
  database: Database,
  auth: Pick<AuthModule, "requireAuth" | "verifyOrigin">,
  analytics?: AnalyticsService,
): Router {
  const router = Router();
  const service = createDynamicQrService({
    pool: database.pool,
    shortDomain: config.SHORT_DOMAIN,
    slugLength: config.DYNAMIC_SLUG_LENGTH,
  });
  const controller = createDynamicQrController(service);
  const getKey = clientKey(config);

  const createLimiter = createRateLimiter({
    windowMs: 60_000,
    max: config.RATE_LIMIT_DQR_CREATE_PER_MINUTE,
    getKey,
    code: ErrorCodes.DQR_RATE_LIMITED,
  });
  const readLimiter = createRateLimiter({
    windowMs: 60_000,
    max: config.RATE_LIMIT_DQR_READ_PER_MINUTE,
    getKey,
    code: ErrorCodes.DQR_RATE_LIMITED,
  });

  // Mutaciones: sesión + Origin (CSRF). Lecturas: solo sesión.
  router.post("/", createLimiter, auth.requireAuth, auth.verifyOrigin, controller.create);
  router.get("/", readLimiter, auth.requireAuth, controller.list);
  // Analítica (Fase 08): solo expuesta si el módulo está habilitado.
  if (analytics !== undefined) {
    const analyticsController = createAnalyticsController(analytics);
    router.get("/:id/analytics", readLimiter, auth.requireAuth, analyticsController.get);
  }
  router.get("/:id", readLimiter, auth.requireAuth, controller.get);
  router.post(
    "/:id/duplicate",
    createLimiter,
    auth.requireAuth,
    auth.verifyOrigin,
    controller.duplicate,
  );
  router.patch("/:id", createLimiter, auth.requireAuth, auth.verifyOrigin, controller.patch);
  router.delete("/:id", createLimiter, auth.requireAuth, auth.verifyOrigin, controller.remove);

  return router;
}
