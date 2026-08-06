/** Controlador HTTP de los endpoints QR (route → controller → service → qr-core). */
import { promises as fs } from "node:fs";
import type { ApiConfig } from "@acore/config";
import { ErrorCodes, qrContentSchema, qrOptionsSchema } from "@acore/contracts";
import { QrUnsupportedFormatError, validateQr } from "@acore/qr-core";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { sendProblem } from "../../errors.js";
import { decodeLogoDataUri, logoPolicyFromConfig, processLogo } from "./logo.service.js";
import { removeUpload, runLogoUpload } from "./logo-upload.middleware.js";
import { handleQrError } from "./qr.http-errors.js";
import { renderQrResolved, resolveQrRequest } from "./qr.service.js";

const REQUEST_SCHEMA = z.object({
  content: qrContentSchema,
  options: qrOptionsSchema.optional(),
});

function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (issue === undefined) {
    return "La entrada no cumple el contrato.";
  }
  const path = issue.path.join(".");
  return path === "" ? issue.message : `${path}: ${issue.message}`;
}

export function createQrController(config: ApiConfig) {
  return {
    validate(req: Request, res: Response, next: NextFunction): void {
      const parsed = REQUEST_SCHEMA.safeParse(req.body);
      if (!parsed.success) {
        sendProblem(
          res,
          400,
          ErrorCodes.QR_SCHEMA_INVALID,
          "La entrada no cumple el contrato",
          firstIssueMessage(parsed.error),
        );
        return;
      }
      try {
        const input = resolveQrRequest(parsed.data);
        const result = validateQr(input);
        res.json(result);
      } catch (error) {
        handleQrError(error, res, next);
      }
    },

    async render(req: Request, res: Response, next: NextFunction): Promise<void> {
      const parsed = REQUEST_SCHEMA.safeParse(req.body);
      if (!parsed.success) {
        sendProblem(
          res,
          400,
          ErrorCodes.QR_SCHEMA_INVALID,
          "La entrada no cumple el contrato",
          firstIssueMessage(parsed.error),
        );
        return;
      }
      try {
        const input = resolveQrRequest(parsed.data);
        if (input.options.format === "png" && !config.QR_ENABLE_SERVER_PNG) {
          throw new QrUnsupportedFormatError(
            "El renderizado PNG está deshabilitado en este entorno.",
          );
        }
        if (input.options.logo !== undefined && !config.QR_ENABLE_LOGO) {
          throw new QrUnsupportedFormatError("Los logos están deshabilitados en este entorno.");
        }
        if (input.options.logo !== undefined) {
          // El servidor nunca confía en el cliente: re-valida el data URI antes
          // de renderizar (firma mágica + dimensiones + límite de bytes).
          await decodeLogoDataUri(input.options.logo, logoPolicyFromConfig(config));
        }
        const result = await renderQrResolved(input);
        // Enviar el body como Buffer para conservar el Content-Type exacto (sin charset).
        const body =
          typeof result.body === "string" ? Buffer.from(result.body, "utf8") : result.body;
        res
          .status(200)
          .set("Content-Type", result.contentType)
          .set("Content-Disposition", `attachment; filename="${result.filename}"`)
          .set("Cache-Control", "no-store")
          .send(body);
      } catch (error) {
        handleQrError(error, res, next);
      }
    },

    /**
     * POST /api/v1/qr/logo (multipart, campo "logo"). Valida por firma mágica,
     * re-encodea a PNG sin metadata y devuelve el data URI (stateless).
     */
    async uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
      runLogoUpload(req, res, async (error: unknown) => {
        if (error !== undefined && error !== null) {
          handleQrError(error, res, next);
          return;
        }
        const file = req.file;
        try {
          if (file === undefined) {
            sendProblem(
              res,
              400,
              ErrorCodes.QR_LOGO_INVALID,
              "Logo no recibido",
              'Envía el archivo en el campo multipart "logo".',
            );
            return;
          }
          const bytes = new Uint8Array(await fs.readFile(file.path));
          const processed = await processLogo(bytes, logoPolicyFromConfig(config));
          res.status(200).set("Cache-Control", "no-store").json({
            dataUri: processed.dataUri,
            width: processed.width,
            height: processed.height,
            format: "png",
          });
        } catch (uploadError) {
          handleQrError(uploadError, res, next);
        } finally {
          await removeUpload(file);
        }
      });
    },
  };
}
