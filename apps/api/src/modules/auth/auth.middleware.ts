/**
 * Middleware de autenticación por sesión (Fase 07, ADR-005): lee la cookie,
 * verifica la firma HMAC (CURRENT/PREVIOUS), resuelve la sesión contra la DB y
 * deja `res.locals.session` (id) y `res.locals.user` para el controlador.
 * Sin sesión válida → 401 AUTH_UNAUTHENTICATED.
 */
import type { AuthUser } from "@acore/contracts";
import { ErrorCodes } from "@acore/contracts";
import type { RequestHandler, Response } from "express";
import { sendProblem } from "../../errors.js";
import type { AuthService } from "./auth.service.js";
import { parseCookies, verifySessionValue } from "./session-token.js";

export interface AuthenticatedLocals {
  sessionId: string;
  user: AuthUser;
}

export function createRequireAuth(input: {
  cookieName: string;
  secrets: readonly string[];
  service: AuthService;
}): RequestHandler {
  return (req, res, next) => {
    const cookie = parseCookies(req.header("cookie"))[input.cookieName];
    if (cookie === undefined) {
      unauthenticated(res);
      return;
    }
    const token = verifySessionValue(cookie, input.secrets);
    if (token === undefined) {
      unauthenticated(res);
      return;
    }
    void input.service
      .resolveSession(token)
      .then((session) => {
        if (session === undefined) {
          unauthenticated(res);
          return;
        }
        res.locals.sessionId = session.sessionId;
        res.locals.user = session.user;
        next();
      })
      .catch((error: unknown) => {
        // Falla de DB: no se puede autenticar; 503 antes que 401 para no
        // confundir un problema del servicio con una sesión inválida.
        console.error("[auth] no se pudo resolver la sesión", error);
        sendProblem(
          res,
          503,
          ErrorCodes.DQR_DB_UNAVAILABLE,
          "Base de datos no disponible",
          "Inténtalo de nuevo en unos segundos.",
        );
      });
  };
}

function unauthenticated(res: Response): void {
  sendProblem(
    res,
    401,
    ErrorCodes.AUTH_UNAUTHENTICATED,
    "Sesión requerida",
    "Inicia sesión para continuar.",
  );
}
