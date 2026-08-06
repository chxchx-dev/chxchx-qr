/** Rutas QR (sin lógica de negocio; solo cableado route → controller). */
import type { ApiConfig } from "@acore/config";
import { Router } from "express";
import { ensureUploadDir } from "./logo-upload.middleware.js";
import { createQrController } from "./qr.controller.js";
import { createQrRateLimiters } from "./qr-render-limits.js";

export function createQrRouter(config: ApiConfig): Router {
  const router = Router();
  const controller = createQrController(config);
  const limits = createQrRateLimiters(config);
  ensureUploadDir();

  router.post("/validate", limits.validate, controller.validate);
  router.post("/render", limits.render, controller.render);
  router.post("/logo", limits.upload, controller.uploadLogo);

  return router;
}
