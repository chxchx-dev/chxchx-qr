import { TextAreaField, TextField } from "../../../shared/components/Field";
import { ui } from "../../../shared/lib/messages";
import type { FieldsProps } from "./forms.types";

export function EmailFields({ draft, errors, onChange }: FieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={ui.forms.email.emailLabel}
        help={ui.forms.email.emailHelp}
        placeholder={ui.types.email.example}
        type="email"
        inputMode="email"
        autoComplete="email"
        value={typeof draft.email === "string" ? draft.email : ""}
        onChange={(value) => onChange("email", value)}
        error={errors.email}
      />
      <TextField
        label={ui.forms.email.subjectLabel}
        value={typeof draft.subject === "string" ? draft.subject : ""}
        onChange={(value) => onChange("subject", value)}
        error={errors.subject}
      />
      <TextAreaField
        label={ui.forms.email.bodyLabel}
        value={typeof draft.body === "string" ? draft.body : ""}
        onChange={(value) => onChange("body", value)}
        error={errors.body}
        rows={3}
      />
    </div>
  );
}
