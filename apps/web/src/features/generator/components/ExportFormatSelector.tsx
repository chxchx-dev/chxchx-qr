/** Selector del formato de descarga. */
import { ui } from "../../../shared/lib/messages";

const FORMATS = ["svg", "gif", "png"] as const;
export type ExportFormat = (typeof FORMATS)[number];

export function ExportFormatSelector({
  value,
  onChange,
}: {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
}) {
  return (
    <div role="radiogroup" aria-label={ui.download.formatLabel} className="grid grid-cols-3 gap-2">
      {FORMATS.map((format) => {
        const info = ui.download.formats[format];
        const selected = value === format;
        return (
          <button
            key={format}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(format)}
            className={`flex flex-col gap-1 rounded-md border p-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-45 ${
              selected
                ? "border-primary bg-primary/10"
                : "border-surface bg-surface hover:border-muted"
            }`}
          >
            <span className={`text-sm font-semibold ${selected ? "text-primary" : "text-text"}`}>
              {info.label}
            </span>
            <span className="text-xs leading-snug text-muted">{info.description}</span>
          </button>
        );
      })}
    </div>
  );
}
