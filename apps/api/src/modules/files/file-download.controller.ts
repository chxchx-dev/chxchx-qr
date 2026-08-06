/**
 * Controlador de descarga de archivos (docs/07 §9): GET /f/:token sirve el
 * archivo con headers de seguridad estrictos. Nunca inline (siempre
 * attachment), sin listing y con expiración (404/410).
 */
import { FILE_UPLOAD_LIMITS } from "@acore/contracts";
import type { NextFunction, Request, Response } from "express";
import { handleFileError } from "./file-errors.js";
import { buildContentDisposition } from "./filename.js";
import type { FilesService } from "./files.service.js";

/** GET /f/:token — token opaco, nunca el storage key ni el nombre original. */
export function createFileDownloadController(service: FilesService) {
  return {
    async download(req: Request, res: Response, next: NextFunction): Promise<void> {
      const token = req.params.token;
      if (typeof token !== "string" || token.length === 0) {
        next();
        return;
      }
      try {
        const stored = await service.readForDownload(token);
        const body = Buffer.from(stored.data);
        res
          .status(200)
          .set("Content-Type", stored.metadata.mimeType)
          .set("Content-Disposition", buildContentDisposition(stored.metadata.downloadName))
          .set("X-Content-Type-Options", "nosniff")
          .set("Content-Security-Policy", "sandbox")
          .set("Cache-Control", `private, max-age=${FILE_UPLOAD_LIMITS.downloadMaxAgeSeconds}`)
          .set("Content-Length", String(body.length))
          .send(body);
      } catch (error) {
        handleFileError(error, res, next);
      }
    },
  };
}
