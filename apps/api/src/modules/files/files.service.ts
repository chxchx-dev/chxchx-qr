/**
 * Servicio de archivos (docs/07 §6): secuencia completa de validación antes de
 * almacenar — firma mágica → tipo permitido → extensión coherente → hash →
 * re-encode de imágenes → storage → URL con token. La API nunca confía en el
 * MIME del browser ni en el nombre original.
 */
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import type { ApiConfig } from "@acore/config";
import type { FileUploadResponse } from "@acore/contracts";
import sharp from "sharp";
import type { FileStorage, StoredFile } from "../../infrastructure/storage/file-storage.js";
import { SHARP_LIMIT_INPUT_PIXELS } from "../qr/qr-render-limits.js";
import {
  FileExpiredError,
  FileInvalidError,
  FileNotFoundError,
  FileStorageUnavailableError,
  FileTypeNotAllowedError,
  FileUploadDisabledError,
} from "./file-errors.js";
import {
  assertFileAllowed,
  DEFAULT_FILE_POLICY_REFERENCE,
  expirationFromNow,
  filePolicyFromAllowedTypes,
} from "./file-policy.js";
import { detectFileType } from "./file-signature.js";
import { buildDownloadName, sanitizeOriginalName } from "./filename.js";

export interface FilesService {
  /** Procesa y almacena un archivo subido; devuelve la respuesta del contrato. */
  storeUpload(file: Express.Multer.File): Promise<FileUploadResponse>;
  /** Lee un archivo por token para la descarga (verifica expiración). */
  readForDownload(token: string): Promise<StoredFile>;
}

function sha256(bytes: Uint8Array): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

/**
 * Re-encodea imágenes (PNG/JPEG/WebP) para eliminar metadata y normalizar:
 * respeta la orientación EXIF y re-comprime sin metadata. PDF y texto se
 * almacenan tal cual (no son re-encodables).
 */
async function reencodeIfImage(bytes: Uint8Array, mimeType: string): Promise<Uint8Array> {
  if (!mimeType.startsWith("image/")) {
    return bytes;
  }
  try {
    const format = mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpeg" : "webp";
    const reencoded = await sharp(bytes, {
      limitInputPixels: SHARP_LIMIT_INPUT_PIXELS,
      failOn: "error",
    })
      .rotate()
      .toFormat(format, { quality: 90 })
      .toBuffer();
    return new Uint8Array(reencoded);
  } catch {
    throw new FileInvalidError("La imagen no se puede procesar de forma segura.");
  }
}

export function createFilesService(config: ApiConfig, storage: FileStorage): FilesService {
  return {
    async storeUpload(file: Express.Multer.File): Promise<FileUploadResponse> {
      if (!config.FILE_UPLOAD_ENABLED) {
        throw new FileUploadDisabledError("La subida de archivos está deshabilitada.");
      }
      const raw = new Uint8Array(await fs.readFile(file.path));
      const detected = detectFileType(raw);
      if (detected === null) {
        throw new FileTypeNotAllowedError("El archivo no es de un tipo permitido.");
      }
      const policy = {
        maxBytes: config.FILE_MAX_BYTES,
        allowedMimeTypes: filePolicyFromAllowedTypes(config.FILE_ALLOWED_TYPES).allowedMimeTypes,
        blockedExtensions: DEFAULT_FILE_POLICY_REFERENCE.blockedExtensions,
      };
      assertFileAllowed({ detected, originalName: file.originalname, bytes: raw, policy });

      // Re-encode de imágenes: el hash y el tamaño se calculan del contenido final.
      const data = await reencodeIfImage(raw, detected.mimeType);
      const sha = sha256(data);
      const originalName = sanitizeOriginalName(file.originalname);
      const downloadName = buildDownloadName(originalName, detected.extension);
      const createdAt = new Date().toISOString();
      const expiresAt = expirationFromNow(config.FILE_ANONYMOUS_TTL_HOURS);
      const token = crypto.randomBytes(24).toString("base64url");

      try {
        await storage.save(token, data, {
          mimeType: detected.mimeType,
          originalName,
          downloadName,
          sizeBytes: data.length,
          sha256: sha,
          createdAt,
          expiresAt,
        });
      } catch {
        throw new FileStorageUnavailableError("No se pudo almacenar el archivo.");
      }

      return {
        token,
        url: `${config.FILE_PUBLIC_BASE_URL}/f/${token}`,
        fileName: downloadName,
        sizeBytes: data.length,
        mimeType: detected.mimeType,
        sha256: sha,
        expiresAt,
      };
    },

    async readForDownload(token: string): Promise<StoredFile> {
      let stored: StoredFile | null;
      try {
        stored = await storage.read(token);
      } catch {
        throw new FileStorageUnavailableError("No se pudo leer el archivo.");
      }
      if (stored === null) {
        throw new FileNotFoundError();
      }
      if (new Date(stored.metadata.expiresAt).getTime() <= Date.now()) {
        // Expiración: se elimina el archivo y se responde 410.
        await storage.delete(token).catch(() => {});
        throw new FileExpiredError();
      }
      return stored;
    },
  };
}
