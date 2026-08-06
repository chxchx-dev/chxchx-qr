/**
 * Controlador de redirección (Fase 06): /r/{slug} es público, fuera de /api.
 * - activo → 302 al destino (headers seguros, sin cache de navegador);
 * - pausado → 200 página segura (CSP sandbox) sin revelar el destino;
 * - expirado → 410; inexistente/bloqueado/eliminado → 404.
 */
import { ErrorCodes } from "@acore/contracts";
import type { NextFunction, Request, Response } from "express";

function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  return typeof value === "string" ? value : "";
}

import { sendProblem } from "../../errors.js";
import { handleDynamicQrError } from "../dynamic-qrs/dynamic-qr.errors.js";
import type { RedirectResolution } from "../dynamic-qrs/dynamic-qr.service.js";
import { redirectHeaders } from "./redirect-cache-policy.js";

/** Página mínima para el estado pausado: sin scripts, sin destino, sin rastreo. */
const PAUSED_PAGE = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Enlace pausado</title>
</head>
<body>
  <main style="max-width:36rem;margin:4rem auto;font-family:system-ui,sans-serif;text-align:center">
    <h1>Este enlace está pausado</h1>
    <p>El propietario lo ha desactivado temporalmente.</p>
  </main>
</body>
</html>`;

export function createRedirectController(service: {
  resolve: (slug: string) => Promise<RedirectResolution>;
}) {
  return {
    async redirect(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const resolution = await service.resolve(routeParam(req, "slug"));
        if (resolution.kind === "ok") {
          res.status(302).set("Location", resolution.destinationUrl).set(redirectHeaders()).end();
          return;
        }
        if (resolution.kind === "paused") {
          res
            .status(200)
            .set("Content-Type", "text/html; charset=utf-8")
            .set("Content-Security-Policy", "sandbox")
            .set("Cache-Control", "no-store")
            .set("X-Content-Type-Options", "nosniff")
            .send(PAUSED_PAGE);
          return;
        }
        if (resolution.kind === "expired") {
          // No cachear estados terminales: un 410/404 cacheado rompería un QR
          // reactivado (la URL y el destino son mutables).
          res.set("Cache-Control", "no-store");
          sendProblem(res, 410, ErrorCodes.DQR_EXPIRED, "El enlace expiró");
          return;
        }
        res.set("Cache-Control", "no-store");
        sendProblem(res, 404, ErrorCodes.DQR_NOT_FOUND, "Enlace no encontrado");
      } catch (error) {
        handleDynamicQrError(error, res, next);
      }
    },
  };
}
