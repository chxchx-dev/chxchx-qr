import { ErrorCodes } from "@chxchx/contracts";
import { describe, expect, it } from "vitest";
import {
  QrContrastTooLowError,
  QrInvertedColorsError,
  QrPayloadTooLargeError,
  QrRenderUnscannableError,
  QrUnsupportedFormatError,
} from "../../src/domain/qr-errors.js";

const domainErrors = [
  {
    name: "QrPayloadTooLargeError",
    create: () => new QrPayloadTooLargeError(),
    code: ErrorCodes.QR_PAYLOAD_TOO_LARGE,
  },
  {
    name: "QrContrastTooLowError",
    create: () => new QrContrastTooLowError("contraste"),
    code: ErrorCodes.QR_CONTRAST_TOO_LOW,
  },
  {
    name: "QrInvertedColorsError",
    create: () => new QrInvertedColorsError("colores"),
    code: ErrorCodes.QR_INVERTED_COLORS,
  },
  {
    name: "QrUnsupportedFormatError",
    create: () => new QrUnsupportedFormatError("formato"),
    code: ErrorCodes.QR_UNSUPPORTED_FORMAT,
  },
  {
    name: "QrRenderUnscannableError",
    create: () => new QrRenderUnscannableError("lectura"),
    code: ErrorCodes.QR_RENDER_UNSCANNABLE,
  },
];

describe("errores de dominio QR", () => {
  it.each(domainErrors)("$name conserva su nombre y código público", ({ name, create, code }) => {
    const error = create();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(name);
    expect(error.code).toBe(code);
  });

  it("permite personalizar el mensaje del error de capacidad", () => {
    expect(new QrPayloadTooLargeError("mensaje propio").message).toBe("mensaje propio");
  });
});
