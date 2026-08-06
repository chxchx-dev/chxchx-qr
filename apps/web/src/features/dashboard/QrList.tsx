/**
 * Listado de QR dinámicos (Fase 07): búsqueda, filtro por estado, paginación
 * y acciones (abrir, duplicar, eliminar). Presentacional: el estado y los
 * datos viven en DashboardPage.
 */
import type { DynamicQrResponse, DynamicQrStatus } from "@acore/contracts";
import { ui } from "../../shared/lib/messages";

const STATUS_OPTIONS: Array<{ value: DynamicQrStatus; label: string }> = [
  { value: "active", label: ui.dashboard.status.active },
  { value: "paused", label: ui.dashboard.status.paused },
  { value: "expired", label: ui.dashboard.status.expired },
  { value: "blocked", label: ui.dashboard.status.blocked },
];

export interface QrListProps {
  items: DynamicQrResponse[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | undefined;
  search: string;
  status: DynamicQrStatus | undefined;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: DynamicQrStatus | undefined) => void;
  onPageChange: (page: number) => void;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (qr: DynamicQrResponse) => void;
}

function statusBadge(status: DynamicQrStatus): string {
  const tones: Record<DynamicQrStatus, string> = {
    active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    paused: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    expired: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    blocked: "bg-red-500/15 text-red-300 border-red-500/30",
    deleted: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
  return `${tones[status]} rounded-full border px-2 py-0.5 text-xs font-medium`;
}

export function QrList(props: QrListProps) {
  const { items, total, page, pageSize, loading, error, search, status } = props;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section aria-labelledby="qr-list-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="qr-list-title" className="sr-only">
          {ui.dashboard.listTitle}
        </h2>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted">{ui.dashboard.searchLabel}</span>
            <input
              className="w-full rounded-md border border-surface bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-72"
              type="search"
              value={search}
              onChange={(event) => props.onSearchChange(event.target.value)}
              placeholder={ui.dashboard.searchPlaceholder}
              aria-label={ui.dashboard.searchLabel}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted">{ui.dashboard.statusLabel}</span>
            <select
              className="rounded-md border border-surface bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={status ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                props.onStatusChange(value === "" ? undefined : (value as DynamicQrStatus));
              }}
              aria-label={ui.dashboard.statusLabel}
            >
              <option value="">{ui.dashboard.allStatuses}</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-muted" aria-live="polite">
          {ui.dashboard.count(total)}
        </p>
      </div>

      {error !== undefined ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      {loading && items.length === 0 ? (
        <p role="status" className="text-sm text-muted">
          {ui.dashboard.loading}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-surface bg-surface px-4 py-6 text-center text-sm text-muted">
          {ui.dashboard.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label={ui.dashboard.listTitle}>
          {items.map((qr) => (
            <li
              key={qr.id}
              className="flex flex-col gap-3 rounded-md border border-surface bg-surface p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-text">{qr.name}</p>
                  <span className={statusBadge(qr.status)}>{ui.dashboard.status[qr.status]}</span>
                </div>
                <p className="mt-0.5 truncate font-mono text-xs text-muted" title={qr.shortUrl}>
                  {qr.shortUrl}
                </p>
                <p className="mt-1 text-xs text-muted">{ui.dashboard.updatedAt(qr.updatedAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-surface bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  onClick={() => props.onOpen(qr.id)}
                >
                  {ui.dashboard.open}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-surface bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  onClick={() => props.onDuplicate(qr.id)}
                >
                  {ui.dashboard.duplicate}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
                  onClick={() => props.onDelete(qr)}
                >
                  {ui.dashboard.delete}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <nav aria-label={ui.dashboard.pagination} className="flex items-center justify-between">
        <button
          type="button"
          disabled={page <= 1}
          className="rounded-md border border-surface bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => props.onPageChange(page - 1)}
        >
          {ui.dashboard.previous}
        </button>
        <span className="text-xs text-muted" aria-live="polite">
          {ui.dashboard.pageOf(page, totalPages)}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          className="rounded-md border border-surface bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => props.onPageChange(page + 1)}
        >
          {ui.dashboard.next}
        </button>
      </nav>
    </section>
  );
}
