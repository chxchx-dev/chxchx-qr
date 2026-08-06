import { type ReactNode, useId, useState } from "react";

const inputBase =
  "w-full rounded-md border border-surface bg-surface px-3 py-2 text-sm text-text " +
  "placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-60";

interface FieldShellProps {
  id: string;
  label: string;
  help?: string | undefined;
  error?: string | undefined;
  counter?: { current: number; max: number } | undefined;
  children: (describedBy: string | undefined) => ReactNode;
}

function FieldShell({ id, label, help, error, counter, children }: FieldShellProps) {
  const describedBy = [
    error !== undefined ? `${id}-error` : undefined,
    help ? `${id}-help` : undefined,
  ]
    .filter((value): value is string => value !== undefined)
    .join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
        </label>
        {counter !== undefined && <CharCounter current={counter.current} max={counter.max} />}
      </div>
      {children(describedBy === "" ? undefined : describedBy)}
      {error !== undefined ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        help !== undefined && (
          <p id={`${id}-help`} className="text-xs text-muted">
            {help}
          </p>
        )
      )}
    </div>
  );
}

export function CharCounter({ current, max }: { current: number; max: number }) {
  const over = current > max;
  return (
    <span
      className={`text-xs tabular-nums ${over ? "font-semibold text-danger" : "text-muted"}`}
      aria-live="polite"
    >
      {current}/{max}
    </span>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string | undefined;
  error?: string | undefined;
  counterMax?: number | undefined;
  type?: "text" | "url" | "email" | "tel" | "number" | undefined;
  placeholder?: string | undefined;
  autoComplete?: string | undefined;
  inputMode?: "text" | "decimal" | "tel" | "email" | "url" | undefined;
}

export function TextField({
  label,
  value,
  onChange,
  help,
  error,
  counterMax,
  type,
  placeholder,
  autoComplete,
  inputMode,
}: TextFieldProps) {
  const autoId = useId();
  const id = `field-${autoId}`;
  return (
    <FieldShell
      id={id}
      label={label}
      help={help}
      error={error}
      counter={counterMax !== undefined ? { current: value.length, max: counterMax } : undefined}
    >
      {(describedBy) => (
        <input
          id={id}
          className={error !== undefined ? `${inputBase} border-danger` : inputBase}
          type={type ?? "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-describedby={describedBy}
          aria-invalid={error !== undefined}
        />
      )}
    </FieldShell>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string | undefined;
  error?: string | undefined;
  counterMax?: number | undefined;
  placeholder?: string | undefined;
  rows?: number | undefined;
}

export function TextAreaField({
  label,
  value,
  onChange,
  help,
  error,
  counterMax,
  placeholder,
  rows,
}: TextAreaFieldProps) {
  const autoId = useId();
  const id = `field-${autoId}`;
  return (
    <FieldShell
      id={id}
      label={label}
      help={help}
      error={error}
      counter={counterMax !== undefined ? { current: value.length, max: counterMax } : undefined}
    >
      {(describedBy) => (
        <textarea
          id={id}
          className={`${inputBase} resize-y`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows ?? 3}
          aria-describedby={describedBy}
          aria-invalid={error !== undefined}
        />
      )}
    </FieldShell>
  );
}

export interface SelectOption {
  value: string;
  label: string;
  description?: string | undefined;
  disabled?: boolean | undefined;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  help?: string | undefined;
  error?: string | undefined;
}

export function SelectField({ label, value, onChange, options, help, error }: SelectFieldProps) {
  const autoId = useId();
  const id = `field-${autoId}`;
  return (
    <FieldShell id={id} label={label} help={help} error={error}>
      {(describedBy) => (
        <select
          id={id}
          className={`${inputBase} appearance-none`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={describedBy}
          aria-invalid={error !== undefined}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}

export function ColorField({ label, value, onChange, error }: ColorFieldProps) {
  const autoId = useId();
  const id = `field-${autoId}`;
  return (
    <FieldShell id={id} label={label} error={error}>
      {(describedBy) => (
        <div className="flex items-center gap-2">
          <input
            id={id}
            className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-surface bg-transparent p-0.5"
            type="color"
            value={normalizeForColorInput(value)}
            onChange={(event) => onChange(normalizeHex(event.target.value))}
            aria-label={`${label} (selector)`}
          />
          <input
            className={`${inputBase} font-mono`}
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="#000000"
            aria-label={`${label} (hexadecimal)`}
            aria-describedby={describedBy}
            aria-invalid={error !== undefined}
          />
        </div>
      )}
    </FieldShell>
  );
}

function normalizeHex(value: string): string {
  const hex = value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return hex === "" ? "" : `#${hex.toLowerCase()}`;
}

/** El input de color requiere #rrggbb exacto; usa #000000 como respaldo. */
function normalizeForColorInput(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : "#000000";
}

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string | undefined;
}

export function ToggleField({ label, checked, onChange, description }: ToggleFieldProps) {
  const autoId = useId();
  const id = `field-${autoId}`;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
        </label>
        {description !== undefined && <p className="text-xs text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
          checked ? "bg-primary" : "bg-surface"
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string | undefined;
  error?: string | undefined;
  counterMax?: number | undefined;
  autoComplete?: string | undefined;
}

export function PasswordField({
  label,
  value,
  onChange,
  help,
  error,
  counterMax,
  autoComplete,
}: PasswordFieldProps) {
  const autoId = useId();
  const id = `field-${autoId}`;
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell
      id={id}
      label={label}
      help={help}
      error={error}
      counter={counterMax !== undefined ? { current: value.length, max: counterMax } : undefined}
    >
      {(describedBy) => (
        <div className="flex items-stretch gap-2">
          <input
            id={id}
            className={`${inputBase} flex-1`}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete={autoComplete}
            aria-describedby={describedBy}
            aria-invalid={error !== undefined}
          />
          <button
            type="button"
            className="shrink-0 rounded-md border border-surface bg-surface px-3 text-xs font-medium text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => setVisible((current) => !current)}
            aria-pressed={visible}
          >
            {visible ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      )}
    </FieldShell>
  );
}

interface DateTimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string | undefined;
  error?: string | undefined;
}

export function DateTimeField({ label, value, onChange, help, error }: DateTimeFieldProps) {
  const autoId = useId();
  const id = `field-${autoId}`;
  return (
    <FieldShell id={id} label={label} help={help} error={error}>
      {(describedBy) => (
        <input
          id={id}
          className={inputBase}
          type="datetime-local"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={describedBy}
          aria-invalid={error !== undefined}
        />
      )}
    </FieldShell>
  );
}
