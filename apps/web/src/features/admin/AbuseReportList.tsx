/**
 * Cola de reportes de abuso (Fase 08): listado con estado, motivo y acciones
 * de moderación (resolver/descartar). Presentacional: los datos viven en
 * AdminDashboard.
 */
import type { AbuseReportResponse } from "@acore/contracts";
import { ui } from "../../shared/lib/messages";

function statusBadge(status: AbuseReportResponse["status"]): string {
  const tones: Record<AbuseReportResponse["status"], string> = {
    open: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    resolved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dismissed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
  return `${tones[status]} rounded-full border px-2 py-0.5 text-xs font-medium`;
}

export interface AbuseReportListProps {
  items: AbuseReportResponse[];
  busyId: string | undefined;
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function AbuseReportList(props: AbuseReportListProps) {
  if (props.items.length === 0) {
    return (
      <p className="rounded-md border border-surface bg-surface px-4 py-6 text-center text-sm text-muted">
        {ui.admin.reportEmpty}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {props.items.map((report) => (
        <li
          key={report.id}
          className="flex flex-col gap-2 rounded-md border border-surface bg-surface p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-mono text-xs text-primary" title={report.slug}>
                /r/{report.slug}
              </span>
              <span className={statusBadge(report.status)}>{ui.admin.status[report.status]}</span>
            </div>
            <p className="mt-1 text-sm text-text">{report.reason}</p>
            <p className="mt-1 text-xs text-muted">
              {new Date(report.createdAt).toLocaleString("es")}
            </p>
          </div>
          {report.status === "open" && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={props.busyId === report.id}
                className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => props.onResolve(report.id)}
              >
                {ui.admin.resolve}
              </button>
              <button
                type="button"
                disabled={props.busyId === report.id}
                className="rounded-md border border-surface bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-zinc-500/40 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => props.onDismiss(report.id)}
              >
                {ui.admin.dismiss}
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
