/**
 * Política de archivos (docs/07 §5, Fase 05): tipos permitidos desde config,
 * extensiones bloqueadas, límite de bytes y TTL. La autoridad de firma vive en
 * file-signature.ts; aquí se aplica la política sobre el tipo ya detectado.
 */
import { FILE_UPLOAD_LIMITS } from "@acore/contracts";
import { FileTooLargeError, FileTypeNotAllowedError } from "./file-errors.js";

export interface FilePolicyLimits {
  maxBytes: number;
  /** MIME permitidos (config FILE_ALLOWED_TYPES, separados por coma). */
  allowedMimeTypes: readonly string[];
  /** Extensiones bloqueadas aunque el contenido sea válido. */
  blockedExtensions: readonly string[];
  /** TTL anónimo en horas (0 = expira de inmediato). */
  ttlHours: number;
}

export function filePolicyFromAllowedTypes(
  allowedTypesCsv: string,
): Pick<FilePolicyLimits, "allowedMimeTypes"> {
  return {
    allowedMimeTypes: allowedTypesCsv
      .split(",")
      .map((type) => type.trim())
      .filter((type) => type.length > 0),
  };
}

export function isBlockedExtension(filename: string, blocked: readonly string[]): boolean {
  const lower = filename.toLowerCase();
  return blocked.some((extension) => lower.endsWith(extension));
}

/**
 * Valida la política sobre un archivo ya detectado por firma. Devuelve void o
 * lanza FileTooLargeError / FileTypeNotAllowedError.
 */
export function assertFileAllowed(input: {
  detected: { mimeType: string; extension: string };
  originalName: string;
  bytes: Uint8Array;
  policy: Pick<FilePolicyLimits, "maxBytes" | "allowedMimeTypes" | "blockedExtensions">;
}): void {
  if (input.bytes.length > input.policy.maxBytes) {
    throw new FileTooLargeError(
      `El archivo supera el tamaño máximo de ${Math.floor(input.policy.maxBytes / (1024 * 1024))} MB.`,
    );
  }
  if (!input.policy.allowedMimeTypes.includes(input.detected.mimeType)) {
    throw new FileTypeNotAllowedError(
      `El tipo ${input.detected.mimeType} no está permitido en este entorno.`,
    );
  }
  if (isBlockedExtension(input.originalName, input.policy.blockedExtensions)) {
    throw new FileTypeNotAllowedError(
      "Este tipo de archivo está bloqueado por seguridad: usa un PDF o una imagen permitida.",
    );
  }
}

/** Expiración ISO 8601 UTC a partir del instante actual y el TTL configurado. */
export function expirationFromNow(ttlHours: number, now = new Date()): string {
  return new Date(now.getTime() + ttlHours * 60 * 60 * 1000).toISOString();
}

/** Referencia de política por defecto (usa FILE_UPLOAD_LIMITS del contrato). */
export const DEFAULT_FILE_POLICY_REFERENCE = FILE_UPLOAD_LIMITS;
