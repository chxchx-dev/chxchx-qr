/**
 * Códigos de error estables del contrato QR (parte del contrato público).
 * Nunca cambiar el string de un código existente; añadir nuevos si hace falta.
 */
export const ErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  /** Entrada que no cumple el esquema del contrato (400). */
  QR_SCHEMA_INVALID: "QR_SCHEMA_INVALID",
  /** El payload excede la capacidad real del encoder (422). */
  QR_PAYLOAD_TOO_LARGE: "QR_PAYLOAD_TOO_LARGE",
  /** Contraste insuficiente entre colores (< 4.5:1) (422). */
  QR_CONTRAST_TOO_LOW: "QR_CONTRAST_TOO_LOW",
  /** Combinación invertida: foreground más claro que el fondo (422, bloqueado en MVP). */
  QR_INVERTED_COLORS: "QR_INVERTED_COLORS",
  /** Formato de salida no soportado por el servidor en esta fase (415). */
  QR_UNSUPPORTED_FORMAT: "QR_UNSUPPORTED_FORMAT",
  /** Logo rechazado: tipo no permitido o archivo no decodificable (400/415). */
  QR_LOGO_INVALID: "QR_LOGO_INVALID",
  /** Logo que excede 2 MB o 1024×1024 (413). */
  QR_LOGO_TOO_LARGE: "QR_LOGO_TOO_LARGE",
  /** Logo presente con ECC inferior a high (422). */
  QR_LOGO_REQUIRES_HIGH_ECC: "QR_LOGO_REQUIRES_HIGH_ECC",
  /** Logo no compatible con el formato (p. ej. GIF) (422). */
  QR_LOGO_UNSUPPORTED_FORMAT: "QR_LOGO_UNSUPPORTED_FORMAT",
  /** El render final no decodifica el payload (logo compromete lectura) (422). */
  QR_RENDER_UNSCANNABLE: "QR_RENDER_UNSCANNABLE",
  /** Límite de frecuencia superado (429). */
  QR_RATE_LIMITED: "QR_RATE_LIMITED",
  /** Subida de archivos deshabilitada en este entorno (403). */
  FILE_UPLOAD_DISABLED: "FILE_UPLOAD_DISABLED",
  /** El archivo supera FILE_MAX_BYTES (413). */
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  /** Tipo de archivo no permitido o firma mágica inválida (415). */
  FILE_TYPE_NOT_ALLOWED: "FILE_TYPE_NOT_ALLOWED",
  /** Archivo no recibido o inválido (400). */
  FILE_INVALID: "FILE_INVALID",
  /** Token de descarga inexistente (404). */
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  /** El archivo expiró y fue eliminado (410). */
  FILE_EXPIRED: "FILE_EXPIRED",
  /** Storage no disponible (503). */
  FILE_STORAGE_UNAVAILABLE: "FILE_STORAGE_UNAVAILABLE",
  /** Límite de frecuencia de subida/descarga superado (429). */
  FILE_RATE_LIMITED: "FILE_RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
