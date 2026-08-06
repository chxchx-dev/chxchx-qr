/**
 * Rutas de auth (Fase 07): /api/v1/auth. Rate limit estricto en registro y
 * login (brute force), Origin check en mutaciones (CSRF) y sesión en cookie
 * HttpOnly (ADR-005). `createAuthModule` también expone `requireAuth` y
 * `verifyOrigin` para los routers de dynamic-qrs y users.
 */
import type { ApiConfig } from "@acore/config";
import { ErrorCodes } from "@acore/contracts";
import { type Request, type RequestHandler, Router } from "express";
import type { Database } from "../../infrastructure/database/pool.js";
import { createRateLimiter } from "../qr/qr-render-limits.js";
import { createAuthController } from "./auth.controller.js";
import { createRequireAuth } from "./auth.middleware.js";
import { type AuthService, createAuthService } from "./auth.service.js";
import { createOriginMiddleware } from "./origin.middleware.js";

export interface AuthModule {
  router: Router;
  /** Middleware de sesión para rutas protegidas. */
  requireAuth: RequestHandler;
  /** Middleware de Origin para mutaciones autenticadas. */
  verifyOrigin: RequestHandler;
  /** Servicio de auth (reutilizado por users). */
  service: AuthService;
}

function clientKey(config: ApiConfig): (req: Request) => string {
  return (req: Request) => {
    const forwarded = req.header("x-forwarded-for");
    if (config.TRUST_PROXY && forwarded !== undefined) {
      return forwarded.split(",")[0]?.trim() ?? "unknown";
    }
    return req.ip ?? "unknown";
  };
}

export function createAuthModule(config: ApiConfig, database: Database): AuthModule {
  const router = Router();
  const service = createAuthService({
    pool: database.pool,
    scryptParams: {
      N: config.PASSWORD_SCRYPT_N,
      r: config.PASSWORD_SCRYPT_R,
      p: config.PASSWORD_SCRYPT_P,
    },
    sessionTtlMs: config.SESSION_TTL_HOURS * 60 * 60 * 1000,
  });

  const secrets = [
    config.SESSION_SECRET_CURRENT,
    ...(config.SESSION_SECRET_PREVIOUS !== undefined ? [config.SESSION_SECRET_PREVIOUS] : []),
  ].filter((secret): secret is string => secret !== undefined);

  const requireAuth = createRequireAuth({
    cookieName: config.SESSION_COOKIE_NAME,
    secrets,
    service,
  });

  const verifyOrigin = createOriginMiddleware([config.WEB_ORIGIN, config.PUBLIC_API_URL]);

  const controller = createAuthController({
    service,
    cookieName: config.SESSION_COOKIE_NAME,
    secure: config.NODE_ENV === "production",
    sessionTtlMs: config.SESSION_TTL_HOURS * 60 * 60 * 1000,
    secretCurrent: config.SESSION_SECRET_CURRENT ?? "",
  });

  const loginLimiter = createRateLimiter({
    windowMs: 15 * 60_000,
    max: config.RATE_LIMIT_LOGIN_PER_15_MINUTES,
    getKey: clientKey(config),
    code: ErrorCodes.AUTH_RATE_LIMITED,
  });

  router.post("/register", loginLimiter, verifyOrigin, controller.register);
  router.post("/login", loginLimiter, verifyOrigin, controller.login);
  router.post("/logout", verifyOrigin, requireAuth, controller.logout);
  router.get("/me", requireAuth, controller.me);

  return { router, requireAuth, verifyOrigin, service };
}
