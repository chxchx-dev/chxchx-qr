import { TextAreaField, TextField } from "../../../shared/components/Field";
import { ui } from "../../../shared/lib/messages";
import type { FieldsProps } from "./forms.types";

function value(draft: FieldsProps["draft"], field: string): string {
  return typeof draft[field] === "string" ? draft[field] : "";
}

export function VCardFields({ draft, errors, onChange }: FieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextField
        label={ui.forms.vcard.nameLabel}
        value={value(draft, "name")}
        onChange={(v) => onChange("name", v)}
        error={errors.name}
        autoComplete="given-name"
      />
      <TextField
        label={ui.forms.vcard.lastnameLabel}
        value={value(draft, "lastname")}
        onChange={(v) => onChange("lastname", v)}
        error={errors.lastname}
        autoComplete="family-name"
      />
      <TextField
        label={ui.forms.vcard.orgLabel}
        value={value(draft, "org")}
        onChange={(v) => onChange("org", v)}
        error={errors.org}
        autoComplete="organization"
      />
      <TextField
        label={ui.forms.vcard.titleLabel}
        value={value(draft, "title")}
        onChange={(v) => onChange("title", v)}
        error={errors.title}
      />
      <TextField
        label={ui.forms.vcard.phoneLabel}
        type="tel"
        inputMode="tel"
        value={value(draft, "phone")}
        onChange={(v) => onChange("phone", v)}
        error={errors.phone}
        autoComplete="tel"
      />
      <TextField
        label={ui.forms.vcard.emailLabel}
        type="email"
        inputMode="email"
        value={value(draft, "email")}
        onChange={(v) => onChange("email", v)}
        error={errors.email}
        autoComplete="email"
      />
      <TextField
        label={ui.forms.vcard.urlLabel}
        type="url"
        inputMode="url"
        value={value(draft, "url")}
        onChange={(v) => onChange("url", v)}
        error={errors.url}
      />
      <TextField
        label={ui.forms.vcard.addressLabel}
        value={value(draft, "address")}
        onChange={(v) => onChange("address", v)}
        error={errors.address}
      />
      <div className="sm:col-span-2">
        <TextAreaField
          label={ui.forms.vcard.noteLabel}
          value={value(draft, "note")}
          onChange={(v) => onChange("note", v)}
          error={errors.note}
          rows={2}
        />
      </div>
    </div>
  );
}
