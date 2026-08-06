/** Traduce errores de dominio de qr-core a respuestas Problem Details estables. */
import { ErrorCodes } from "@acore/contracts";
import {
  QrContrastTooLowError,
  QrInvertedColorsError,
  QrLogoInvalidError,
  QrLogoRequiresHighEccError,
  QrLogoTooLargeError,
  QrLogoUnsupportedFormatError,
  QrPayloadTooLargeError,
  QrRenderUnscannableError,
  QrUnsupportedFormatError,
} from "@acore/qr-core";
import type { NextFunction, Response } from "express";
import { sendProblem } from "../../errors.js";

export function handleQrError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof QrPayloadTooLargeError) {
    sendProblem(
      res,
      422,
      ErrorCodes.QR_PAYLOAD_TOO_LARGE,
      "El contenido excede la capacidad del código QR",
      "Reduce el contenido o utiliza un enlace en lugar de incrustarlo.",
    );
    return;
  }
  if (error instanceof QrContrastTooLowError) {
    sendProblem(res, 422, ErrorCodes.QR_CONTRAST_TOO_LOW, "Contraste insuficiente", error.message);
    return;
  }
  if (error instanceof QrInvertedColorsError) {
    sendProblem(res, 422, ErrorCodes.QR_INVERTED_COLORS, "Colores invertidos", error.message);
    return;
  }
  if (error instanceof QrUnsupportedFormatError) {
    sendProblem(res, 415, ErrorCodes.QR_UNSUPPORTED_FORMAT, "Formato no soportado", error.message);
    return;
  }
  if (error instanceof QrLogoInvalidError) {
    sendProblem(res, 415, ErrorCodes.QR_LOGO_INVALID, "Logo no válido", error.message);
    return;
  }
  if (error instanceof QrLogoTooLargeError) {
    sendProblem(res, 413, ErrorCodes.QR_LOGO_TOO_LARGE, "Logo demasiado grande", error.message);
    return;
  }
  if (error instanceof QrLogoRequiresHighEccError) {
    sendProblem(
      res,
      422,
      ErrorCodes.QR_LOGO_REQUIRES_HIGH_ECC,
      "El logo exige corrección de errores máxima",
      error.message,
    );
    return;
  }
  if (error instanceof QrLogoUnsupportedFormatError) {
    sendProblem(
      res,
      422,
      ErrorCodes.QR_LOGO_UNSUPPORTED_FORMAT,
      "Formato incompatible con el logo",
      error.message,
    );
    return;
  }
  if (error instanceof QrRenderUnscannableError) {
    sendProblem(
      res,
      422,
      ErrorCodes.QR_RENDER_UNSCANNABLE,
      "El QR no se puede escanear de forma fiable",
      error.message,
    );
    return;
  }
  next(error);
}
