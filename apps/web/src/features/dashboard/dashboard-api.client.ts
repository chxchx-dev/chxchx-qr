/**
 * Cliente del dashboard (Fase 07): CRUD de QR dinámicos con la sesión de la
 * cookie. El update usa If-Match (optimistic concurrency): el servidor responde
 * 409 si la versión enviada no es la actual.
 */
import type { DynamicQrResponse, DynamicQrStatus, ListDynamicQrsResponse } from "@acore/contracts";
import { apiFetch, buildQuery } from "../../shared/lib/api";

export type DynamicQr = DynamicQrResponse;

export interface ListQrsParams {
  page: number;
  pageSize?: number;
  search?: string | undefined;
  status?: DynamicQrStatus | undefined;
}

export interface SaveQrInput {
  name: string;
  destinationUrl: string;
  active: boolean;
  /** null = sin expiración. */
  expiresAt: string | null;
}

export async function listQrs(params: ListQrsParams): Promise<ListDynamicQrsResponse> {
  const res = await apiFetch(
    `/dynamic-qrs${buildQuery({
      page: params.page,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      status: params.status,
    })}`,
  );
  return (await res.json()) as ListDynamicQrsResponse;
}

export async function getQr(id: string): Promise<DynamicQr> {
  const res = await apiFetch(`/dynamic-qrs/${encodeURIComponent(id)}`);
  return (await res.json()) as DynamicQr;
}

export async function createQr(input: SaveQrInput): Promise<DynamicQr> {
  const res = await apiFetch("/dynamic-qrs", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      destinationUrl: input.destinationUrl,
      active: input.active,
      ...(input.expiresAt !== null ? { expiresAt: input.expiresAt } : {}),
    }),
  });
  return (await res.json()) as DynamicQr;
}

export async function updateQr(
  id: string,
  expectedVersion: number,
  patch: Partial<SaveQrInput>,
): Promise<DynamicQr> {
  const res = await apiFetch(`/dynamic-qrs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "If-Match": `v${expectedVersion}` },
    body: JSON.stringify({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.destinationUrl !== undefined ? { destinationUrl: patch.destinationUrl } : {}),
      ...(patch.active !== undefined ? { active: patch.active } : {}),
      ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt } : {}),
    }),
  });
  return (await res.json()) as DynamicQr;
}

export async function duplicateQr(id: string): Promise<DynamicQr> {
  const res = await apiFetch(`/dynamic-qrs/${encodeURIComponent(id)}/duplicate`, {
    method: "POST",
  });
  return (await res.json()) as DynamicQr;
}

export async function deleteQr(id: string): Promise<void> {
  await apiFetch(`/dynamic-qrs/${encodeURIComponent(id)}`, { method: "DELETE" });
}
