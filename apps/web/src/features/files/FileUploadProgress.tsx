/** Barra de progreso de la subida (accesible: role=progressbar). */
import { ui } from "../../shared/lib/messages";

export function FileUploadProgress({ percent }: { percent: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={ui.files.uploading}
        className="h-2 w-full overflow-hidden rounded-full bg-surface"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p aria-live="polite" className="text-xs text-muted">
        {ui.files.uploading} {percent}%
      </p>
    </div>
  );
}
