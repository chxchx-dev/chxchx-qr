/**
 * Desglose por dispositivo (Fase 08): barras proporcionales sin dependencias.
 * La familia 'bot' se muestra separada (la política de bots la aísla).
 */
import { ui } from "../../shared/lib/messages";

const FAMILY_LABELS: Record<string, string> = {
  mobile: "Móvil",
  desktop: "Escritorio",
  tablet: "Tablet",
  bot: "Bots",
  unknown: "Desconocido",
};

export function DeviceBreakdown({
  devices,
}: {
  devices: Array<{ family: string; scans: number }>;
}) {
  if (devices.length === 0) {
    return <p className="text-sm text-muted">{ui.analytics.noData}</p>;
  }
  const max = Math.max(...devices.map((device) => device.scans), 1);

  return (
    <ul className="flex flex-col gap-2">
      {devices.map((device) => (
        <li key={device.family} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm text-text">
            {FAMILY_LABELS[device.family] ?? device.family}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-2 rounded-full bg-primary/70"
              style={{ width: `${Math.max(4, Math.round((device.scans / max) * 100))}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-sm tabular-nums text-muted">
            {device.scans.toLocaleString("es")}
          </span>
        </li>
      ))}
    </ul>
  );
}
