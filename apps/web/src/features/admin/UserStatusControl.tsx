/**
 * Estado de usuarios (Fase 08): bloquea/desbloquea una cuenta por ID con
 * motivo. Bloquear revoca todas sus sesiones al instante (docs/07 §12).
 */
import { useState } from "react";
import { ui } from "../../shared/lib/messages";

export interface UserStatusControlProps {
  busy: boolean;
  onBlock: (id: string, reason: string) => void;
  onUnblock: (id: string, reason: string) => void;
}

export function UserStatusControl(props: UserStatusControlProps) {
  const [id, setId] = useState("");
  const [reason, setReason] = useState("");

  return (
    <section
      aria-labelledby="user-status-title"
      className="rounded-md border border-surface bg-surface p-4"
    >
      <h2 id="user-status-title" className="text-sm font-semibold text-text">
        {ui.admin.userTitle}
      </h2>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-muted">{ui.admin.userIdLabel}</span>
          <input
            className="rounded-md border border-surface bg-background px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder="usr_..."
            aria-label={ui.admin.userIdLabel}
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
            {ui.admin.blockUser}
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
            {ui.admin.unblockUser}
          </button>
        </div>
      </div>
    </section>
  );
}
