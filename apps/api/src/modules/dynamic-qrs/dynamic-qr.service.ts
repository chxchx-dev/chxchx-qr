/**
 * Servicio de QR dinámicos (Fase 06 + 07): creación con slug único e
 * idempotencia, actualización optimista por versión, listado, duplicado,
 * borrado suave y resolución de slug para la redirección.
 *
 * Fase 07 (ownership): toda operación de gestión recibe el `ownerUserId` de la
 * sesión y las consultas están scoped (usuario A no ve ni toca recursos de B).
 * El slug se genera en el servicio y se reintenta ante colisión.
 */

import type {
  CreateDynamicQrInput,
  DynamicQrResponse,
  ListDynamicQrsQuery,
  ListDynamicQrsResponse,
  PatchDynamicQrInput,
} from "@acore/contracts";
import { DYNAMIC_QR_LIMITS } from "@acore/contracts";
import type { Pool } from "pg";
import { withTransaction } from "../../infrastructure/database/transaction.js";
import { assertFutureExpiration, assertValidDestination } from "./destination-policy.js";
import {
  DynamicQrIdempotencyConflictError,
  DynamicQrNotFoundError,
  DynamicQrVersionConflictError,
} from "./dynamic-qr.errors.js";
import {
  createDynamicQrRepository,
  type DynamicQrRepository,
  type DynamicQrRow,
} from "./dynamic-qr.repository.js";
import { idempotencyLockId, newAuditEventId, newDynamicQrId, sha256Hex } from "./ids.js";
import { generateSlug, isReservedSlug } from "./slug.js";

const MAX_SLUG_ATTEMPTS = 5;
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/** Contexto de auditoría: actor autenticado por sesión + request id. */
export interface RequestContext {
  actorUserId: string;
  requestId?: string;
}

export type RedirectResolution =
  | { kind: "ok"; destinationUrl: string }
  | { kind: "paused" }
  | { kind: "expired" }
  | { kind: "missing" };

export interface DynamicQrService {
  createWithIdempotency(
    body: CreateDynamicQrInput,
    ownerUserId: string,
    idempotency: { key: string; requestHash: string } | undefined,
    ctx: RequestContext,
  ): Promise<{ status: number; body: DynamicQrResponse }>;
  get(id: string, ownerUserId: string): Promise<DynamicQrResponse>;
  list(query: ListDynamicQrsQuery, ownerUserId: string): Promise<ListDynamicQrsResponse>;
  update(
    id: string,
    expectedVersion: number,
    patch: PatchDynamicQrInput,
    ownerUserId: string,
    ctx: RequestContext,
  ): Promise<{ dto: DynamicQrResponse; etag: string }>;
  duplicate(id: string, ownerUserId: string, ctx: RequestContext): Promise<DynamicQrResponse>;
  softDelete(id: string, ownerUserId: string, ctx: RequestContext): Promise<void>;
  resolveSlug(slug: string): Promise<RedirectResolution>;
}

function toDto(row: DynamicQrRow, shortDomain: string): DynamicQrResponse {
  return {
    id: row.id,
    slug: row.slug,
    shortUrl: `${shortDomain}/r/${row.slug}`,
    name: row.name,
    destinationUrl: row.destinationUrl,
    status: row.status,
    version: row.version,
    expiresAt: row.expiresAt === null ? null : row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: string }).code === "23505"
  );
}

/** Nombre de la copia: "original (copia)" sin pasarse del límite del contrato. */
function copyName(name: string): string {
  const suffix = " (copia)";
  const max = DYNAMIC_QR_LIMITS.nameMaxLength;
  return name.length + suffix.length <= max
    ? `${name}${suffix}`
    : `${name.slice(0, max - suffix.length)}${suffix}`;
}

export function createDynamicQrService(input: {
  pool: Pool;
  shortDomain: string;
  slugLength: number;
}): DynamicQrService {
  const repo: DynamicQrRepository = createDynamicQrRepository(input.pool);

  /** Inserta un QR con reintento de slug (cada intento es un tx). */
  async function insertWithSlug(
    ownerUserId: string,
    row: {
      name: string;
      destinationUrl: string;
      status: "active" | "paused";
      expiresAt: string | null;
    },
    audit: {
      action: string;
      metadataJson: unknown;
      ctx: RequestContext;
    },
  ): Promise<DynamicQrRow> {
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug = generateSlug(input.slugLength);
      if (isReservedSlug(slug)) {
        continue;
      }
      try {
        return await withTransaction(input.pool, async (tx) => {
          const created = await repo.insert(tx, {
            id: newDynamicQrId(),
            ownerUserId,
            name: row.name,
            slug,
            destinationUrl: row.destinationUrl,
            status: row.status,
            expiresAt: row.expiresAt,
          });
          // Auditoría atómica con la creación (mismo tx): sin QR sin rastro.
          await repo.insertAudit(tx, {
            id: newAuditEventId(),
            actorUserId: audit.ctx.actorUserId,
            action: audit.action,
            resourceType: "dynamic_qr",
            resourceId: created.id,
            metadataJson: audit.metadataJson,
            requestId: audit.ctx.requestId,
          });
          return created;
        });
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
        // Colisión de slug: se reintenta con otro slug (cada intento es un tx).
      }
    }
    throw new Error("No se pudo generar un slug único tras varios intentos");
  }

  async function create(
    body: CreateDynamicQrInput,
    ownerUserId: string,
    ctx: RequestContext,
  ): Promise<DynamicQrResponse> {
    assertValidDestination(body.destinationUrl);
    assertFutureExpiration(body.expiresAt);
    const status = body.active === false ? "paused" : "active";
    const expiresAt = body.expiresAt === undefined ? null : body.expiresAt;
    const row = await insertWithSlug(
      ownerUserId,
      { name: body.name, destinationUrl: body.destinationUrl, status, expiresAt },
      { action: "create", metadataJson: { name: body.name }, ctx },
    );
    return toDto(row, input.shortDomain);
  }

  return {
    async createWithIdempotency(body, ownerUserId, idempotency, ctx) {
      if (idempotency === undefined) {
        return { status: 201, body: await create(body, ownerUserId, ctx) };
      }
      const keyHash = sha256Hex(idempotency.key);
      const lockId = idempotencyLockId(keyHash);
      const client = await input.pool.connect();
      try {
        // Cast explícito a bigint: evita ambigüedad int4/int8 del overload y
        // valores > 2^31-1 que el int4 no puede representar.
        await client.query("SELECT pg_advisory_lock($1::bigint)", [lockId]);
        const existing = await repo.findIdempotency(client, keyHash, ownerUserId);
        if (existing !== undefined) {
          if (existing.request_hash !== idempotency.requestHash) {
            throw new DynamicQrIdempotencyConflictError();
          }
          return {
            status: existing.response_status,
            body: existing.response_body_json as DynamicQrResponse,
          };
        }
        const dto = await create(body, ownerUserId, ctx);
        await repo.insertIdempotency(client, {
          keyHash,
          ownerUserId,
          route: "create",
          requestHash: idempotency.requestHash,
          responseStatus: 201,
          responseBodyJson: dto,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
        });
        return { status: 201, body: dto };
      } finally {
        await client
          .query("SELECT pg_advisory_unlock($1::bigint)", [lockId])
          .catch(() => undefined);
        client.release();
      }
    },

    async get(id, ownerUserId) {
      const row = await repo.findById(input.pool, id, ownerUserId);
      if (row === undefined) {
        throw new DynamicQrNotFoundError();
      }
      return toDto(row, input.shortDomain);
    },

    async list(query, ownerUserId) {
      const { items, total } = await repo.list(input.pool, query, ownerUserId);
      return {
        items: items.map((row) => toDto(row, input.shortDomain)),
        page: query.page,
        pageSize: query.pageSize,
        total,
      };
    },

    async update(id, expectedVersion, patch, ownerUserId, ctx) {
      if (patch.destinationUrl !== undefined) {
        assertValidDestination(patch.destinationUrl);
      }
      assertFutureExpiration(patch.expiresAt);
      const row = await repo.updateVersioned(input.pool, id, expectedVersion, ownerUserId, patch);
      if (row === undefined) {
        const exists = await repo.findById(input.pool, id, ownerUserId);
        if (exists === undefined) {
          throw new DynamicQrNotFoundError();
        }
        throw new DynamicQrVersionConflictError();
      }
      // Auditoría no bloqueante: un fallo aquí no revierte la actualización.
      await repo
        .insertAudit(input.pool, {
          id: newAuditEventId(),
          actorUserId: ctx.actorUserId,
          action: "update",
          resourceType: "dynamic_qr",
          resourceId: row.id,
          metadataJson: { name: row.name, version: row.version },
          requestId: ctx.requestId,
        })
        .catch((error: unknown) => {
          console.warn("[dynamic-qrs] auditoría de update omitida", error);
        });
      return { dto: toDto(row, input.shortDomain), etag: `"v${row.version}"` };
    },

    async duplicate(id, ownerUserId, ctx) {
      const source = await repo.findById(input.pool, id, ownerUserId);
      if (source === undefined) {
        throw new DynamicQrNotFoundError();
      }
      // La copia arranca pausada salvo que el original esté activo; si el
      // original expiró en el pasado, la copia nace sin expiración.
      const status = source.status === "active" ? "active" : "paused";
      const expiresAt =
        source.expiresAt !== null && source.expiresAt.getTime() > Date.now()
          ? source.expiresAt.toISOString()
          : null;
      const row = await insertWithSlug(
        ownerUserId,
        { name: copyName(source.name), destinationUrl: source.destinationUrl, status, expiresAt },
        {
          action: "duplicate",
          metadataJson: { name: source.name, sourceId: source.id },
          ctx,
        },
      );
      return toDto(row, input.shortDomain);
    },

    async softDelete(id, ownerUserId, ctx) {
      const row = await repo.softDelete(input.pool, id, ownerUserId);
      if (row === undefined) {
        throw new DynamicQrNotFoundError();
      }
      await repo
        .insertAudit(input.pool, {
          id: newAuditEventId(),
          actorUserId: ctx.actorUserId,
          action: "delete",
          resourceType: "dynamic_qr",
          resourceId: row.id,
          metadataJson: { name: row.name },
          requestId: ctx.requestId,
        })
        .catch((error: unknown) => {
          console.warn("[dynamic-qrs] auditoría de delete omitida", error);
        });
    },

    async resolveSlug(slug) {
      const row = await repo.findBySlug(input.pool, slug);
      if (row === undefined) {
        return { kind: "missing" };
      }
      // Bloqueado/eliminado se tratan como inexistente (no se revela el destino).
      if (row.status === "blocked" || row.status === "deleted") {
        return { kind: "missing" };
      }
      if (row.status === "expired") {
        return { kind: "expired" };
      }
      // Transición perezosa: si venció, se marca expirado y se responde 410.
      if (row.expiresAt !== null && row.expiresAt.getTime() <= Date.now()) {
        await repo.markExpired(input.pool, row.id).catch((error: unknown) => {
          console.warn("[dynamic-qrs] no se pudo marcar expirado", error);
        });
        return { kind: "expired" };
      }
      if (row.status === "paused") {
        return { kind: "paused" };
      }
      return { kind: "ok", destinationUrl: row.destinationUrl };
    },
  };
}
