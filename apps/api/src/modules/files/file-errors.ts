/**
 * Errores de dominio de archivos y su traducción a Problem Details (Fase 05).
 * Códigos estables en @acore/contracts (ErrorCodes.FILE_*).
 */
import { ErrorCodes } from "@acore/contracts";
import type { NextFunction, Response } from "express";
import { sendProblem } from "../../errors.js";

export class FileUploadDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileUploadDisabledError";
  }
}

export class FileTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileTooLargeError";
  }
}

export class FileTypeNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileTypeNotAllowedError";
  }
}

export class FileInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileInvalidError";
  }
}

export class FileNotFoundError extends Error {
  constructor(message = "El archivo no existe o el enlace es inválido.") {
    super(message);
    this.name = "FileNotFoundError";
  }
}

export class FileExpiredError extends Error {
  constructor(message = "El archivo expiró y ya no está disponible.") {
    super(message);
    this.name = "FileExpiredError";
  }
}

export class FileStorageUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileStorageUnavailableError";
  }
}

/** Traduce errores de dominio de archivos a respuestas Problem Details estables. */
export function handleFileError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof FileUploadDisabledError) {
    sendProblem(
      res,
      403,
      ErrorCodes.FILE_UPLOAD_DISABLED,
      "La subida de archivos está deshabilitada",
      error.message,
    );
    return;
  }
  if (error instanceof FileTooLargeError) {
    sendProblem(res, 413, ErrorCodes.FILE_TOO_LARGE, "Archivo demasiado grande", error.message);
    return;
  }
  if (error instanceof FileTypeNotAllowedError) {
    sendProblem(
      res,
      415,
      ErrorCodes.FILE_TYPE_NOT_ALLOWED,
      "Tipo de archivo no permitido",
      error.message,
    );
    return;
  }
  if (error instanceof FileInvalidError) {
    sendProblem(res, 400, ErrorCodes.FILE_INVALID, "Archivo no válido", error.message);
    return;
  }
  if (error instanceof FileNotFoundError) {
    sendProblem(res, 404, ErrorCodes.FILE_NOT_FOUND, "Archivo no encontrado", error.message);
    return;
  }
  if (error instanceof FileExpiredError) {
    sendProblem(res, 410, ErrorCodes.FILE_EXPIRED, "Archivo expirado", error.message);
    return;
  }
  if (error instanceof FileStorageUnavailableError) {
    sendProblem(
      res,
      503,
      ErrorCodes.FILE_STORAGE_UNAVAILABLE,
      "Almacenamiento no disponible",
      error.message,
    );
    return;
  }
  next(error);
}
