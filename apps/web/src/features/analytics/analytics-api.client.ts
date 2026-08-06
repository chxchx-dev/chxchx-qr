/**
 * Cliente de analítica (Fase 08): GET /dynamic-qrs/:id/analytics con sesión.
 * from/to en ISO UTC; la conversión a timezone local es de presentación.
 */
import type { AnalyticsGranularity, AnalyticsResponse } from "@acore/contracts";
import { apiFetch, buildQuery } from "../../shared/lib/api";

export interface AnalyticsParams {
  from?: string | undefined;
  to?: string | undefined;
  granularity?: AnalyticsGranularity | undefined;
}

export async function getAnalytics(
  id: string,
  params: AnalyticsParams = {},
): Promise<AnalyticsResponse> {
  const res = await apiFetch(
    `/dynamic-qrs/${encodeURIComponent(id)}/analytics${buildQuery({ ...params })}`,
  );
  return (await res.json()) as AnalyticsResponse;
}
