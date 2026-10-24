import type { ApiConfig } from "@acore/config";
import { Router } from "express";

export function createHealthRouter(config: ApiConfig): Router {
  const router = Router();

  // El proceso vive; no consulta dependencias.
  router.get("/live", (_req, res) => {
    res.json({ status: "ok", service: "qr-api", version: config.APP_VERSION });
  });

  // La API no requiere base de datos ni servicios externos para generar QR.
  router.get("/ready", (_req, res) => {
    res.json({ status: "ready", checks: { qrEngine: "ok" } });
  });

  return router;
}
