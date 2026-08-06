import type { ApiConfig } from "@acore/config";
import { Router } from "express";

export function createHealthRouter(config: ApiConfig): Router {
  const router = Router();

  // El proceso vive; no consulta dependencias.
  router.get("/live", (_req, res) => {
    res.json({ status: "ok", service: "qr-api", version: config.APP_VERSION });
  });

  // Verifica que lo necesario para servir está disponible (motor QR).
  router.get("/ready", (_req, res) => {
    import("@acore/qr-core")
      .then(() => {
        res.json({ status: "ready", checks: { qrEngine: "ok" } });
      })
      .catch(() => {
        res.status(503).json({ status: "not_ready", checks: { qrEngine: "error" } });
      });
  });

  return router;
}
