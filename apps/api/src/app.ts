import crypto from "node:crypto";
import type { ApiConfig } from "@acore/config";
import express, { type Express } from "express";
import { createCorsMiddleware } from "./cors.js";
import { createErrorHandler, notFoundHandler } from "./errors.js";
import { createQrRouter } from "./modules/qr/qr.routes.js";
import { createHealthRouter } from "./routes/health.routes.js";

/**
 * Construye la aplicación Express sin abrir el puerto.
 * Recibe la configuración ya validada (fallo temprano en server.ts).
 */
export function createApp(config: ApiConfig): Express {
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

  // Evita que el navegador interprete contenido con otro tipo MIME.
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  // CORS: solo el origen configurado (necesario para que la web consuma la API).
  app.use(createCorsMiddleware(config.WEB_ORIGIN));

  app.use("/health", createHealthRouter(config));
  app.use("/api/v1/qr", createQrRouter(config));

  app.use(notFoundHandler);
  app.use(createErrorHandler(config));

  return app;
}
