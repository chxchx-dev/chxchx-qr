import { TextField } from "../../../shared/components/Field";
import { ui } from "../../../shared/lib/messages";
import type { FieldsProps } from "./forms.types";

function value(draft: FieldsProps["draft"], field: string): string {
  return typeof draft[field] === "string" ? draft[field] : "";
}

export function GeoFields({ draft, errors, onChange }: FieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={ui.forms.geo.latLabel}
          placeholder={ui.forms.geo.latPlaceholder}
          inputMode="decimal"
          value={value(draft, "lat")}
          onChange={(v) => onChange("lat", v)}
          error={errors.lat}
        />
        <TextField
          label={ui.forms.geo.lngLabel}
          placeholder={ui.forms.geo.lngPlaceholder}
          inputMode="decimal"
          value={value(draft, "lng")}
          onChange={(v) => onChange("lng", v)}
          error={errors.lng}
        />
      </div>
      <TextField
        label={ui.forms.geo.labelLabel}
        value={value(draft, "label")}
        onChange={(v) => onChange("label", v)}
        error={errors.label}
      />
    </div>
  );
}
