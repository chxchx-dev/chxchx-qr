import type { ApiConfig } from "@chxchx/config";
import type { ErrorRequestHandler, RequestHandler, Response } from "express";

interface HttpErrorLike {
  status?: unknown;
}

/**
 * Envía un cuerpo Problem Details (RFC 9457) con Content-Type
 * `application/problem+json` exacto (sin charset) y el request ID.
 */
export function sendProblem(
  res: Response,
  status: number,
  code: string,
  title: string,
  detail?: string,
): void {
  const body = {
    type: "about:blank",
    title,
    status,
    code,
    ...(detail !== undefined ? { detail } : {}),
    requestId: res.getHeader("x-request-id"),
  };
  res.status(status).set("Content-Type", "application/problem+json");
  res.send(Buffer.from(JSON.stringify(body), "utf8"));
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  sendProblem(res, 404, "NOT_FOUND", "Not Found");
};

export function createErrorHandler(config: ApiConfig): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    // Errores del cliente (p. ej., JSON malformado del body parser) → 4xx directo.
    const status = (err as HttpErrorLike).status;
    if (typeof status === "number" && status >= 400 && status < 500) {
      sendProblem(res, status, "BAD_REQUEST", "Bad Request");
      return;
    }

    // Nunca exponer stack traces; el detalle solo en entornos no productivos.
    const detail =
      config.NODE_ENV !== "production" && err instanceof Error ? err.message : undefined;
    sendProblem(res, 500, "INTERNAL_ERROR", "Internal Server Error", detail);
  };
}
