import { TextField } from "../../../shared/components/Field";
import { ui } from "../../../shared/lib/messages";
import type { FieldsProps } from "./forms.types";

export function UrlFields({ draft, errors, onChange }: FieldsProps) {
  return (
    <TextField
      label={ui.forms.url.urlLabel}
      help={ui.forms.url.urlHelp}
      placeholder={ui.forms.url.urlPlaceholder}
      type="url"
      inputMode="url"
      autoComplete="url"
      value={typeof draft.url === "string" ? draft.url : ""}
      onChange={(value) => onChange("url", value)}
      error={errors.url}
    />
  );
}
