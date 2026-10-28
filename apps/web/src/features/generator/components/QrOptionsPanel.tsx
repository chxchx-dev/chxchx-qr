/** Panel de personalización: ECC explicado, tamaño, margen, colores y restaurar. */
import type { QrRenderOptions } from "@chxchx/contracts";
import { ColorField, SelectField } from "../../../shared/components/Field";
import { ui } from "../../../shared/lib/messages";

const SIZE_OPTIONS = [128, 256, 512, 1024, 2048, 4096] as const;
const MARGIN_OPTIONS = [0, 1, 2, 4, 8, 16] as const;

export function QrOptionsPanel({
  options,
  onChange,
  onReset,
}: {
  options: QrRenderOptions;
  onChange: (options: Partial<QrRenderOptions>) => void;
  onReset: () => void;
}) {
  return (
    <section aria-labelledby="options-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="options-title" className="text-sm font-semibold text-text">
          {ui.options.title}
        </h2>
        <button
          type="button"
          className="rounded-md border border-surface bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={onReset}
        >
          {ui.options.reset}
        </button>
      </div>

      <SelectField
        label={ui.options.eccLabel}
        help={ui.options.eccHelp}
        value={options.ecc}
        onChange={(value) => onChange({ ecc: value as QrRenderOptions["ecc"] })}
        options={(["low", "medium", "quartile", "high"] as const).map((ecc) => ({
          value: ecc,
          label: ui.options.eccOptions[ecc],
        }))}
      />

      <SelectField
        label={ui.options.sizeLabel}
        value={String(options.size)}
        onChange={(value) => onChange({ size: Number(value) })}
        options={SIZE_OPTIONS.map((size) => ({ value: String(size), label: `${size} px` }))}
      />

      <SelectField
        label={ui.options.marginLabel}
        help={ui.options.marginHelp}
        value={String(options.marginModules)}
        onChange={(value) => onChange({ marginModules: Number(value) })}
        options={MARGIN_OPTIONS.map((margin) => ({
          value: String(margin),
          label: margin === 0 ? "Sin margen" : `${margin} módulos`,
        }))}
      />

      <div className="grid grid-cols-2 gap-3">
        <ColorField
          label={ui.options.foregroundLabel}
          value={options.foreground}
          onChange={(value) => onChange({ foreground: value })}
        />
        <ColorField
          label={ui.options.backgroundLabel}
          value={options.background}
          onChange={(value) => onChange({ background: value })}
        />
      </div>
    </section>
  );
}
