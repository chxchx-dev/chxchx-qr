/**
 * Controlador HTTP de administración (Fase 08). El reporte de abuso es público
 * (rate limit propio, sin sesión); el resto exige sesión + rol admin + Origin.
 * La IP del reportero solo se persiste hasheada (docs/06 §3, mismo patrón que
 * las sesiones).
 */
import {
  abuseReportSchema,
  abuseReportStatusSchema,
  adminActionSchema,
  ErrorCodes,
  pageParam,
  pageSizeParam,
} from "@acore/contracts";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { sendProblem } from "../../errors.js";
import { sha256Hex } from "../auth/ids.js";
import { handleAdminError } from "./admin.errors.js";
import type { AdminService } from "./admin.service.js";

const listQuerySchema = z.object({
  page: pageParam.optional(),
  pageSize: pageSizeParam.optional(),
  status: abuseReportStatusSchema.optional(),
});

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

function actorUserId(res: Response): string {
  const user = res.locals.user as { id: string } | undefined;
  return user?.id ?? "";
}

function requestIdOf(res: Response): string | undefined {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function parseReason(req: Request, res: Response): { reason: string } | undefined {
  const parsed = adminActionSchema.safeParse(req.body);
  if (!parsed.success) {
    sendProblem(
      res,
      400,
      ErrorCodes.ADM_SCHEMA_INVALID,
      "Acción de moderación inválida",
      firstIssueMessage(parsed.error),
    );
    return undefined;
  }
  return parsed.data;
}

export function createAdminController(service: AdminService) {
  return {
    /** Público: reporta un QR por slug (rate limit por IP). */
    async reportAbuse(req: Request, res: Response, next: NextFunction): Promise<void> {
      const parsed = abuseReportSchema.safeParse(req.body);
      if (!parsed.success) {
        sendProblem(
          res,
          400,
          ErrorCodes.ABUSE_SCHEMA_INVALID,
          "Reporte de abuso inválido",
          firstIssueMessage(parsed.error),
        );
        return;
      }
      try {
        const ipHash = req.ip === undefined ? undefined : sha256Hex(req.ip);
        const requestId = requestIdOf(res);
        const report = await service.reportAbuse({
          ...parsed.data,
          ...(ipHash !== undefined ? { ipHash } : {}),
          ...(requestId !== undefined ? { requestId } : {}),
        });
        res.status(201).set("Cache-Control", "no-store").json(report);
      } catch (error) {
        handleAdminError(error, res, next);
      }
    },

    /** Admin: cola de reportes con paginación y filtro por estado. */
    async listAbuseReports(req: Request, res: Response, next: NextFunction): Promise<void> {
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendProblem(
          res,
          400,
          ErrorCodes.ADM_SCHEMA_INVALID,
          "Filtros inválidos",
          firstIssueMessage(parsed.error),
        );
        return;
      }
      try {
        const body = await service.listAbuseReports({
          page: parsed.data.page ?? 1,
          pageSize: parsed.data.pageSize ?? 20,
          status: parsed.data.status,
        });
        res.set("Cache-Control", "no-store").json(body);
      } catch (error) {
        handleAdminError(error, res, next);
      }
    },

    async resolveAbuseReport(req: Request, res: Response, next: NextFunction): Promise<void> {
      await resolveReport(service, req, res, next, "resolved");
    },

    async dismissAbuseReport(req: Request, res: Response, next: NextFunction): Promise<void> {
      await resolveReport(service, req, res, next, "dismissed");
    },

    async blockQr(req: Request, res: Response, next: NextFunction): Promise<void> {
      const body = parseReason(req, res);
      if (body === undefined) {
        return;
      }
      try {
        await service.blockQr(
          routeParam(req, "id"),
          body.reason,
          actorUserId(res),
          requestIdOf(res),
        );
        res.status(204).end();
      } catch (error) {
        handleAdminError(error, res, next);
      }
    },

    async unblockQr(req: Request, res: Response, next: NextFunction): Promise<void> {
      const body = parseReason(req, res);
      if (body === undefined) {
        return;
      }
      try {
        await service.unblockQr(
          routeParam(req, "id"),
          body.reason,
          actorUserId(res),
          requestIdOf(res),
        );
        res.status(204).end();
      } catch (error) {
        handleAdminError(error, res, next);
      }
    },

    async blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
      const body = parseReason(req, res);
      if (body === undefined) {
        return;
      }
      try {
        await service.blockUser(
          routeParam(req, "id"),
          body.reason,
          actorUserId(res),
          requestIdOf(res),
        );
        res.status(204).end();
      } catch (error) {
        handleAdminError(error, res, next);
      }
    },

    async unblockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
      const body = parseReason(req, res);
      if (body === undefined) {
        return;
      }
      try {
        await service.unblockUser(
          routeParam(req, "id"),
          body.reason,
          actorUserId(res),
          requestIdOf(res),
        );
        res.status(204).end();
      } catch (error) {
        handleAdminError(error, res, next);
      }
    },
  };
}

async function resolveReport(
  service: AdminService,
  req: Request,
  res: Response,
  next: NextFunction,
  status: "resolved" | "dismissed",
): Promise<void> {
  try {
    await service.resolveAbuseReport(routeParam(req, "id"), status, actorUserId(res));
    res.status(204).end();
  } catch (error) {
    handleAdminError(error, res, next);
  }
}
