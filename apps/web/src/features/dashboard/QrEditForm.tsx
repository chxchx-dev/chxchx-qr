/**
 * Formulario de QR dinámico (Fase 07): sirve para crear y editar. En edición
 * el padre envía la versión actual (If-Match); el 409 del servidor lo gestiona
 * QrDetailPage (recarga). Validación local ligera; el servidor es la autoridad.
 */
import { type FormEvent, useEffect, useState } from "react";
import { DateTimeField, TextField, ToggleField } from "../../shared/components/Field";
import { ui } from "../../shared/lib/messages";
import type { DynamicQr, SaveQrInput } from "./dashboard-api.client";

export interface QrEditFormProps {
  initial: DynamicQr | undefined;
  submitLabel: string;
  saving: boolean;
  error: string | undefined;
  onSave: (input: SaveQrInput) => Promise<void>;
  onCancel: () => void;
}

/** datetime-local (local) → ISO UTC (lo que valida el contrato). */
function toIsoLocal(value: string): string | null {
  if (value === "") {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** ISO UTC → datetime-local (local). */
function toLocalInput(iso: string | null): string {
  if (iso === null) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  // Offset local para que el input muestre la hora local real.
  const offsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

export function QrEditForm({
  initial,
  submitLabel,
  saving,
  error,
  onSave,
  onCancel,
}: QrEditFormProps) {
  const [name, setName] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; destinationUrl?: string }>({});

  useEffect(() => {
    if (initial !== undefined) {
      setName(initial.name);
      setDestinationUrl(initial.destinationUrl);
      setActive(initial.status === "active");
      setExpiresAt(toLocalInput(initial.expiresAt));
    }
  }, [initial]);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const errors: { name?: string; destinationUrl?: string } = {};
    if (name.trim() === "") {
      errors.name = ui.dashboard.nameRequired;
    }
    const parsedUrl = destinationUrl.trim() === "" ? undefined : new URL(destinationUrl.trim());
    if (parsedUrl === undefined || !/^https?:$/.test(parsedUrl.protocol)) {
      errors.destinationUrl = ui.dashboard.destinationRequired;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    await onSave({
      name: name.trim(),
      destinationUrl: destinationUrl.trim(),
      active,
      expiresAt: toIsoLocal(expiresAt),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <TextField
        label={ui.dashboard.nameLabel}
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        placeholder={ui.dashboard.namePlaceholder}
        counterMax={120}
      />
      <TextField
        label={ui.dashboard.destinationLabel}
        value={destinationUrl}
        onChange={setDestinationUrl}
        type="url"
        error={fieldErrors.destinationUrl}
        help={ui.dashboard.destinationHelp}
        placeholder="https://ejemplo.com/destino"
      />
      <ToggleField
        label={ui.dashboard.activeLabel}
        checked={active}
        onChange={setActive}
        description={ui.dashboard.activeHelp}
      />
      <DateTimeField
        label={ui.dashboard.expiresLabel}
        value={expiresAt}
        onChange={setExpiresAt}
        help={ui.dashboard.expiresHelp}
      />
      {error !== undefined && (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? ui.dashboard.saving : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-surface bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {ui.dashboard.cancel}
        </button>
      </div>
    </form>
  );
}
