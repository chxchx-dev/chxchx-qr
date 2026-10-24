/** Acciones de descarga: formato, nombre, botón de descarga y copiar payload. */
import { useState } from "react";
import { TextField } from "../../../shared/components/Field";
import { ui } from "../../../shared/lib/messages";
import type { QrDownloadState } from "../hooks/useQrDownload";
import type { QrValidationState } from "../hooks/useQrValidation";
import { type ExportFormat, ExportFormatSelector } from "./ExportFormatSelector";

export function DownloadActions({
  validation,
  downloadState,
  filename,
  onFilenameChange,
  onDownload,
  onCopy,
}: {
  validation: QrValidationState;
  downloadState: QrDownloadState;
  filename: string;
  onFilenameChange: (value: string) => void;
  onDownload: (format: ExportFormat) => void;
  onCopy: () => void;
}) {
  const [format, setFormat] = useState<ExportFormat>("svg");
  const exportable = validation.status === "valid" || validation.status === "warning";
  const busy = validation.status === "validating" || downloadState.status === "downloading";

  return (
    <section aria-labelledby="download-title" className="flex flex-col gap-3">
      <h2 id="download-title" className="text-sm font-semibold text-text">
        {ui.download.title}
      </h2>
      <ExportFormatSelector value={format} onChange={setFormat} />
      <TextField
        label={ui.download.filenameLabel}
        value={filename}
        onChange={onFilenameChange}
        autoComplete="off"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!exportable || busy}
          onClick={() => onDownload(format)}
        >
          {downloadState.status === "downloading" ? ui.download.downloading : ui.download.download}
        </button>
        <button
          type="button"
          className="rounded-md border border-surface bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:border-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={validation.payload === undefined || busy}
          onClick={onCopy}
        >
          {ui.download.copy}
        </button>
      </div>
      <p aria-live="polite" className="text-xs text-muted">
        {downloadState.message}
      </p>
    </section>
  );
}
