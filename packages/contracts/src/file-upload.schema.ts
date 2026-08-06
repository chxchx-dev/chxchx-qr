/**
 * Política de archivos compartida (docs/07 §5, Fase 05): tipos permitidos,
 * extensiones bloqueadas y límites. La autoridad final vive en la API
 * (file-policy + file-signature); este módulo solo fija las constantes del
 * contrato para que web y API hablen el mismo lenguaje.
 */
export const FILE_UPLOAD_LIMITS = {
  /** Tipos permitidos por defecto (text/plain se puede deshabilitar en producción). */
  allowedMimeTypes: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/pdf",
    "text/plain",
  ] as const,
  /** Extensiones bloqueadas aunque el contenido parezca válido (docs/07 §5). */
  blockedExtensions: [
    ".exe",
    ".msi",
    ".bat",
    ".cmd",
    ".ps1",
    ".sh",
    ".js",
    ".mjs",
    ".cjs",
    ".vbs",
    ".scr",
    ".com",
    ".dll",
    ".jar",
    ".apk",
    ".html",
    ".htm",
    ".svg",
    ".zip",
    ".rar",
    ".7z",
    ".docm",
    ".xlsm",
    ".pptm",
  ] as const,
  /** Máximo de bytes por archivo (defecto; configurable vía FILE_MAX_BYTES). */
  maxBytes: 10 * 1024 * 1024,
  /** TTL anónimo por defecto en horas (defecto; configurable vía FILE_ANONYMOUS_TTL_HOURS). */
  defaultTtlHours: 168,
  /** Longitud del token opaco (base64url) de la URL pública. */
  tokenBytes: 24,
  /** Header de descarga: el archivo siempre baja como adjunto, nunca inline. */
  downloadDisposition: "attachment",
  /** Cache corta en la descarga: el TTL limita la vida útil del enlace. */
  downloadMaxAgeSeconds: 300,
} as const;

export type AllowedFileMime = (typeof FILE_UPLOAD_LIMITS.allowedMimeTypes)[number];
