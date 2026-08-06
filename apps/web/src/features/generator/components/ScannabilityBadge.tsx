/** Badge de escaneabilidad: veredicto round-trip local (mismo motor que la API). */
import type { RoundTripVerdict } from "@acore/qr-core";
import { ui } from "../../../shared/lib/messages";
import type { QrValidationState } from "../hooks/useQrValidation";

export function ScannabilityBadge({
  hasLogo,
  roundTrip,
  validation,
}: {
  hasLogo: boolean;
  roundTrip: RoundTripVerdict | undefined;
  validation: QrValidationState;
}) {
  if (validation.status === "validating" || validation.status === "idle") {
    return null;
  }

  if (hasLogo && roundTrip !== undefined) {
    const safe = roundTrip.payloadMatches;
    return (
      <section
        aria-labelledby="scannability-title"
        className={`flex flex-col gap-1 rounded-md border p-3 ${
          safe ? "border-primary/40 bg-primary/5" : "border-amber-400/40 bg-amber-400/10"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {ui.scannability.title}
        </p>
        <p className={`text-sm font-medium ${safe ? "text-primary" : "text-amber-400"}`}>
          {safe ? ui.scannability.logoOk : ui.scannability.logoRisk}
        </p>
        <p className="text-xs text-muted">{ui.scannability.eccHigh}</p>
      </section>
    );
  }

  if (validation.status === "valid" || validation.status === "warning") {
    return (
      <section
        aria-labelledby="scannability-title"
        className="flex flex-col gap-1 rounded-md border border-surface bg-surface/50 p-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {ui.scannability.title}
        </p>
        <p className="text-sm font-medium text-primary">{ui.scannability.verified}</p>
      </section>
    );
  }

  return null;
}
