/**
 * Diálogo de confirmación de borrado (Fase 07): borrado suave en el servidor
 * (el QR deja de redirigir y desaparece del listado). Cierra con Cancelar o
 * Escape (accesible por teclado).
 */
import { useEffect } from "react";
import { ui } from "../../shared/lib/messages";

export interface QrDeleteDialogProps {
  open: boolean;
  name: string;
  busy: boolean;
  error: string | undefined;
  onConfirm: () => void;
  onCancel: () => void;
}

export function QrDeleteDialog({
  open,
  name,
  busy,
  error,
  onConfirm,
  onCancel,
}: QrDeleteDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="w-full max-w-sm rounded-lg border border-surface bg-background p-5 shadow-xl"
      >
        <h2 id="delete-dialog-title" className="text-lg font-semibold text-text">
          {ui.dashboard.deleteTitle}
        </h2>
        <p className="mt-2 text-sm text-muted">{ui.dashboard.deleteConfirm(name)}</p>
        {error !== undefined && (
          <p
            role="alert"
            className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-md border border-surface bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
          >
            {ui.dashboard.cancel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? ui.dashboard.deleting : ui.dashboard.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
