import crypto from "node:crypto";
import type { ApiConfig } from "@acore/config";
import express, { type Express } from "express";
import { createCorsMiddleware } from "./cors.js";
import { createErrorHandler, notFoundHandler } from "./errors.js";
import { createDatabase, type Database } from "./infrastructure/database/pool.js";
import { createAbuseReportRouter, createAdminRouter } from "./modules/admin/admin.routes.js";
import { createAnalyticsModule } from "./modules/analytics/analytics.routes.js";
import { createAuthModule } from "./modules/auth/auth.routes.js";
import { createDynamicQrRouter } from "./modules/dynamic-qrs/dynamic-qr.routes.js";
import { createFileDownloadRouter, createFilesRouter } from "./modules/files/files.routes.js";
import { createQrRouter } from "./modules/qr/qr.routes.js";
import { createRedirectRouter } from "./modules/redirect/redirect.routes.js";
import { createUsersRouter } from "./modules/users/users.routes.js";
import { createHealthRouter } from "./routes/health.routes.js";

export interface AppDeps {
  /** Pool compartido (tests); si no llega, se crea desde la config. */
  database?: Database;
}

/**
 * Construye la aplicación Express sin abrir el puerto.
 * Recibe la configuración ya validada (fallo temprano en server.ts).
 */
export function createApp(config: ApiConfig, deps: AppDeps = {}): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.TRUST_PROXY);
  app.use(express.json({ limit: config.REQUEST_BODY_LIMIT }));

  // Request ID: se acepta uno entrante o se genera; siempre se devuelve.
  app.use((req, res, next) => {
    const incoming = req.header("x-request-id");
    const requestId =
      incoming !== undefined && incoming.length > 0 ? incoming : crypto.randomUUID();
    res.setHeader("X-Request-Id", requestId);
    next();
  });

  // Seguridad: evitar content sniffing en todas las respuestas (05-API-CONTRACTS).
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  // CORS: solo el origen configurado (necesario para que la web consuma la API).
  app.use(createCorsMiddleware(config.WEB_ORIGIN));

  // Pool de PostgreSQL solo si la feature está habilitada (ADR-004).
  const database = config.DYNAMIC_QR_ENABLED
    ? (deps.database ?? createDatabase(config))
    : undefined;

  app.use("/health", createHealthRouter(config, database));
  app.use("/api/v1/qr", createQrRouter(config));
  app.use("/api/v1/files", createFilesRouter(config));
  // URL pública de descarga de archivos (ADR-003): https://.../f/{token}.
  app.use("/f", createFileDownloadRouter(config));

  // Cuentas y sesiones (Fase 07, ADR-005): auth solo con DB; si está
  // deshabilitado, /api/v1/auth, /api/v1/users y /api/v1/dynamic-qrs caen en
  // el 404 genérico (sin exponer la feature).
  if (database !== undefined) {
    const auth = createAuthModule(config, database);
    app.use("/api/v1/auth", auth.router);
    app.use("/api/v1/users", createUsersRouter(database, auth));
    // Analítica (Fase 08): solo si habilitada; el HMAC es obligatorio entonces
    // (fallo temprano en createAnalyticsModule).
    const analytics = config.ANALYTICS_ENABLED
      ? createAnalyticsModule(config, database)
      : undefined;
    // QR dinámicos (Fase 06 + ownership Fase 07): sesión + Origin.
    app.use(
      "/api/v1/dynamic-qrs",
      createDynamicQrRouter(config, database, auth, analytics?.service),
    );
    // Redirección pública (ADR-003-style): https://.../r/{slug}.
    app.use("/r", createRedirectRouter(config, database, analytics?.recorder));
    // Administración (Fase 08): reporte público de abuso + gestión con rol.
    app.use("/api/v1/abuse-reports", createAbuseReportRouter(config, database));
    app.use("/api/v1/admin", createAdminRouter(config, database, auth));
  }

  app.use(notFoundHandler);
  app.use(createErrorHandler(config));

  return app;
}
