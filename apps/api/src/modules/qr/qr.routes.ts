/** Rutas QR (sin lógica de negocio; solo cableado route → controller). */
import type { ApiConfig } from "@acore/config";
import { Router } from "express";
import { createQrController } from "./qr.controller.js";
import { createQrRateLimiters } from "./qr-render-limits.js";

export function createQrRouter(config: ApiConfig): Router {
  const router = Router();
  const controller = createQrController();
  const limits = createQrRateLimiters(config);
  router.post("/validate", limits.validate, controller.validate);
  router.post("/render", limits.render, controller.render);

  return router;
}
