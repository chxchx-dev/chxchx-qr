import { TextField } from "../../../shared/components/Field";
import { ui } from "../../../shared/lib/messages";
import type { FieldsProps } from "./forms.types";

export function PhoneFields({ draft, errors, onChange }: FieldsProps) {
  return (
    <TextField
      label={ui.forms.phone.phoneLabel}
      help={ui.forms.phone.phoneHelp}
      placeholder={ui.forms.phone.phonePlaceholder}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      value={typeof draft.phone === "string" ? draft.phone : ""}
      onChange={(value) => onChange("phone", value)}
      error={errors.phone}
    />
  );
}
