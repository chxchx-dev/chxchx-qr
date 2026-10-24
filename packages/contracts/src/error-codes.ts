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
  /** El render final no decodifica el payload esperado (422). */
  QR_RENDER_UNSCANNABLE: "QR_RENDER_UNSCANNABLE",
  /** Límite de frecuencia superado (429). */
  QR_RATE_LIMITED: "QR_RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
