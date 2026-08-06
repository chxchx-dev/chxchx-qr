/**
 * Cliente de administración (Fase 08). El reporte de abuso es público (sin
 * sesión); el resto exige rol admin (403 ADM_FORBIDDEN si no se tiene).
 */
import type { AbuseReportListResponse, AbuseReportResponse } from "@acore/contracts";
import { apiFetch, buildQuery } from "../../shared/lib/api";

export async function reportAbuse(slug: string, reason: string): Promise<AbuseReportResponse> {
  const res = await apiFetch("/abuse-reports", {
    method: "POST",
    body: JSON.stringify({ slug, reason }),
  });
  return (await res.json()) as AbuseReportResponse;
}

export async function listAbuseReports(
  params: { page?: number; status?: "open" | "resolved" | "dismissed" | undefined } = {},
): Promise<AbuseReportListResponse> {
  const res = await apiFetch(`/admin/abuse-reports${buildQuery(params)}`);
  return (await res.json()) as AbuseReportListResponse;
}

export async function resolveAbuseReport(id: string): Promise<void> {
  await apiFetch(`/admin/abuse-reports/${encodeURIComponent(id)}/resolve`, { method: "POST" });
}

export async function dismissAbuseReport(id: string): Promise<void> {
  await apiFetch(`/admin/abuse-reports/${encodeURIComponent(id)}/dismiss`, { method: "POST" });
}

export async function blockQr(id: string, reason: string): Promise<void> {
  await apiFetch(`/admin/qrs/${encodeURIComponent(id)}/block`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function unblockQr(id: string, reason: string): Promise<void> {
  await apiFetch(`/admin/qrs/${encodeURIComponent(id)}/unblock`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function blockUser(id: string, reason: string): Promise<void> {
  await apiFetch(`/admin/users/${encodeURIComponent(id)}/block`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function unblockUser(id: string, reason: string): Promise<void> {
  await apiFetch(`/admin/users/${encodeURIComponent(id)}/unblock`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
