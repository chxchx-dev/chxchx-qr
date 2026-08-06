/**
 * Controlador HTTP de auth (Fase 07): register/login firman y fijan la cookie
 * de sesión; logout la limpia y revoca; me devuelve el perfil. El token en
 * bruto solo existe en la cookie HttpOnly (nunca en JSON ni localStorage).
 */
import { ErrorCodes, loginSchema, registerSchema } from "@acore/contracts";
import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { sendProblem } from "../../errors.js";
import { handleAuthError } from "./auth.errors.js";
import type { AuthService } from "./auth.service.js";
import { sha256Hex } from "./ids.js";
import { clearSessionCookie, serializeSessionCookie, signSessionValue } from "./session-token.js";

function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (issue === undefined) {
    return "La entrada no cumple el contrato.";
  }
  const path = issue.path.join(".");
  return path === "" ? issue.message : `${path}: ${issue.message}`;
}

function schemaInvalid(res: Response, error: z.ZodError): void {
  sendProblem(
    res,
    400,
    ErrorCodes.AUTH_SCHEMA_INVALID,
    "La entrada no cumple el contrato",
    firstIssueMessage(error),
  );
}

export function createAuthController(input: {
  service: AuthService;
  cookieName: string;
  secure: boolean;
  sessionTtlMs: number;
  secretCurrent: string;
}) {
  function setSessionCookie(res: Response, token: string): void {
    res.setHeader(
      "Set-Cookie",
      serializeSessionCookie({
        name: input.cookieName,
        value: signSessionValue(token, input.secretCurrent),
        maxAgeSeconds: Math.floor(input.sessionTtlMs / 1000),
        secure: input.secure,
      }),
    );
  }

  function clearCookie(res: Response): void {
    res.setHeader("Set-Cookie", clearSessionCookie(input.cookieName, input.secure));
  }

  return {
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        schemaInvalid(res, parsed.error);
        return;
      }
      try {
        const { user, token } = await input.service.register(parsed.data, {
          userAgentSummary: summarizeUserAgent(req.header("user-agent")),
          ipHash: req.ip === undefined ? undefined : hashIp(req.ip),
        });
        setSessionCookie(res, token);
        res.status(201).set("Cache-Control", "no-store").json({ user });
      } catch (error) {
        handleAuthError(error, res, next);
      }
    },

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        schemaInvalid(res, parsed.error);
        return;
      }
      try {
        const { user, token } = await input.service.login(parsed.data, {
          userAgentSummary: summarizeUserAgent(req.header("user-agent")),
          ipHash: req.ip === undefined ? undefined : hashIp(req.ip),
        });
        setSessionCookie(res, token);
        res.set("Cache-Control", "no-store").json({ user });
      } catch (error) {
        handleAuthError(error, res, next);
      }
    },

    async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
      const sessionId = res.locals.sessionId as string | undefined;
      if (sessionId === undefined) {
        // Sin sesión no hay nada que revocar; se responde como logout exitoso.
        clearCookie(res);
        res.status(204).end();
        return;
      }
      try {
        await input.service.logout(sessionId);
        clearCookie(res);
        res.status(204).end();
      } catch (error) {
        handleAuthError(error, res, next);
      }
    },

    async me(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const user = res.locals.user as { id: string };
        const profile = await input.service.getProfile(user.id);
        res.set("Cache-Control", "no-store").json({ user: profile });
      } catch (error) {
        handleAuthError(error, res, next);
      }
    },
  };
}

/** Resumen corto del user-agent para la sesión (privacy, docs/06 §3). */
function summarizeUserAgent(ua: string | undefined): string | undefined {
  if (ua === undefined) {
    return undefined;
  }
  const match = /^[\w/.-]+/.exec(ua.trim());
  return (match?.[0] ?? ua.trim()).slice(0, 64);
}

/** Hash de la IP para la sesión (nunca la IP completa, docs/06 §3). */
function hashIp(ip: string): string {
  return sha256Hex(ip);
}
