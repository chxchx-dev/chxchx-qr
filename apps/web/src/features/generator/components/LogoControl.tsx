/** Control de logo: selector de archivo, estado de la subida y vista previa. */
import { useRef } from "react";
import { ui } from "../../../shared/lib/messages";
import type { LogoPreviewState } from "../hooks/useLogoPreview";

export function LogoControl({
  state,
  onSelect,
  onRemove,
}: {
  state: LogoPreviewState;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (file !== undefined) {
      onSelect(file);
    }
    event.target.value = "";
  }

  const hasLogo = state.dataUri !== undefined;

  return (
    <section aria-labelledby="logo-title" className="flex flex-col gap-3">
      <h2 id="logo-title" className="text-sm font-semibold text-text">
        {ui.logo.title}
      </h2>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleFile}
        aria-label={ui.logo.choose}
      />

      <div className="flex items-center gap-3">
        {hasLogo ? (
          <img
            src={state.dataUri}
            alt="Vista previa del logo"
            className="h-14 w-14 shrink-0 rounded-md border border-surface bg-white object-contain p-1"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-surface text-2xl text-muted">
            +
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={state.status === "uploading"}
              onClick={() => inputRef.current?.click()}
            >
              {ui.logo.choose}
            </button>
            {hasLogo && (
              <button
                type="button"
                className="rounded-md border border-surface bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                onClick={onRemove}
              >
                {ui.logo.remove}
              </button>
            )}
          </div>
          <p aria-live="polite" className="text-xs text-muted">
            {state.status === "uploading"
              ? ui.logo.uploading
              : state.status === "ready"
                ? ui.logo.ready
                : (state.message ?? ui.logo.limits)}
          </p>
        </div>
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-xs text-danger">
          {state.message}
        </p>
      )}

      <ul className="flex list-disc flex-col gap-0.5 pl-4 text-xs text-muted">
        <li>{ui.logo.reencodeNote}</li>
        <li>{ui.logo.eccNote}</li>
        <li>{ui.logo.privacy}</li>
      </ul>
    </section>
  );
}
