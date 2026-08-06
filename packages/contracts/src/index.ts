/**
 * Contratos compartidos entre apps y paquetes (Fase 02):
 * esquemas Zod, DTOs y códigos de error de los endpoints QR.
 */
export { type ErrorCode, ErrorCodes } from "./error-codes.js";
export {
  type FileUploadResponse,
  fileUploadResponseSchema,
} from "./file-response.schema.js";
export {
  type AllowedFileMime,
  FILE_UPLOAD_LIMITS,
} from "./file-upload.schema.js";
export { type ProblemDetails, problemDetailsSchema } from "./problem.schema.js";
export {
  QR_CONTENT_LIMITS,
  type QrContent,
  qrContentSchema,
  urlSchemeCheck,
} from "./qr-content.schema.js";
export {
  LOGO_LIMITS,
  QR_MARGIN_LIMITS,
  QR_OPTIONS_DEFAULTS,
  QR_SIZE_LIMITS,
  type QrRenderOptions,
  qrOptionsSchema,
} from "./qr-options.schema.js";
export {
  type QrDensity,
  type QrValidationResponse,
  qrDensitySchema,
  qrValidationResponseSchema,
} from "./qr-response.schema.js";
