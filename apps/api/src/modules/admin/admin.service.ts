/**
 * Servicio de administración (Fase 08): reporte público de abuso, moderación de
 * reportes (resolve/dismiss), bloqueo/desbloqueo de QR y usuarios, todo
 * auditado en `audit_events` con `actor_user_id` (admin) y motivo.
 */
import type {
  AbuseReportInput,
  AbuseReportListResponse,
  AbuseReportResponse,
  AbuseReportStatus,
} from "@acore/contracts";
import { PAGINATION_LIMITS } from "@acore/contracts";
import type { Pool } from "pg";
import { newAbuseReportId } from "../analytics/ids.js";
import { DynamicQrNotFoundError } from "../dynamic-qrs/dynamic-qr.errors.js";
import { createDynamicQrRepository } from "../dynamic-qrs/dynamic-qr.repository.js";
import { newAuditEventId } from "../dynamic-qrs/ids.js";
import {
  type AdminRepository,
  createAdminRepository,
  type ListAbuseQuery,
} from "./abuse.repository.js";
import { AdminNotFoundError } from "./admin.errors.js";

export interface AdminService {
  reportAbuse(
    input: AbuseReportInput & { ipHash?: string; requestId?: string },
  ): Promise<AbuseReportResponse>;
  listAbuseReports(query: ListAbuseQuery): Promise<AbuseReportListResponse>;
  resolveAbuseReport(
    id: string,
    status: "resolved" | "dismissed",
    actorUserId: string,
  ): Promise<void>;
  blockQr(id: string, reason: string, actorUserId: string, requestId?: string): Promise<void>;
  unblockQr(id: string, reason: string, actorUserId: string, requestId?: string): Promise<void>;
  blockUser(id: string, reason: string, actorUserId: string, requestId?: string): Promise<void>;
  unblockUser(id: string, reason: string, actorUserId: string, requestId?: string): Promise<void>;
}

export function createAdminService(input: { pool: Pool }): AdminService {
  const repo: AdminRepository = createAdminRepository(input.pool);
  // Auditoría: se reutiliza el insert de dynamic-qrs (misma tabla audit_events).
  const audit = createDynamicQrRepository(input.pool);

  async function insertAudit(row: {
    actorUserId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadataJson: unknown;
    requestId: string | undefined;
  }): Promise<void> {
    await audit
      .insertAudit(input.pool, { id: newAuditEventId(), ...row })
      .catch((error: unknown) => {
        console.warn("[admin] auditoría omitida", error);
      });
  }

  return {
    async reportAbuse({ slug, reason, ipHash, requestId }) {
      // Solo QRs existentes (no borrados); bloqueados/expirados sí reportables.
      const qrId = await repo.findQrIdBySlug(input.pool, slug);
      if (qrId === undefined) {
        throw new DynamicQrNotFoundError();
      }
      const report = { id: newAbuseReportId(), qrId, slug, reason, createdAt: new Date() };
      await repo.insertAbuseReport(input.pool, {
        id: report.id,
        qrId,
        slug,
        reason,
        reporterIpHash: ipHash,
        requestId,
      });
      return {
        id: report.id,
        qrId,
        slug,
        reason,
        status: "open",
        createdAt: report.createdAt.toISOString(),
      };
    },

    async listAbuseReports(query) {
      const page = query.page ?? 1;
      const pageSize = Math.min(
        Math.max(
          query.pageSize ?? PAGINATION_LIMITS.pageSizeDefault,
          PAGINATION_LIMITS.pageSizeMin,
        ),
        PAGINATION_LIMITS.pageSizeMax,
      );
      const { items, total } = await repo.listAbuseReports(input.pool, {
        page,
        pageSize,
        status: query.status,
      });
      return {
        items: items.map((row) => ({
          id: row.id,
          qrId: row.qrId,
          slug: row.slug,
          reason: row.reason,
          status: row.status as AbuseReportStatus,
          createdAt: row.createdAt.toISOString(),
        })),
        page,
        pageSize,
        total,
      };
    },

    async resolveAbuseReport(id, status, actorUserId) {
      const ok = await repo.setAbuseReportStatus(input.pool, id, status, actorUserId);
      if (!ok) {
        throw new AdminNotFoundError();
      }
      await insertAudit({
        actorUserId,
        action: status === "resolved" ? "admin.resolve_report" : "admin.dismiss_report",
        resourceType: "abuse_report",
        resourceId: id,
        metadataJson: { status },
        requestId: undefined,
      });
    },

    async blockQr(id, reason, actorUserId, requestId) {
      const row = await repo.setQrStatus(input.pool, id, "blocked");
      if (row === undefined) {
        throw new AdminNotFoundError();
      }
      await insertAudit({
        actorUserId,
        action: "admin.block_qr",
        resourceType: "dynamic_qr",
        resourceId: row.id,
        metadataJson: { reason, name: row.name },
        requestId,
      });
    },

    async unblockQr(id, reason, actorUserId, requestId) {
      const row = await repo.setQrStatus(input.pool, id, "active");
      if (row === undefined) {
        throw new AdminNotFoundError();
      }
      await insertAudit({
        actorUserId,
        action: "admin.unblock_qr",
        resourceType: "dynamic_qr",
        resourceId: row.id,
        metadataJson: { reason, name: row.name },
        requestId,
      });
    },

    async blockUser(id, reason, actorUserId, requestId) {
      const row = await repo.setUserStatus(input.pool, id, "blocked");
      if (row === undefined) {
        throw new AdminNotFoundError();
      }
      // Bloquear un usuario revoca todas sus sesiones (docs/07 §12).
      await repo.revokeUserSessions(input.pool, id);
      await insertAudit({
        actorUserId,
        action: "admin.block_user",
        resourceType: "user",
        resourceId: row.id,
        metadataJson: { reason, email: row.email_normalized },
        requestId,
      });
    },

    async unblockUser(id, reason, actorUserId, requestId) {
      const row = await repo.setUserStatus(input.pool, id, "active");
      if (row === undefined) {
        throw new AdminNotFoundError();
      }
      await insertAudit({
        actorUserId,
        action: "admin.unblock_user",
        resourceType: "user",
        resourceId: row.id,
        metadataJson: { reason, email: row.email_normalized },
        requestId,
      });
    },
  };
}
