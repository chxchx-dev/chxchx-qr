/**
 * Resumen de totales (Fase 08): tarjetas de escaneos y únicos estimados con su
 * disclaimer (el hash del visitante rota a diario → los únicos son estimados).
 */
import { ui } from "../../shared/lib/messages";

export function ScanSummary({
  scans,
  estimatedUnique,
}: {
  scans: number;
  estimatedUnique: number;
}) {
  const cards = [
    { label: ui.analytics.scans, value: scans.toLocaleString("es") },
    { label: ui.analytics.estimatedUnique, value: estimatedUnique.toLocaleString("es") },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-md border border-surface bg-surface p-4 text-center"
          >
            <p className="text-2xl font-bold tracking-tight text-text">{card.value}</p>
            <p className="mt-1 text-xs text-muted">{card.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">{ui.analytics.disclaimer}</p>
    </div>
  );
}
