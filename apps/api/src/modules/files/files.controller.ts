/** Controlador HTTP de subida de archivos (route → controller → service → storage). */
import type { NextFunction, Request, Response } from "express";
import { FileInvalidError, handleFileError } from "./file-errors.js";
import type { FilesService } from "./files.service.js";
import { type FileUploadContext, removeUploadedFile, runFileUpload } from "./upload.middleware.js";

export function createFilesController(service: FilesService, uploadContext: FileUploadContext) {
  return {
    /**
     * POST /api/v1/files (multipart, campo "file"). Devuelve la URL pública
     * con token opaco (ADR-003); el binario nunca entra en el QR.
     */
    async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
      runFileUpload(uploadContext, req, res, async (error: unknown) => {
        if (error !== undefined && error !== null) {
          handleFileError(error, res, next);
          return;
        }
        const file = req.file;
        try {
          if (file === undefined) {
            throw new FileInvalidError('Envía el archivo en el campo multipart "file".');
          }
          const result = await service.storeUpload(file);
          res.status(200).set("Cache-Control", "no-store").json(result);
        } catch (uploadError) {
          handleFileError(uploadError, res, next);
        } finally {
          await removeUploadedFile(file);
        }
      });
    },
  };
}
