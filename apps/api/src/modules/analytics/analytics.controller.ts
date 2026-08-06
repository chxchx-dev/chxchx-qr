/**
 * Controlador HTTP de analítica (Fase 08): GET /api/v1/dynamic-qrs/:id/analytics
 * con sesión (requireAuth) y scoping por owner en el servicio. Respuestas con
 * Cache-Control: no-store (datos dinámicos de propiedad del usuario).
 */
import { analyticsQuerySchema, ErrorCodes } from "@acore/contracts";
import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { sendProblem } from "../../errors.js";
import { handleAnalyticsError } from "./analytics.errors.js";
import type { AnalyticsService } from "./analytics.service.js";

function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (issue === undefined) {
    return "La entrada no cumple el contrato.";
  }
  const path = issue.path.join(".");
  return path === "" ? issue.message : `${path}: ${issue.message}`;
}

function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  return typeof value === "string" ? value : "";
}

function ownerUserId(res: Response): string {
  const user = res.locals.user as { id: string } | undefined;
  return user?.id ?? "";
}

export function createAnalyticsController(service: AnalyticsService) {
  return {
    async get(req: Request, res: Response, next: NextFunction): Promise<void> {
      const parsed = analyticsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendProblem(
          res,
          400,
          ErrorCodes.ANL_INVALID_RANGE,
          "Consulta de analítica inválida",
          firstIssueMessage(parsed.error),
        );
        return;
      }
      try {
        const body = await service.get(routeParam(req, "id"), ownerUserId(res), parsed.data);
        res.set("Cache-Control", "no-store").json(body);
      } catch (error) {
        handleAnalyticsError(error, res, next);
      }
    },
  };
}
