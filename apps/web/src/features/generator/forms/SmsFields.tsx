import { TextAreaField, TextField } from "../../../shared/components/Field";
import { ui } from "../../../shared/lib/messages";
import type { FieldsProps } from "./forms.types";

export function SmsFields({ draft, errors, onChange }: FieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={ui.forms.sms.phoneLabel}
        placeholder={ui.forms.phone.phonePlaceholder}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={typeof draft.phone === "string" ? draft.phone : ""}
        onChange={(value) => onChange("phone", value)}
        error={errors.phone}
      />
      <TextAreaField
        label={ui.forms.sms.bodyLabel}
        value={typeof draft.body === "string" ? draft.body : ""}
        onChange={(value) => onChange("body", value)}
        error={errors.body}
        rows={3}
      />
      <p className="text-xs text-muted">{ui.forms.sms.compatNote}</p>
    </div>
  );
}
