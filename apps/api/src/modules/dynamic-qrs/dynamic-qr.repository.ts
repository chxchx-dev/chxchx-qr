/**
 * Repositorio de QR dinámicos (Fase 06 + 07). Todas las consultas viven en
 * `dynamic-qr.sql.ts` y son parameterizadas; los `set` del UPDATE se
 * construyen aquí con whitelist de campos (nunca con entrada del usuario).
 *
 * Fase 07 (ownership): findById, update, softDelete y list reciben
 * `ownerUserId` y lo llevan al WHERE (aislamiento A/B). findBySlug y
 * markExpired son públicos (redirect).
 */

import type { DynamicQrStatus } from "@acore/contracts";
import type { Pool, QueryResult, QueryResultRow } from "pg";
import { SQL } from "./dynamic-qr.sql.js";

/** Interfaz mínima: Pool y PoolClient comparten `query(text, values)`. */
interface Queryable {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface DynamicQrRow {
  id: string;
  ownerUserId: string | null;
  name: string;
  slug: string;
  destinationUrl: string;
  status: DynamicQrStatus;
  version: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface DynamicQrPatch {
  name?: string | undefined;
  destinationUrl?: string | undefined;
  active?: boolean | undefined;
  /** undefined = no tocar; null = quitar expiración. */
  expiresAt?: string | null | undefined;
}

export interface ListQuery {
  page: number;
  pageSize: number;
  search?: string | undefined;
  status?: DynamicQrStatus | undefined;
}

interface IdempotencyRow {
  key_hash: string;
  route: string;
  request_hash: string;
  response_status: number;
  response_body_json: unknown;
  expires_at: Date;
}

interface RowShape {
  id: string;
  owner_user_id: string | null;
  name: string;
  slug: string;
  destination_url: string;
  status: DynamicQrStatus;
  version: number;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

function toRow(row: RowShape): DynamicQrRow {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    slug: row.slug,
    destinationUrl: row.destination_url,
    status: row.status,
    version: row.version,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

/** Escapa comodines de ILIKE para tratar el search como substring literal. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export interface DynamicQrRepository {
  insert(
    db: Queryable,
    row: {
      id: string;
      ownerUserId: string;
      name: string;
      slug: string;
      destinationUrl: string;
      status: DynamicQrStatus;
      expiresAt: string | null;
    },
  ): Promise<DynamicQrRow>;
  findById(db: Queryable, id: string, ownerUserId: string): Promise<DynamicQrRow | undefined>;
  findBySlug(db: Queryable, slug: string): Promise<DynamicQrRow | undefined>;
  updateVersioned(
    db: Queryable,
    id: string,
    expectedVersion: number,
    ownerUserId: string,
    patch: DynamicQrPatch,
  ): Promise<DynamicQrRow | undefined>;
  softDelete(db: Queryable, id: string, ownerUserId: string): Promise<DynamicQrRow | undefined>;
  markExpired(db: Queryable, id: string): Promise<DynamicQrRow | undefined>;
  list(
    db: Queryable,
    query: ListQuery,
    ownerUserId: string,
  ): Promise<{ items: DynamicQrRow[]; total: number }>;
  insertIdempotency(
    db: Queryable,
    row: {
      keyHash: string;
      ownerUserId: string;
      route: string;
      requestHash: string;
      responseStatus: number;
      responseBodyJson: unknown;
      expiresAt: Date;
    },
  ): Promise<number>;
  findIdempotency(
    db: Queryable,
    keyHash: string,
    ownerUserId: string,
  ): Promise<IdempotencyRow | undefined>;
  insertAudit(
    db: Queryable,
    row: {
      id: string;
      actorUserId: string;
      action: string;
      resourceType: string;
      resourceId: string;
      metadataJson: unknown;
      requestId: string | undefined;
    },
  ): Promise<void>;
}

export function createDynamicQrRepository(_pool: Pool): DynamicQrRepository {
  return {
    async insert(db, row) {
      const result = await db.query<RowShape>(SQL.insert, [
        row.id,
        row.ownerUserId,
        row.name,
        row.slug,
        row.destinationUrl,
        row.status,
        row.expiresAt,
      ]);
      const inserted = result.rows[0];
      if (inserted === undefined) {
        throw new Error("La inserción de dynamic_qrs no devolvió fila");
      }
      return toRow(inserted);
    },

    async findById(db, id, ownerUserId) {
      const result = await db.query<RowShape>(SQL.findById, [id, ownerUserId]);
      return result.rows[0] === undefined ? undefined : toRow(result.rows[0]);
    },

    async findBySlug(db, slug) {
      const result = await db.query<RowShape>(SQL.findBySlug, [slug]);
      return result.rows[0] === undefined ? undefined : toRow(result.rows[0]);
    },

    async updateVersioned(db, id, expectedVersion, ownerUserId, patch) {
      const sets: string[] = [];
      const values: unknown[] = [id, expectedVersion, ownerUserId];
      let index = 4;
      if (patch.name !== undefined) {
        sets.push(`name = $${index}`);
        values.push(patch.name);
        index += 1;
      }
      if (patch.destinationUrl !== undefined) {
        sets.push(`destination_url = $${index}`);
        values.push(patch.destinationUrl);
        index += 1;
      }
      if (patch.active !== undefined) {
        sets.push(`status = $${index}`);
        values.push(patch.active ? "active" : "paused");
        index += 1;
      }
      if (patch.expiresAt !== undefined) {
        sets.push(`expires_at = $${index}`);
        values.push(patch.expiresAt);
        index += 1;
      }
      const result = await db.query<RowShape>(SQL.updateVersioned(sets.join(", ")), values);
      return result.rows[0] === undefined ? undefined : toRow(result.rows[0]);
    },

    async softDelete(db, id, ownerUserId) {
      const result = await db.query<RowShape>(SQL.softDelete, [id, ownerUserId]);
      return result.rows[0] === undefined ? undefined : toRow(result.rows[0]);
    },

    async markExpired(db, id) {
      const result = await db.query<RowShape>(SQL.markExpired, [id]);
      return result.rows[0] === undefined ? undefined : toRow(result.rows[0]);
    },

    async list(db, query, ownerUserId) {
      const conditions: string[] = [" AND owner_user_id = $1"];
      const values: unknown[] = [ownerUserId];
      let index = 2;
      if (query.search !== undefined) {
        const pattern = `%${escapeLike(query.search)}%`;
        conditions.push(` AND (name ILIKE $${index} OR destination_url ILIKE $${index + 1})`);
        values.push(pattern, pattern);
        index += 2;
      }
      if (query.status !== undefined) {
        conditions.push(` AND status = $${index}`);
        values.push(query.status);
        index += 1;
      }
      const where = conditions.join("");
      const countResult = await db.query<{ total: number }>(SQL.count(where), values);
      const limitIndex = index;
      const offsetIndex = index + 1;
      const listResult = await db.query<RowShape>(SQL.list(where, limitIndex, offsetIndex), [
        ...values,
        query.pageSize,
        (query.page - 1) * query.pageSize,
      ]);
      return { items: listResult.rows.map(toRow), total: countResult.rows[0]?.total ?? 0 };
    },

    async insertIdempotency(db, row) {
      const result = await db.query(SQL.insertIdempotency, [
        row.keyHash,
        row.ownerUserId,
        row.route,
        row.requestHash,
        row.responseStatus,
        JSON.stringify(row.responseBodyJson),
        row.expiresAt,
      ]);
      return result.rowCount ?? 0;
    },

    async findIdempotency(db, keyHash, ownerUserId) {
      const result = await db.query<IdempotencyRow>(SQL.findIdempotency, [keyHash, ownerUserId]);
      return result.rows[0];
    },

    async insertAudit(db, row) {
      await db.query(SQL.insertAudit, [
        row.id,
        row.actorUserId,
        row.action,
        row.resourceType,
        row.resourceId,
        JSON.stringify(row.metadataJson ?? {}),
        row.requestId ?? null,
      ]);
    },
  };
}
