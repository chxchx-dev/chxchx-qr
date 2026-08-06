/**
 * Controlador HTTP de QR dinámicos (Fase 06 + 07): create con Idempotency-Key,
 * listado con paginación/filtros, get, patch con If-Match/ETag, duplicado y
 * borrado suave. El owner viene de la sesión (requireAuth): `res.locals.user`.
 */
import {
  createDynamicQrSchema,
  ErrorCodes,
  listDynamicQrsQuerySchema,
  patchDynamicQrSchema,
} from "@acore/contracts";
import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { sendProblem } from "../../errors.js";
import { DynamicQrVersionConflictError, handleDynamicQrError } from "./dynamic-qr.errors.js";
import type { DynamicQrService, RequestContext } from "./dynamic-qr.service.js";
import { sha256Hex } from "./ids.js";

const MIN_IDEMPOTENCY_KEY_LENGTH = 8;

function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (issue === undefined) {
    return "La entrada no cumple el contrato.";
  }
  const path = issue.path.join(".");
  return path === "" ? issue.message : `${path}: ${issue.message}`;
}

/** Contexto de auditoría: actor de la sesión (requerido por requireAuth). */
function requestContext(res: Response): RequestContext {
  const requestId = res.getHeader("x-request-id");
  const user = res.locals.user as { id: string } | undefined;
  const actorUserId = user?.id ?? "";
  return {
    actorUserId,
    ...(typeof requestId === "string" ? { requestId } : {}),
  };
}

/** Parámetro de ruta de Express 5 (string | string[] → string). */
function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  return typeof value === "string" ? value : "";
}

/** Acepta `v3` o `"v3"` (ETag/If-Match); devuelve la versión o undefined. */
export function parseIfMatch(header: string | undefined): number | undefined {
  if (header === undefined) {
    return undefined;
  }
  const match = /^"?v(\d+)"?$/.exec(header.trim());
  if (match === null) {
    return undefined;
  }
  const version = Number.parseInt(match[1] ?? "", 10);
  return Number.isInteger(version) && version >= 1 ? version : undefined;
}

export function createDynamicQrController(service: DynamicQrService) {
  return {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      const parsed = createDynamicQrSchema.safeParse(req.body);
      if (!parsed.success) {
        sendProblem(
          res,
          400,
          ErrorCodes.DQR_SCHEMA_INVALID,
          "La entrada no cumple el contrato",
          firstIssueMessage(parsed.error),
        );
        return;
      }
      const idempotencyKey = req.header("idempotency-key");
      let idempotency: { key: string; requestHash: string } | undefined;
      if (idempotencyKey !== undefined && idempotencyKey.trim() !== "") {
        if (idempotencyKey.trim().length < MIN_IDEMPOTENCY_KEY_LENGTH) {
          sendProblem(
            res,
            400,
            ErrorCodes.DQR_SCHEMA_INVALID,
            "Idempotency-Key inválida",
            "La Idempotency-Key debe tener al menos 8 caracteres.",
          );
          return;
        }
        idempotency = {
          key: idempotencyKey.trim(),
          requestHash: sha256Hex(JSON.stringify(req.body)),
        };
      }
      try {
        const { status, body } = await service.createWithIdempotency(
          parsed.data,
          ownerUserId(res),
          idempotency,
          requestContext(res),
        );
        res.status(status).set("Cache-Control", "no-store").json(body);
      } catch (error) {
        handleDynamicQrError(error, res, next);
      }
    },

    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      const parsed = listDynamicQrsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendProblem(
          res,
          400,
          ErrorCodes.DQR_SCHEMA_INVALID,
          "Filtros inválidos",
          firstIssueMessage(parsed.error),
        );
        return;
      }
      try {
        const body = await service.list(parsed.data, ownerUserId(res));
        res.set("Cache-Control", "no-store").json(body);
      } catch (error) {
        handleDynamicQrError(error, res, next);
      }
    },

    async get(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = await service.get(routeParam(req, "id"), ownerUserId(res));
        res.set("Cache-Control", "no-store").json(body);
      } catch (error) {
        handleDynamicQrError(error, res, next);
      }
    },

    async patch(req: Request, res: Response, next: NextFunction): Promise<void> {
      const parsed = patchDynamicQrSchema.safeParse(req.body);
      if (!parsed.success) {
        sendProblem(
          res,
          400,
          ErrorCodes.DQR_SCHEMA_INVALID,
          "La entrada no cumple el contrato",
          firstIssueMessage(parsed.error),
        );
        return;
      }
      const version = parseIfMatch(req.header("if-match"));
      if (version === undefined) {
        sendProblem(
          res,
          428,
          ErrorCodes.DQR_VERSION_REQUIRED,
          "If-Match requerido",
          'Envía If-Match: "v{n}" con la versión actual.',
        );
        return;
      }
      try {
        const { dto, etag } = await service.update(
          routeParam(req, "id"),
          version,
          parsed.data,
          ownerUserId(res),
          requestContext(res),
        );
        res.set("ETag", etag).set("Cache-Control", "no-store").json(dto);
      } catch (error) {
        if (error instanceof DynamicQrVersionConflictError) {
          handleDynamicQrError(error, res, next);
          return;
        }
        handleDynamicQrError(error, res, next);
      }
    },

    async duplicate(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = await service.duplicate(
          routeParam(req, "id"),
          ownerUserId(res),
          requestContext(res),
        );
        res.status(201).set("Cache-Control", "no-store").json(body);
      } catch (error) {
        handleDynamicQrError(error, res, next);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        await service.softDelete(routeParam(req, "id"), ownerUserId(res), requestContext(res));
        res.status(204).end();
      } catch (error) {
        handleDynamicQrError(error, res, next);
      }
    },
  };
}

function ownerUserId(res: Response): string {
  const user = res.locals.user as { id: string } | undefined;
  return user?.id ?? "";
}
