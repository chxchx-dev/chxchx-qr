/**
 * Repositorio de administración (Fase 08): reportes de abuso, verificación de
 * rol admin y cambios de estado de QR/usuarios con SQL explícito (ADR-006).
 * La moderación NO está scoped por owner (el admin actúa sobre cualquier
 * recurso); la auditoría de cada acción se hace en el servicio.
 */
import type { AbuseReportStatus } from "@acore/contracts";
import type { Pool, QueryResult, QueryResultRow } from "pg";

interface Queryable {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface AbuseReportRow {
  id: string;
  qrId: string | null;
  slug: string;
  reason: string;
  status: AbuseReportStatus;
  createdAt: Date;
}

interface AbuseReportShape {
  id: string;
  qr_id: string | null;
  slug: string;
  reason: string;
  status: AbuseReportStatus;
  created_at: Date;
}

interface QrStatusRow {
  id: string;
  name: string;
  status: string;
}

interface UserStatusRow {
  id: string;
  email_normalized: string;
  status: string;
}

function toReport(row: AbuseReportShape): AbuseReportRow {
  return {
    id: row.id,
    qrId: row.qr_id,
    slug: row.slug,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
  };
}

export interface ListAbuseQuery {
  page?: number | undefined;
  pageSize?: number | undefined;
  status?: AbuseReportStatus | undefined;
}

export interface AdminRepository {
  insertAbuseReport(
    db: Queryable,
    row: {
      id: string;
      qrId: string;
      slug: string;
      reason: string;
      reporterIpHash: string | undefined;
      requestId: string | undefined;
    },
  ): Promise<void>;
  findQrIdBySlug(db: Queryable, slug: string): Promise<string | undefined>;
  listAbuseReports(
    db: Queryable,
    query: ListAbuseQuery,
  ): Promise<{ items: AbuseReportRow[]; total: number }>;
  setAbuseReportStatus(
    db: Queryable,
    id: string,
    status: AbuseReportStatus,
    resolvedBy: string,
  ): Promise<boolean>;
  isAdmin(db: Queryable, userId: string): Promise<boolean>;
  setQrStatus(
    db: Queryable,
    id: string,
    status: "blocked" | "active",
  ): Promise<QrStatusRow | undefined>;
  setUserStatus(
    db: Queryable,
    userId: string,
    status: "blocked" | "active",
  ): Promise<UserStatusRow | undefined>;
  revokeUserSessions(db: Queryable, userId: string): Promise<void>;
}

export function createAdminRepository(_pool: Pool): AdminRepository {
  return {
    async insertAbuseReport(db, row) {
      await db.query(
        `
          INSERT INTO abuse_reports (id, qr_id, slug, reason, status, reporter_ip_hash, request_id)
          VALUES ($1, $2, $3, $4, 'open', $5, $6)
        `,
        [row.id, row.qrId, row.slug, row.reason, row.reporterIpHash ?? null, row.requestId ?? null],
      );
    },

    async findQrIdBySlug(db, slug) {
      const result = await db.query<{ id: string }>(
        "SELECT id FROM dynamic_qrs WHERE slug = $1 AND deleted_at IS NULL",
        [slug],
      );
      return result.rows[0]?.id;
    },

    async listAbuseReports(db, query) {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const conditions: string[] = [];
      const values: unknown[] = [];
      let index = 1;
      if (query.status !== undefined) {
        conditions.push(`status = $${index}`);
        values.push(query.status);
        index += 1;
      }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const countResult = await db.query<{ total: number }>(
        `SELECT count(*)::int AS total FROM abuse_reports ${where}`,
        values,
      );
      const limitIndex = index;
      const offsetIndex = index + 1;
      const listResult = await db.query<AbuseReportShape>(
        `
          SELECT id, qr_id, slug, reason, status, created_at
          FROM abuse_reports ${where}
          ORDER BY created_at DESC, id DESC
          LIMIT $${limitIndex} OFFSET $${offsetIndex}
        `,
        [...values, pageSize, (page - 1) * pageSize],
      );
      return { items: listResult.rows.map(toReport), total: countResult.rows[0]?.total ?? 0 };
    },

    async setAbuseReportStatus(db, id, status, resolvedBy) {
      const result = await db.query(
        `
          UPDATE abuse_reports
          SET status = $2, resolved_at = now(), resolved_by = $3, updated_at = now()
          WHERE id = $1
          RETURNING id
        `,
        [id, status, resolvedBy],
      );
      return (result.rowCount ?? 0) > 0;
    },

    async isAdmin(db, userId) {
      const result = await db.query<{ one: number }>(
        "SELECT 1 AS one FROM admin_roles WHERE user_id = $1",
        [userId],
      );
      return result.rows[0] !== undefined;
    },

    async setQrStatus(db, id, status) {
      const result = await db.query<QrStatusRow>(
        `
          UPDATE dynamic_qrs
          SET status = $2, version = version + 1, updated_at = now()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING id, name, status
        `,
        [id, status],
      );
      return result.rows[0];
    },

    async setUserStatus(db, userId, status) {
      const result = await db.query<UserStatusRow>(
        `
          UPDATE users
          SET status = $2, updated_at = now()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING id, email_normalized, status
        `,
        [userId, status],
      );
      return result.rows[0];
    },

    async revokeUserSessions(db, userId) {
      await db.query(
        "UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
        [userId],
      );
    },
  };
}
