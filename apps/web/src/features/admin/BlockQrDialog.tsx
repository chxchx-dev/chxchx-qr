/**
 * Moderación de QR (Fase 08): formulario con ID del QR + motivo para bloquear o
 * desbloquear. El bloqueo deja de redirigir de inmediato; ambos quedan
 * auditados con el motivo.
 */
import { useState } from "react";
import { ui } from "../../shared/lib/messages";

export interface BlockQrDialogProps {
  busy: boolean;
  onBlock: (id: string, reason: string) => void;
  onUnblock: (id: string, reason: string) => void;
}

export function BlockQrDialog(props: BlockQrDialogProps) {
  const [id, setId] = useState("");
  const [reason, setReason] = useState("");

  return (
    <section
      aria-labelledby="block-qr-title"
      className="rounded-md border border-surface bg-surface p-4"
    >
      <h2 id="block-qr-title" className="text-sm font-semibold text-text">
        {ui.admin.blockQrTitle}
      </h2>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted">{ui.admin.qrIdLabel}</span>
          <input
            className="rounded-md border border-surface bg-background px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder="dqr_..."
            aria-label={ui.admin.qrIdLabel}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted">{ui.admin.reasonLabel}</span>
          <input
            className="rounded-md border border-surface bg-background px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={ui.admin.reasonPlaceholder}
            aria-label={ui.admin.reasonLabel}
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            disabled={props.busy || id.trim() === "" || reason.trim() === ""}
            className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              props.onBlock(id.trim(), reason.trim());
              setId("");
              setReason("");
            }}
          >
            {ui.admin.blockQr}
          </button>
          <button
            type="button"
            disabled={props.busy || id.trim() === "" || reason.trim() === ""}
            className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              props.onUnblock(id.trim(), reason.trim());
              setId("");
              setReason("");
            }}
          >
            {ui.admin.unblockQr}
          </button>
        </div>
      </div>
    </section>
  );
}
