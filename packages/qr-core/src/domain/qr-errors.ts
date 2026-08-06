/** Errores de dominio del motor QR. Los códigos son parte del contrato público. */
import { ErrorCodes } from "@acore/contracts";

export class QrPayloadTooLargeError extends Error {
  readonly code: string = ErrorCodes.QR_PAYLOAD_TOO_LARGE;

  constructor(message = "El contenido excede la capacidad del código QR") {
    super(message);
    this.name = "QrPayloadTooLargeError";
  }
}

export class QrContrastTooLowError extends Error {
  readonly code: string = ErrorCodes.QR_CONTRAST_TOO_LOW;

  constructor(message: string) {
    super(message);
    this.name = "QrContrastTooLowError";
  }
}

export class QrInvertedColorsError extends Error {
  readonly code: string = ErrorCodes.QR_INVERTED_COLORS;

  constructor(message: string) {
    super(message);
    this.name = "QrInvertedColorsError";
  }
}

export class QrUnsupportedFormatError extends Error {
  readonly code: string = ErrorCodes.QR_UNSUPPORTED_FORMAT;

  constructor(message: string) {
    super(message);
    this.name = "QrUnsupportedFormatError";
  }
}

export class QrLogoInvalidError extends Error {
  readonly code: string = ErrorCodes.QR_LOGO_INVALID;

  constructor(message: string) {
    super(message);
    this.name = "QrLogoInvalidError";
  }
}

export class QrLogoTooLargeError extends Error {
  readonly code: string = ErrorCodes.QR_LOGO_TOO_LARGE;

  constructor(message: string) {
    super(message);
    this.name = "QrLogoTooLargeError";
  }
}

export class QrLogoRequiresHighEccError extends Error {
  readonly code: string = ErrorCodes.QR_LOGO_REQUIRES_HIGH_ECC;

  constructor(message: string) {
    super(message);
    this.name = "QrLogoRequiresHighEccError";
  }
}

export class QrLogoUnsupportedFormatError extends Error {
  readonly code: string = ErrorCodes.QR_LOGO_UNSUPPORTED_FORMAT;

  constructor(message: string) {
    super(message);
    this.name = "QrLogoUnsupportedFormatError";
  }
}

export class QrRenderUnscannableError extends Error {
  readonly code: string = ErrorCodes.QR_RENDER_UNSCANNABLE;

  constructor(message: string) {
    super(message);
    this.name = "QrRenderUnscannableError";
  }
}
