/** Formulario del contenido activo: monta el formulario por tipo + acción limpiar. */
import { ui } from "../../../shared/lib/messages";
import { CalendarFields } from "../forms/CalendarFields";
import { EmailFields } from "../forms/EmailFields";
import type { FieldsProps } from "../forms/forms.types";
import { GeoFields } from "../forms/GeoFields";
import { PhoneFields } from "../forms/PhoneFields";
import { SmsFields } from "../forms/SmsFields";
import { TextFields } from "../forms/TextFields";
import { UrlFields } from "../forms/UrlFields";
import { VCardFields } from "../forms/VCardFields";
import { WifiFields } from "../forms/WifiFields";
import type { ContentDraft, GeneratorState } from "../generator.types";

export function GeneratorForm({
  state,
  fieldErrors,
  onUpdateField,
  onReset,
}: {
  state: GeneratorState;
  fieldErrors: Record<string, string>;
  onUpdateField: (field: string, value: string | boolean | undefined) => void;
  onReset: () => void;
}) {
  const draft: ContentDraft = state.drafts[state.contentType] ?? {};
  const props: FieldsProps = { draft, errors: fieldErrors, onChange: onUpdateField };

  return (
    <section aria-labelledby="content-form-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="content-form-title" className="text-sm font-semibold text-text">
          {ui.types[state.contentType].label}
        </h2>
        <button
          type="button"
          className="rounded-md border border-surface bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={onReset}
        >
          Limpiar
        </button>
      </div>
      {renderFields(state.contentType, props)}
    </section>
  );
}

function renderFields(contentType: GeneratorState["contentType"], props: FieldsProps) {
  switch (contentType) {
    case "text":
      return <TextFields {...props} />;
    case "url":
      return <UrlFields {...props} />;
    case "email":
      return <EmailFields {...props} />;
    case "phone":
      return <PhoneFields {...props} />;
    case "sms":
      return <SmsFields {...props} />;
    case "wifi":
      return <WifiFields {...props} />;
    case "vcard":
      return <VCardFields {...props} />;
    case "calendar":
      return <CalendarFields {...props} />;
    case "geo":
      return <GeoFields {...props} />;
  }
}
