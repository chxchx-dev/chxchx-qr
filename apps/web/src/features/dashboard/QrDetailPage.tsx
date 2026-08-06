/**
 * Detalle de QR dinámico (Fase 07): /qr/new crea; /qr/:id edita con If-Match.
 * Ante 409 (versión obsoleta) recarga el QR y avisa. Incluye copiar la URL
 * corta y el diálogo de borrado.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../shared/lib/api";
import { ui } from "../../shared/lib/messages";
import {
  createQr,
  type DynamicQr,
  deleteQr,
  getQr,
  type SaveQrInput,
  updateQr,
} from "./dashboard-api.client";
import { QrDeleteDialog } from "./QrDeleteDialog";
import { QrEditForm } from "./QrEditForm";

export function QrDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const isCreate = id === undefined || id === "new";

  const [qr, setQr] = useState<DynamicQr | undefined>(undefined);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (id === undefined || isCreate) {
      return;
    }
    setLoading(true);
    try {
      setQr(await getQr(id));
      setError(undefined);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.detail ?? ui.dashboard.loadFailed)
          : ui.dashboard.genericError,
      );
    } finally {
      setLoading(false);
    }
  }, [id, isCreate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(input: SaveQrInput): Promise<void> {
    setSaving(true);
    setError(undefined);
    setNotice(undefined);
    try {
      if (isCreate) {
        await createQr(input);
        navigate("/dashboard", { replace: true });
        return;
      }
      if (qr === undefined) {
        return;
      }
      const updated = await updateQr(qr.id, qr.version, input);
      setQr(updated);
      setNotice(ui.dashboard.saved);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        // Otra pestaña lo editó: recargar la versión actual y avisar.
        setNotice(ui.dashboard.conflict);
        await load();
        return;
      }
      setError(
        caught instanceof ApiError
          ? (caught.detail ?? ui.dashboard.saveFailed)
          : ui.dashboard.genericError,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (qr === undefined) {
      return;
    }
    setDeleting(true);
    setError(undefined);
    try {
      await deleteQr(qr.id);
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? (caught.detail ?? ui.dashboard.deleteFailed)
          : ui.dashboard.genericError,
      );
      setDeleting(false);
    }
  }

  async function handleCopy(): Promise<void> {
    if (qr === undefined) {
      return;
    }
    try {
      await navigator.clipboard.writeText(qr.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard no disponible (permisos): se ignora en silencio.
    }
  }

  if (loading) {
    return (
      <p role="status" className="text-sm text-muted">
        {ui.dashboard.loading}
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <Link to="/dashboard" className="text-sm text-muted hover:text-text">
          ← {ui.dashboard.back}
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {isCreate ? ui.dashboard.createTitle : ui.dashboard.detailTitle}
        </h1>
      </div>

      {error !== undefined && !isCreate && qr === undefined ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      {notice !== undefined && (
        <p
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
        >
          {notice}
        </p>
      )}

      {qr !== undefined && (
        <div className="flex flex-col gap-2 rounded-md border border-surface bg-surface p-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-mono text-xs text-muted" title={qr.shortUrl}>
              {qr.shortUrl}
            </span>
            <button
              type="button"
              className="shrink-0 rounded-md border border-surface bg-background px-2.5 py-1 text-xs font-medium text-text transition-colors hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={() => void handleCopy()}
            >
              {copied ? ui.dashboard.copied : ui.dashboard.copyLink}
            </button>
          </div>
          <p className="text-xs text-muted">{ui.dashboard.qrCreated(qr.createdAt)}</p>
        </div>
      )}

      <QrEditForm
        initial={isCreate ? undefined : qr}
        submitLabel={isCreate ? ui.dashboard.createCta : ui.dashboard.saveCta}
        saving={saving}
        error={isCreate ? error : qr !== undefined ? error : undefined}
        onSave={handleSave}
        onCancel={() => navigate("/dashboard")}
      />

      {!isCreate && qr !== undefined && (
        <div className="flex flex-wrap items-center gap-2 border-t border-surface pt-4">
          <button
            type="button"
            className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => navigate(`/qr/${encodeURIComponent(qr.id)}/analytics`)}
          >
            {ui.dashboard.analytics}
          </button>
          <button
            type="button"
            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
            onClick={() => setDeleteOpen(true)}
          >
            {ui.dashboard.delete}
          </button>
        </div>
      )}

      <QrDeleteDialog
        open={deleteOpen}
        name={qr?.name ?? ""}
        busy={deleting}
        error={error !== undefined && deleteOpen ? error : undefined}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          setDeleteOpen(false);
          setError(undefined);
        }}
      />
    </div>
  );
}
