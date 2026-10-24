/** Contratos compartidos por la web, la API y el motor local de QR. */
export { type ErrorCode, ErrorCodes } from "./error-codes.js";
export { type ProblemDetails, problemDetailsSchema } from "./problem.schema.js";
export {
  QR_CONTENT_LIMITS,
  type QrContent,
  qrContentSchema,
  SAFE_URL_SCHEMA,
  urlSchemeCheck,
} from "./qr-content.schema.js";
export {
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
