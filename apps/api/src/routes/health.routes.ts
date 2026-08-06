import type { ApiConfig } from "@acore/config";
import { Router } from "express";
import { checkDatabase, type Database } from "../infrastructure/database/pool.js";

export function createHealthRouter(config: ApiConfig, database?: Database): Router {
  const router = Router();

  // El proceso vive; no consulta dependencias.
  router.get("/live", (_req, res) => {
    res.json({ status: "ok", service: "qr-api", version: config.APP_VERSION });
  });

  // Verifica que lo necesario para servir está disponible (motor QR + DB si aplica).
  router.get("/ready", (_req, res) => {
    import("@acore/qr-core")
      .then(async () => {
        const checks: Record<string, string> = { qrEngine: "ok" };
        if (database !== undefined) {
          checks.database = (await checkDatabase(database.pool)) ? "ok" : "error";
        }
        const ready = Object.values(checks).every((value) => value === "ok");
        if (!ready) {
          res.status(503).json({ status: "not_ready", checks });
          return;
        }
        res.json({ status: "ready", checks });
      })
      .catch(() => {
        res.status(503).json({ status: "not_ready", checks: { qrEngine: "error" } });
      });
  });

  return router;
}
