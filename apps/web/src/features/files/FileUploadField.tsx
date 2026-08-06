/**
 * Sección "Archivo" del generador (Fase 05): el usuario elige un archivo
 * permitido, la API lo valida y almacena, y el QR contendrá la URL pública
 * (ADR-003). Solo se muestra cuando VITE_FILE_UPLOAD_ENABLED=true.
 */
import { useRef } from "react";
import { ui } from "../../shared/lib/messages";
import { FileResult } from "./FileResult";
import { FileUploadProgress } from "./FileUploadProgress";
import type { FileUploadState } from "./useFileUpload";

export function FileUploadField({
  state,
  onSelect,
  onRemove,
  onCancel,
}: {
  state: FileUploadState;
  onSelect: (file: File) => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (file !== undefined) {
      onSelect(file);
    }
    event.target.value = "";
  }

  return (
    <section aria-labelledby="file-upload-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="file-upload-title" className="text-sm font-semibold text-text">
          {ui.files.title}
        </h2>
        <span className="hidden text-xs text-muted sm:block">{ui.files.limits}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
        className="sr-only"
        onChange={handleFile}
        aria-label={ui.files.chooseInput}
      />

      {state.status === "idle" && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            onClick={() => inputRef.current?.click()}
          >
            {ui.files.choose}
          </button>
          <p className="text-xs text-muted">{ui.files.chooseHelp}</p>
        </div>
      )}

      {state.status === "uploading" && (
        <div className="flex flex-col gap-2">
          <FileUploadProgress percent={state.percent} />
          <button
            type="button"
            className="self-start rounded-md border border-surface bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={onCancel}
          >
            {ui.files.cancel}
          </button>
        </div>
      )}

      {state.status === "done" && state.result !== undefined && (
        <FileResult result={state.result} onRemove={onRemove} />
      )}

      {state.status === "error" && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="text-xs text-danger">
            {state.message}
          </p>
          <button
            type="button"
            className="self-start rounded-md border border-surface bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => inputRef.current?.click()}
          >
            {ui.files.chooseAgain}
          </button>
        </div>
      )}

      <ul className="flex list-disc flex-col gap-0.5 pl-4 text-xs text-muted">
        <li>{ui.files.storedNote}</li>
        <li>{ui.files.privacy}</li>
      </ul>
    </section>
  );
}
