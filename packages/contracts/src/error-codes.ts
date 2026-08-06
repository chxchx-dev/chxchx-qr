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
  /** QR dinámicos deshabilitados en este entorno (403). */
  DQR_DISABLED: "DQR_DISABLED",
  /** Entrada que no cumple el esquema del contrato (400). */
  DQR_SCHEMA_INVALID: "DQR_SCHEMA_INVALID",
  /** Slug o id inexistente (404). */
  DQR_NOT_FOUND: "DQR_NOT_FOUND",
  /** El QR expiró y ya no redirige (410). */
  DQR_EXPIRED: "DQR_EXPIRED",
  /** If-Match no coincide con la versión actual (409). */
  DQR_VERSION_CONFLICT: "DQR_VERSION_CONFLICT",
  /** Falta If-Match en una mutación versionada (428). */
  DQR_VERSION_REQUIRED: "DQR_VERSION_REQUIRED",
  /** La misma Idempotency-Key se usó con otro request (409). */
  DQR_IDEMPOTENCY_CONFLICT: "DQR_IDEMPOTENCY_CONFLICT",
  /** Destino no permitido (p. ej. esquema distinto de http/https) (422). */
  DQR_INVALID_DESTINATION: "DQR_INVALID_DESTINATION",
  /** La expiración debe ser futura (422). */
  DQR_EXPIRES_IN_PAST: "DQR_EXPIRES_IN_PAST",
  /** Base de datos no disponible (503). */
  DQR_DB_UNAVAILABLE: "DQR_DB_UNAVAILABLE",
  /** Límite de frecuencia de QR dinámicos superado (429). */
  DQR_RATE_LIMITED: "DQR_RATE_LIMITED",
  /** Entrada que no cumple el esquema de auth (400). */
  AUTH_SCHEMA_INVALID: "AUTH_SCHEMA_INVALID",
  /** El email ya está registrado (409). */
  AUTH_EMAIL_IN_USE: "AUTH_EMAIL_IN_USE",
  /** Credenciales inválidas (401, mensaje genérico anti-enumeración). */
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  /** Sesión ausente, inválida o expirada (401). */
  AUTH_UNAUTHENTICATED: "AUTH_UNAUTHENTICATED",
  /** Origin no permitido en una mutación autenticada (403, CSRF). */
  AUTH_ORIGIN_FORBIDDEN: "AUTH_ORIGIN_FORBIDDEN",
  /** Contraseña nueva débil o currentPassword incorrecta (422). */
  AUTH_PASSWORD_WEAK: "AUTH_PASSWORD_WEAK",
  /** Límite de frecuencia de login/registro superado (429). */
  AUTH_RATE_LIMITED: "AUTH_RATE_LIMITED",
  /** Analítica: rango o granularidad no soportados (422). */
  ANL_INVALID_RANGE: "ANL_INVALID_RANGE",
  /** Analítica: QR inexistente o ajeno (404, sin revelar existencia). */
  ANL_NOT_FOUND: "ANL_NOT_FOUND",
  /** Reporte de abuso: entrada que no cumple el esquema (400). */
  ABUSE_SCHEMA_INVALID: "ABUSE_SCHEMA_INVALID",
  /** Reporte de abuso: límite de frecuencia superado (429). */
  ABUSE_RATE_LIMITED: "ABUSE_RATE_LIMITED",
  /** Admin: se requieren permisos de administrador (403). */
  ADM_FORBIDDEN: "ADM_FORBIDDEN",
  /** Admin: recurso inexistente (404). */
  ADM_NOT_FOUND: "ADM_NOT_FOUND",
  /** Admin: entrada que no cumple el esquema (400). */
  ADM_SCHEMA_INVALID: "ADM_SCHEMA_INVALID",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
