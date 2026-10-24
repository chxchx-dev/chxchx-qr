/** Panel de vista previa con control de zoom. */
import { useState } from "react";
import { ui } from "../../../shared/lib/messages";
import type { QrPreviewState } from "../hooks/useQrPreview";
import { QrSvgPreview } from "./QrSvgPreview";

const ZOOM_STEPS = [1, 1.5, 2] as const;

export function PreviewPanel({ preview }: { preview: QrPreviewState }) {
  const [zoomIndex, setZoomIndex] = useState(0);
  const zoom = ZOOM_STEPS[zoomIndex] ?? 1;
  const placeholder = {
    idle: ui.preview.placeholder,
    loading: ui.preview.loading,
    ready: ui.preview.placeholder,
    error: ui.preview.error,
  }[preview.status];

  return (
    <section aria-labelledby="preview-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="preview-title" className="text-sm font-semibold text-text">
          {ui.preview.title}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-md border border-surface bg-surface px-2 py-1 text-xs text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40"
            aria-label={ui.preview.zoomOut}
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((current) => Math.max(0, current - 1))}
          >
            −
          </button>
          <span className="w-10 text-center text-xs tabular-nums text-muted">{zoom}×</span>
          <button
            type="button"
            className="rounded-md border border-surface bg-surface px-2 py-1 text-xs text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40"
            aria-label={ui.preview.zoomIn}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            onClick={() => setZoomIndex((current) => Math.min(ZOOM_STEPS.length - 1, current + 1))}
          >
            +
          </button>
        </div>
      </div>
      <div className="flex justify-center">
        <QrSvgPreview svg={preview.svg} zoom={zoom} placeholder={placeholder} />
      </div>
      <p className="text-xs text-muted">{ui.preview.parityNote}</p>
    </section>
  );
}
