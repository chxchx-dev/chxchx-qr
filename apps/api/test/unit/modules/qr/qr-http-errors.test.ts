import { ErrorCodes } from "@acore/contracts";
import {
  QrContrastTooLowError,
  QrInvertedColorsError,
  QrPayloadTooLargeError,
  QrRenderUnscannableError,
  QrUnsupportedFormatError,
} from "@acore/qr-core";
import type { NextFunction, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { handleQrError } from "../../../../src/modules/qr/qr.http-errors.js";

function createResponse() {
  const mock = {
    getHeader: vi.fn(() => "request-123"),
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn(),
  };
  return { mock, response: mock as unknown as Response };
}

const mappedErrors = [
  {
    name: "payload demasiado grande",
    error: new QrPayloadTooLargeError(),
    status: 422,
    code: ErrorCodes.QR_PAYLOAD_TOO_LARGE,
  },
  {
    name: "contraste insuficiente",
    error: new QrContrastTooLowError("contraste"),
    status: 422,
    code: ErrorCodes.QR_CONTRAST_TOO_LOW,
  },
  {
    name: "colores invertidos",
    error: new QrInvertedColorsError("colores"),
    status: 422,
    code: ErrorCodes.QR_INVERTED_COLORS,
  },
  {
    name: "formato no soportado",
    error: new QrUnsupportedFormatError("formato"),
    status: 415,
    code: ErrorCodes.QR_UNSUPPORTED_FORMAT,
  },
  {
    name: "render no escaneable",
    error: new QrRenderUnscannableError("lectura"),
    status: 422,
    code: ErrorCodes.QR_RENDER_UNSCANNABLE,
  },
];

describe("handleQrError", () => {
  it.each(mappedErrors)("traduce $name a Problem Details", ({ error, status, code }) => {
    const { mock, response } = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    handleQrError(error, response, next);

    expect(mock.status).toHaveBeenCalledWith(status);
    expect(mock.set).toHaveBeenCalledWith("Content-Type", "application/problem+json");
    const body = JSON.parse(String(mock.send.mock.calls[0]?.[0])) as {
      status: number;
      code: string;
      requestId: string;
    };
    expect(body).toMatchObject({ status, code, requestId: "request-123" });
    expect(next).not.toHaveBeenCalled();
  });

  it("pasa errores desconocidos al siguiente middleware", () => {
    const { response } = createResponse();
    const next = vi.fn() as unknown as NextFunction;
    const error = new Error("inesperado");

    handleQrError(error, response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
