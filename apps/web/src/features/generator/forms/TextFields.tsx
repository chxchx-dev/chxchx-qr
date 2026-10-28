import { QR_CONTENT_LIMITS } from "@chxchx/contracts";
import { TextAreaField } from "../../../shared/components/Field";
import { ui } from "../../../shared/lib/messages";
import type { FieldsProps } from "./forms.types";

export function TextFields({ draft, errors, onChange }: FieldsProps) {
  return (
    <TextAreaField
      label={ui.forms.text.textLabel}
      help={ui.forms.text.textHelp}
      placeholder={ui.forms.text.textPlaceholder}
      value={typeof draft.text === "string" ? draft.text : ""}
      onChange={(value) => onChange("text", value)}
      error={errors.text}
      counterMax={QR_CONTENT_LIMITS.textMaxLength}
      rows={4}
    />
  );
}
