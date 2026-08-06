/**
 * Panel de administración (Fase 08): /admin. El acceso lo decide la API (403
 * ADM_FORBIDDEN sin rol admin) — aquí se muestra un estado de acceso denegado.
 * Secciones: cola de reportes, moderación de QR y estado de usuarios.
 */

import type { AbuseReportResponse } from "@acore/contracts";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../shared/lib/api";
import { ui } from "../../shared/lib/messages";
import { AbuseReportList } from "./AbuseReportList";
import {
  blockQr,
  blockUser,
  dismissAbuseReport,
  listAbuseReports,
  resolveAbuseReport,
  unblockQr,
  unblockUser,
} from "./admin-api.client";
import { BlockQrDialog } from "./BlockQrDialog";
import { UserStatusControl } from "./UserStatusControl";

export function AdminDashboard() {
  const [reports, setReports] = useState<AbuseReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const body = await listAbuseReports();
      setReports(body.items);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) {
        setDenied(true);
        return;
      }
      setError(
        caught instanceof ApiError ? (caught.detail ?? ui.admin.loadFailed) : ui.admin.genericError,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>, reportId?: string): Promise<void> {
    setBusy(true);
    setBusyId(reportId);
    setError(undefined);
    setNotice(undefined);
    try {
      await action();
      setNotice(ui.admin.blocked);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.detail ?? ui.admin.actionFailed)
          : ui.admin.genericError,
      );
    } finally {
      setBusy(false);
      setBusyId(undefined);
    }
  }

  if (denied) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-surface bg-surface p-6 text-center">
        <h1 className="text-lg font-semibold">{ui.admin.deniedTitle}</h1>
        <p className="mt-1 text-sm text-muted">{ui.admin.deniedDescription}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{ui.admin.title}</h1>
        <p className="mt-1 text-sm text-muted">{ui.admin.description}</p>
      </div>

      {error !== undefined && (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {notice !== undefined && (
        <p
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
        >
          {notice}
        </p>
      )}

      <section aria-labelledby="reports-title" className="flex flex-col gap-2">
        <h2 id="reports-title" className="text-sm font-semibold text-text">
          {ui.admin.reports}
        </h2>
        {loading ? (
          <p role="status" className="text-sm text-muted">
            {ui.dashboard.loading}
          </p>
        ) : (
          <AbuseReportList
            items={reports}
            busyId={busyId}
            onResolve={(id) => void run(() => resolveAbuseReport(id), id)}
            onDismiss={(id) => void run(() => dismissAbuseReport(id), id)}
          />
        )}
      </section>

      <BlockQrDialog
        busy={busy}
        onBlock={(id, reason) => void run(() => blockQr(id, reason))}
        onUnblock={(id, reason) => void run(() => unblockQr(id, reason))}
      />

      <UserStatusControl
        busy={busy}
        onBlock={(id, reason) => void run(() => blockUser(id, reason))}
        onUnblock={(id, reason) => void run(() => unblockUser(id, reason))}
      />
    </div>
  );
}
