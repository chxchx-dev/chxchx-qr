/**
 * Motor QR único (ADR-002). Fase 02: builders por tipo, normalización,
 * validación de capacidad/contraste y renderizado SVG/GIF.
 */

export {
  buildCalendar,
  buildEmail,
  buildGeo,
  buildPhone,
  buildSms,
  buildText,
  buildUrl,
  buildVCard,
  buildWifi,
  cleanPhone,
  escapeICal,
  escapeVCard,
  escapeWifi,
} from "./builders/index.js";
export type {
  BuildPayloadResult,
  CanonicalPayload,
  ContentWarning,
  QrContent,
} from "./domain/qr-content.js";
export {
  QrContrastTooLowError,
  QrInvertedColorsError,
  QrPayloadTooLargeError,
  QrRenderUnscannableError,
  QrUnsupportedFormatError,
} from "./domain/qr-errors.js";
export {
  DEFAULT_QR_OPTIONS,
  type EccLevel,
  type QrDensity,
  type QrFormat,
  type QrRenderOptions,
} from "./domain/qr-options.js";
export type { QrMatrix, QrRenderResult, QrValidationResult } from "./domain/qr-result.js";
export { renderGif } from "./renderers/gif.renderer.js";
export {
  type PngRasterizer,
  type PngRasterizerInput,
  type RenderPngInput,
  renderPng,
} from "./renderers/png.renderer.js";
export {
  decodeMatrix,
  decodeRgbImage,
  encodeMatrix,
  type RgbImage,
  renderGifBytes,
  renderMatrixRgb,
} from "./renderers/qr-encoder.adapter.js";
export { renderRaw } from "./renderers/raw.renderer.js";
export { renderSvg } from "./renderers/svg.renderer.js";
export { buildCanonicalPayload } from "./services/build-canonical-payload.js";
export { renderQr } from "./services/render-qr.js";
export { validateQr } from "./services/validate-qr.js";
export {
  assertWithinAbsoluteCapacity,
  classifyDensity,
  densityRecommendations,
  QR_ABSOLUTE_MAX_CHARS,
  QR_VERSION_MAX,
  QR_VERSION_MIN,
} from "./validation/capacity.js";
export {
  assertValidContrast,
  contrastRatio,
  MIN_CONTRAST_RATIO,
  parseHexColor,
  relativeLuminance,
} from "./validation/contrast.js";
export {
  ALLOWED_URL_SCHEMES,
  BLOCKED_URL_SCHEMES,
  isAllowedUrlScheme,
} from "./validation/schemes.js";
