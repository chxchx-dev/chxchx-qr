/**
 * Dashboard de QR dinámicos (Fase 07): estado de listado (página, búsqueda con
 * debounce, filtro por estado) y acciones (abrir, duplicar, borrar). Solo se
 * muestra si el despliegue habilita QR dinámicos (VITE_DYNAMIC_QR_ENABLED).
 */
import { webConfig } from "@acore/config";
import type { DynamicQrResponse, DynamicQrStatus } from "@acore/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../shared/lib/api";
import { ui } from "../../shared/lib/messages";
import { deleteQr, duplicateQr, listQrs } from "./dashboard-api.client";
import { QrDeleteDialog } from "./QrDeleteDialog";
import { QrList } from "./QrList";

const PAGE_SIZE = 20;

export function DashboardPage() {
  const navigate = useNavigate();
  const enabled = webConfig(import.meta.env).VITE_DYNAMIC_QR_ENABLED;

  const [items, setItems] = useState<DynamicQrResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DynamicQrStatus | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [toDelete, setToDelete] = useState<DynamicQrResponse | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const searchTimer = useRef<number | undefined>(undefined);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const body = await listQrs({
        page,
        pageSize: PAGE_SIZE,
        search: search.trim() === "" ? undefined : search.trim(),
        status,
      });
      setItems(body.items);
      setTotal(body.total);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.detail ?? ui.dashboard.loadFailed)
          : ui.dashboard.genericError,
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void fetchList();
  }, [fetchList, enabled]);

  useEffect(() => {
    return () => {
      if (searchTimer.current !== undefined) {
        window.clearTimeout(searchTimer.current);
      }
    };
  }, []);

  function handleSearchChange(value: string): void {
    setSearch(value);
    if (searchTimer.current !== undefined) {
      window.clearTimeout(searchTimer.current);
    }
    // Debounce: no disparar una petición por tecla.
    searchTimer.current = window.setTimeout(() => setPage(1), 300);
  }

  async function handleDuplicate(id: string): Promise<void> {
    setError(undefined);
    try {
      const copy = await duplicateQr(id);
      navigate(`/qr/${encodeURIComponent(copy.id)}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.detail ?? ui.dashboard.duplicateFailed)
          : ui.dashboard.genericError,
      );
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (toDelete === undefined) {
      return;
    }
    setDeleting(true);
    setError(undefined);
    try {
      await deleteQr(toDelete.id);
      setToDelete(undefined);
      // Si era el último de la página, retrocede una.
      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        void fetchList();
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.detail ?? ui.dashboard.deleteFailed)
          : ui.dashboard.genericError,
      );
    } finally {
      setDeleting(false);
    }
  }

  if (!enabled) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-surface bg-surface p-6 text-center">
        <h1 className="text-lg font-semibold">{ui.dashboard.disabledTitle}</h1>
        <p className="mt-1 text-sm text-muted">{ui.dashboard.disabledDescription}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{ui.dashboard.title}</h1>
          <p className="mt-1 text-sm text-muted">{ui.dashboard.description}</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          onClick={() => navigate("/qr/new")}
        >
          {ui.dashboard.newQr}
        </button>
      </div>

      <QrList
        items={items}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        loading={loading}
        error={error}
        search={search}
        status={status}
        onSearchChange={handleSearchChange}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onPageChange={setPage}
        onOpen={(id) => navigate(`/qr/${encodeURIComponent(id)}`)}
        onDuplicate={(id) => void handleDuplicate(id)}
        onDelete={setToDelete}
      />

      <QrDeleteDialog
        open={toDelete !== undefined}
        name={toDelete?.name ?? ""}
        busy={deleting}
        error={error !== undefined && toDelete !== undefined ? error : undefined}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          setToDelete(undefined);
          setError(undefined);
        }}
      />
    </div>
  );
}
