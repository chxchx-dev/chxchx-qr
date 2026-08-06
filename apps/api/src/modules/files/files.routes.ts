/**
 * Rutas de archivos (Fase 05): subida y descarga con rate limit separados
 * (docs/07 §11: upload muy bajo, descarga alto). El router de descarga se
 * monta en /f/:token (URL pública del ADR-003); el de subida en /api/v1/files.
 */
import type { ApiConfig } from "@acore/config";
import { Router } from "express";
import { createFileStorage } from "../../infrastructure/storage/storage-factory.js";
import { createRateLimiter, type RateLimitOptions } from "../qr/qr-render-limits.js";
import { createFileDownloadController } from "./file-download.controller.js";
import { createFilesController } from "./files.controller.js";
import { createFilesService } from "./files.service.js";
import { createFileUploadContext } from "./upload.middleware.js";

function clientKey(config: ApiConfig): RateLimitOptions["getKey"] {
  return (req) => {
    const forwarded = req.header("x-forwarded-for");
    if (config.TRUST_PROXY && forwarded !== undefined) {
      return forwarded.split(",")[0]?.trim() ?? "unknown";
    }
    return req.ip ?? "unknown";
  };
}

/** Router de subida: POST /api/v1/files. */
export function createFilesRouter(config: ApiConfig): Router {
  const router = Router();
  const storage = createFileStorage(config);
  const service = createFilesService(config, storage);
  const uploadContext = createFileUploadContext(config);
  const controller = createFilesController(service, uploadContext);

  router.post(
    "/",
    createRateLimiter({
      windowMs: 60 * 60_000,
      max: config.FILE_RATE_LIMIT_UPLOAD_PER_HOUR,
      getKey: clientKey(config),
      code: "FILE_RATE_LIMITED",
    }),
    controller.upload,
  );

  return router;
}

/** Router de descarga: GET /f/:token (montado en /f). */
export function createFileDownloadRouter(config: ApiConfig): Router {
  const router = Router();
  const storage = createFileStorage(config);
  const service = createFilesService(config, storage);
  const controller = createFileDownloadController(service);

  router.get(
    "/:token",
    createRateLimiter({
      windowMs: 60_000,
      max: config.FILE_RATE_LIMIT_DOWNLOAD_PER_MINUTE,
      getKey: clientKey(config),
      code: "FILE_RATE_LIMITED",
    }),
    controller.download,
  );

  return router;
}
