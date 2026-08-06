/**
 * Serie temporal de escaneos (Fase 08): gráfico de barras en CSS puro (sin
 * librerías). El bucket es una fecha ISO; la etiqueta se acorta según el
 * formato (día → DD-MM, hora → HH:00, semana → fecha inicial).
 */
import { ui } from "../../shared/lib/messages";

function shortLabel(bucket: string): string {
  // Hora ISO: YYYY-MM-DDTHH:00:00Z → HH:00
  if (bucket.length >= 16) {
    return bucket.slice(11, 16);
  }
  // Fecha ISO: YYYY-MM-DD → DD-MM
  const parts = bucket.slice(5).split("-");
  return parts.length === 2 ? `${parts[1]}-${parts[0]}` : bucket.slice(5);
}

export function ScanSeriesChart({ series }: { series: Array<{ bucket: string; scans: number }> }) {
  if (series.length === 0) {
    return <p className="text-sm text-muted">{ui.analytics.noData}</p>;
  }
  const max = Math.max(...series.map((point) => point.scans), 1);

  return (
    <div className="flex items-end gap-1" role="img" aria-label={ui.analytics.series}>
      {series.map((point) => {
        const height = Math.max(4, Math.round((point.scans / max) * 100));
        return (
          <div key={point.bucket} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-32 w-full items-end justify-center">
              <div
                className="w-full max-w-8 rounded-t bg-primary/70 transition-colors hover:bg-primary"
                style={{ height: `${height}%` }}
                title={`${point.bucket}: ${point.scans.toLocaleString("es")}`}
              />
            </div>
            <span className="text-[10px] leading-none text-muted">{shortLabel(point.bucket)}</span>
          </div>
        );
      })}
    </div>
  );
}
