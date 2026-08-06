import { DateTimeField, TextField } from "../../../shared/components/Field";
import { ui } from "../../../shared/lib/messages";
import type { FieldsProps } from "./forms.types";

function value(draft: FieldsProps["draft"], field: string): string {
  return typeof draft[field] === "string" ? draft[field] : "";
}

export function CalendarFields({ draft, errors, onChange }: FieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={ui.forms.calendar.summaryLabel}
        value={value(draft, "summary")}
        onChange={(v) => onChange("summary", v)}
        error={errors.summary}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateTimeField
          label={ui.forms.calendar.startLabel}
          help={ui.forms.calendar.startHelp}
          value={value(draft, "start")}
          onChange={(v) => onChange("start", v)}
          error={errors.start}
        />
        <DateTimeField
          label={ui.forms.calendar.endLabel}
          value={value(draft, "end")}
          onChange={(v) => onChange("end", v)}
          error={errors.end}
        />
      </div>
      <TextField
        label={ui.forms.calendar.locationLabel}
        value={value(draft, "location")}
        onChange={(v) => onChange("location", v)}
        error={errors.location}
      />
      <TextField
        label={ui.forms.calendar.descriptionLabel}
        value={value(draft, "description")}
        onChange={(v) => onChange("description", v)}
        error={errors.description}
      />
    </div>
  );
}
