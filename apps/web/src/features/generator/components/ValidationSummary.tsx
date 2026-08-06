/** Resumen de validación con aria-live: estado, densidad, avisos y recomendaciones. */
import { ui } from "../../../shared/lib/messages";
import type { QrValidationState } from "../hooks/useQrValidation";

const STATUS_LABELS = {
  idle: ui.validation.idle,
  validating: ui.validation.validating,
  valid: ui.validation.valid,
  warning: ui.validation.warning,
  invalid: ui.validation.invalid,
  "server-error": ui.validation.serverError,
} as const;

const STATUS_TONE = {
  idle: "text-muted",
  validating: "text-muted",
  valid: "text-primary",
  warning: "text-amber-400",
  invalid: "text-danger",
  "server-error": "text-danger",
} as const;

function densityLabel(density: QrValidationState["density"]): string | undefined {
  if (density === "dense") return ui.validation.densityDense;
  if (density === "critical") return ui.validation.densityCritical;
  if (density === "safe") return ui.validation.densitySafe;
  return undefined;
}

export function ValidationSummary({ validation }: { validation: QrValidationState }) {
  const { status } = validation;
  const density = densityLabel(validation.density);
  const showList = status === "valid" || status === "warning";

  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-2 rounded-md border border-surface bg-surface/50 p-3"
    >
      <p className={`flex items-center gap-2 text-sm font-medium ${STATUS_TONE[status]}`}>
        <span aria-hidden="true">{status === "validating" ? "…" : "●"}</span>
        {STATUS_LABELS[status]}
      </p>
      {validation.message !== undefined && (
        <p className="text-sm text-text">{validation.message}</p>
      )}
      {showList && (
        <>
          {density !== undefined && <p className="text-xs text-muted">{density}</p>}
          {validation.warnings.length > 0 && (
            <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted">
              {validation.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          {validation.recommendations.length > 0 && (
            <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted">
              {validation.recommendations.map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
