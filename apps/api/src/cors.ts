/**
 * CORS mínimo (sin dependencias): permite solo el origen configurado (WEB_ORIGIN)
 * y los métodos/headers que usa la web. Desde la Fase 07 la API acepta
 * credenciales (cookie de sesión HttpOnly); el origen permitido se devuelve
 * exacto (nunca `*` con credenciales).
 */
import type { RequestHandler } from "express";

const ALLOWED_METHODS = "GET,POST,PATCH,DELETE,OPTIONS";
const ALLOWED_HEADERS = "Content-Type,X-Request-Id,If-Match,Idempotency-Key";

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
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  };
}
