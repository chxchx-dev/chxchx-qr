/**
 * Resultado de la subida: muestra la URL pública (token opaco, ADR-003), la
 * expiración y permite copiar el enlace o quitar el archivo. La advertencia
 * deja claro que el QR contiene un enlace, nunca el binario.
 */
import type { FileUploadResponse } from "@acore/contracts";
import { useEffect, useState } from "react";
import { ui } from "../../shared/lib/messages";

const EXPIRATION_FORMATTER = new Intl.DateTimeFormat("es", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileResult({
  result,
  onRemove,
}: {
  result: FileUploadResponse;
  onRemove: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
    } catch {
      // Sin permiso de portapapeles: el enlace sigue visible para copiar a mano.
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-surface bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text" title={result.fileName}>
            {result.fileName}
          </p>
          <p className="text-xs text-muted">
            {result.mimeType} · {formatBytes(result.sizeBytes)}
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-surface bg-background px-2.5 py-1 text-xs text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={onRemove}
        >
          {ui.files.remove}
        </button>
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{ui.files.linkLabel}</p>
        <p className="truncate font-mono text-xs text-text" title={result.url}>
          {result.url}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {ui.files.expires.replace(
            "{date}",
            EXPIRATION_FORMATTER.format(new Date(result.expiresAt)),
          )}
        </p>
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          onClick={() => void copyLink()}
        >
          {copied ? ui.files.linkCopied : ui.files.copyLink}
        </button>
      </div>

      <p
        role="note"
        className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-400"
      >
        {ui.files.warning}
      </p>
    </div>
  );
}
