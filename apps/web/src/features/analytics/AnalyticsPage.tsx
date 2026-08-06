/**
 * Página de analítica de un QR dinámico (Fase 08): /qr/:id/analytics. Muestra
 * totales, serie y dispositivos con filtros de rango y granularidad. El
 * timezone es de presentación: la API devuelve UTC y el cliente interpreta las
 * fechas en la zona local del navegador.
 */
import type { AnalyticsGranularity, AnalyticsResponse } from "@acore/contracts";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../shared/lib/api";
import { ui } from "../../shared/lib/messages";
import { type DynamicQr, getQr } from "../dashboard/dashboard-api.client";
import { AnalyticsFilters } from "./AnalyticsFilters";
import { getAnalytics } from "./analytics-api.client";
import { DeviceBreakdown } from "./DeviceBreakdown";
import { ScanSeriesChart } from "./ScanSeriesChart";
import { ScanSummary } from "./ScanSummary";

export function AnalyticsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";

  const [qr, setQr] = useState<DynamicQr | undefined>(undefined);
  const [data, setData] = useState<AnalyticsResponse | undefined>(undefined);
  const [rangeDays, setRangeDays] = useState(30);
  const [granularity, setGranularity] = useState<AnalyticsGranularity>("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const from = new Date(Date.now() - rangeDays * 24 * 3600_000).toISOString();
      const [qrBody, analytics] = await Promise.all([
        getQr(id),
        getAnalytics(id, { from, granularity }),
      ]);
      setQr(qrBody);
      setData(analytics);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.detail ?? ui.analytics.loadFailed)
          : ui.analytics.genericError,
      );
    } finally {
      setLoading(false);
    }
  }, [id, rangeDays, granularity]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && data === undefined) {
    return (
      <p role="status" className="text-sm text-muted">
        {ui.dashboard.loading}
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link to={`/qr/${encodeURIComponent(id)}`} className="text-sm text-muted hover:text-text">
          ← {ui.analytics.back}
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{ui.analytics.title}</h1>
        {qr !== undefined && <p className="mt-1 truncate text-sm text-muted">{qr.name}</p>}
        <p className="mt-1 text-sm text-muted">{ui.analytics.description}</p>
      </div>

      {error !== undefined ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      <AnalyticsFilters
        rangeDays={rangeDays}
        granularity={granularity}
        onRangeDaysChange={setRangeDays}
        onGranularityChange={setGranularity}
      />

      {data !== undefined && (
        <>
          <ScanSummary scans={data.totals.scans} estimatedUnique={data.totals.estimatedUnique} />

          <section aria-labelledby="analytics-series-title" className="flex flex-col gap-2">
            <h2 id="analytics-series-title" className="text-sm font-semibold text-text">
              {ui.analytics.series}
            </h2>
            <ScanSeriesChart series={data.series} />
          </section>

          <section aria-labelledby="analytics-devices-title" className="flex flex-col gap-2">
            <h2 id="analytics-devices-title" className="text-sm font-semibold text-text">
              {ui.analytics.devices}
            </h2>
            <DeviceBreakdown devices={data.devices} />
          </section>
        </>
      )}
    </div>
  );
}
