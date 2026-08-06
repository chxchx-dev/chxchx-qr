/**
 * CSRF (docs/07 §13): en métodos mutables (POST/PATCH/PUT/DELETE) se exige un
 * header `Origin` perteneciente a los orígenes permitidos (WEB_ORIGIN y
 * PUBLIC_API_URL). Un navegador siempre envía Origin en mutaciones, incluso
 * same-site; un atacante cross-site no puede forjarlo. Los clientes no-browser
 * (scripts/tests) deben enviar Origin explícitamente.
 */
import { ErrorCodes } from "@acore/contracts";
import type { RequestHandler } from "express";
import { sendProblem } from "../../errors.js";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/** Normaliza un origen para comparar (host en minúsculas, sin barra final). */
export function normalizeOrigin(origin: string): string {
  try {
    const parsed = new URL(origin);
    parsed.pathname = "/";
    parsed.search = "";
    parsed.hash = "";
    parsed.username = "";
    parsed.password = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return origin.trim().toLowerCase();
  }
}

export function createOriginMiddleware(allowedOrigins: readonly string[]): RequestHandler {
  const allowed = new Set(allowedOrigins.map(normalizeOrigin));
  return (req, res, next) => {
    if (!MUTATING_METHODS.has(req.method)) {
      next();
      return;
    }
    const origin = req.header("origin");
    if (origin === undefined || !allowed.has(normalizeOrigin(origin))) {
      sendProblem(
        res,
        403,
        ErrorCodes.AUTH_ORIGIN_FORBIDDEN,
        "Origen no permitido",
        "La solicitud no proviene de un origen autorizado.",
      );
      return;
    }
    next();
  };
}
