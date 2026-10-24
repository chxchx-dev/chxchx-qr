/**
 * CORS mínimo (sin dependencias): permite el origen configurado y las llamadas
 * JSON que necesita la web del generador.
 */
import type { RequestHandler } from "express";

const ALLOWED_METHODS = "GET,POST,OPTIONS";
const ALLOWED_HEADERS = "Content-Type,X-Request-Id";

export function createCorsMiddleware(allowedOrigin: string): RequestHandler {
  return (req, res, next) => {
    res.setHeader("Vary", "Origin");
    const origin = req.header("origin");
    if (origin !== undefined && origin !== allowedOrigin) {
      // Origen no permitido: la respuesta no lleva header CORS; el navegador la bloquea.
      if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
      }
      next();
      return;
    }
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  };
}
