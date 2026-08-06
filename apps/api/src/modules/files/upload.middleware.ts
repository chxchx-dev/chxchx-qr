/**
 * Middleware de subida de archivos (docs/07 §7): multer ≥2 con disco temporal
 * aislado, 1 archivo, límite de tamaño y nombres aleatorios. La validación de
 * autoridad (firma mágica, tipo, re-encode) ocurre en files.service.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ApiConfig } from "@acore/config";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { FileInvalidError, FileTooLargeError } from "./file-errors.js";

export interface FileUploadContext {
  /** Directorio de temporales de subida (por proceso). */
  uploadsDir: string;
  middleware: ReturnType<typeof multer>;
}

export function createFileUploadContext(config: ApiConfig): FileUploadContext {
  const uploadsDir = path.join(config.FILE_TEMP_DIR, "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });
  const middleware = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, callback) => callback(null, uploadsDir),
      filename: (_req, _file, callback) => callback(null, crypto.randomUUID()),
    }),
    limits: {
      fileSize: config.FILE_MAX_BYTES,
      files: 1,
      fields: 0,
    },
  });
  return { uploadsDir, middleware };
}

/** Traduce errores de multer al contrato: 413 FILE_TOO_LARGE / 400 FILE_INVALID. */
export function runFileUpload(
  context: FileUploadContext,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  context.middleware.single("file")(req, res, (error: unknown) => {
    if (error === undefined || error === null) {
      next();
      return;
    }
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(new FileTooLargeError("El archivo supera el tamaño máximo permitido."));
        return;
      }
      if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
        next(new FileInvalidError('Envía exactamente un archivo en el campo "file".'));
        return;
      }
    }
    next(new FileInvalidError("No se pudo procesar la subida."));
  });
}

/** Elimina el archivo temporal (cleanup con finally en el controlador). */
export async function removeUploadedFile(file: Express.Multer.File | undefined): Promise<void> {
  if (file === undefined) {
    return;
  }
  await fs.promises.unlink(file.path).catch(() => {
    // El temporal puede no existir; no es un error de contrato.
  });
}
