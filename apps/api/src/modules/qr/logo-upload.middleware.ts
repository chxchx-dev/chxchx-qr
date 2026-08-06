/**
 * Middleware de upload de logos (docs/07 §7 y §10): multer ≥2 con disco
 * temporal aislado, 1 archivo, límite de tamaño y limpieza garantizada.
 * La validación de autoridad (firma mágica, dimensiones, re-encode) ocurre en
 * logo.service; aquí solo se acota el tráfico y el tamaño de entrada.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { QrLogoInvalidError, QrLogoTooLargeError } from "@acore/qr-core";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";

const UPLOAD_DIR = path.join(os.tmpdir(), "acore-qr-logo-uploads");

/** Prepara el directorio temporal aislado (único por proceso). */
export function ensureUploadDir(): void {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const logoUploadMiddleware = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, UPLOAD_DIR),
    filename: (_req, _file, callback) => callback(null, crypto.randomUUID()),
  }),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
    fields: 0,
  },
});

/**
 * Envuelve multer para traducir sus errores al contrato: `LIMIT_FILE_SIZE`
 * → 413 QR_LOGO_TOO_LARGE; el resto → 415 QR_LOGO_INVALID.
 */
export function runLogoUpload(req: Request, res: Response, next: NextFunction): void {
  logoUploadMiddleware.single("logo")(req, res, (error: unknown) => {
    if (error === undefined || error === null) {
      next();
      return;
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new QrLogoTooLargeError("El logo supera el tamaño máximo de 2 MB."));
      return;
    }
    next(
      new QrLogoInvalidError(
        "El archivo de logo no es válido: usa un único PNG, JPEG o WebP de hasta 2 MB.",
      ),
    );
  });
}

/** Elimina el archivo temporal (cleanup con finally en el controlador). */
export async function removeUpload(file: Express.Multer.File | undefined): Promise<void> {
  if (file === undefined) {
    return;
  }
  await fs.promises.unlink(file.path).catch(() => {
    // El archivo temporal puede no existir; no es un error de contrato.
  });
}
