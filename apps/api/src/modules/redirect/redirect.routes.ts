/**
 * Rutas de redirección (Fase 06): GET /r/:slug, montada fuera de /api. Rate
 * limit alto (tráfico público); el router solo se monta si DYNAMIC_QR_ENABLED.
 */
import type { ApiConfig } from "@acore/config";
import { ErrorCodes } from "@acore/contracts";
import { type Request, Router } from "express";
import type { Database } from "../../infrastructure/database/pool.js";
import { createDynamicQrService } from "../dynamic-qrs/dynamic-qr.service.js";
import { createRateLimiter, type RateLimitOptions } from "../qr/qr-render-limits.js";
import { createRedirectController } from "./redirect.controller.js";
import { createRedirectService } from "./redirect.service.js";
import { createRedirectCache } from "./redirect-cache-policy.js";

function clientKey(config: ApiConfig): RateLimitOptions["getKey"] {
  return (req: Request) => {
    const forwarded = req.header("x-forwarded-for");
    if (config.TRUST_PROXY && forwarded !== undefined) {
      return forwarded.split(",")[0]?.trim() ?? "unknown";
    }
    return req.ip ?? "unknown";
  };
}

export function createRedirectRouter(config: ApiConfig, database: Database): Router {
  const router = Router();
  const dynamicQrs = createDynamicQrService({
    pool: database.pool,
    shortDomain: config.SHORT_DOMAIN,
    slugLength: config.DYNAMIC_SLUG_LENGTH,
  });
  const service = createRedirectService(
    dynamicQrs,
    createRedirectCache(config.REDIRECT_CACHE_TTL_SECONDS),
  );
  const controller = createRedirectController(service);

  router.get(
    "/:slug",
    createRateLimiter({
      windowMs: 60_000,
      max: config.RATE_LIMIT_REDIRECT_PER_MINUTE,
      getKey: clientKey(config),
      code: ErrorCodes.DQR_RATE_LIMITED,
    }),
    controller.redirect,
  );

  return router;
}
