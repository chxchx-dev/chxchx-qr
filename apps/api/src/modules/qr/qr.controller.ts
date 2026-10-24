/** Controlador HTTP para validar y generar QR estáticos. */
import { ErrorCodes, qrContentSchema, qrOptionsSchema } from "@acore/contracts";
import { validateQr } from "@acore/qr-core";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { sendProblem } from "../../errors.js";
import { handleQrError } from "./qr.http-errors.js";
import { renderQrResolved, resolveQrRequest } from "./qr.service.js";

const REQUEST_SCHEMA = z.object({
  content: qrContentSchema,
  options: qrOptionsSchema.optional(),
});

function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (issue === undefined) return "La entrada no cumple el contrato.";
  const path = issue.path.join(".");
  return path === "" ? issue.message : `${path}: ${issue.message}`;
}

export function createQrController() {
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
        const result = validateQr(resolveQrRequest(parsed.data));
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
        const result = await renderQrResolved(resolveQrRequest(parsed.data));
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
  };
}
