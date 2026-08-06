/**
 * Filtros de analítica (Fase 08): rango preseleccionado (7/30/90 días) y
 * granularidad (hora/día/semana). El rango exacto lo calcula el servicio; aquí
 * se envía from (to = ahora).
 */
import type { AnalyticsGranularity } from "@acore/contracts";
import { ui } from "../../shared/lib/messages";

const RANGE_PRESETS = [
  { days: 7, label: ui.analytics.days7 },
  { days: 30, label: ui.analytics.days30 },
  { days: 90, label: ui.analytics.days90 },
] as const;

export interface AnalyticsFiltersProps {
  rangeDays: number;
  granularity: AnalyticsGranularity;
  onRangeDaysChange: (days: number) => void;
  onGranularityChange: (granularity: AnalyticsGranularity) => void;
}

export function AnalyticsFilters(props: AnalyticsFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <fieldset className="flex flex-col gap-1 text-sm">
        <legend className="text-xs font-medium text-muted">{ui.analytics.rangeLabel}</legend>
        <div className="flex gap-1">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.days}
              type="button"
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                props.rangeDays === preset.days
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-surface bg-surface text-muted hover:border-primary/40 hover:text-text"
              }`}
              onClick={() => props.onRangeDaysChange(preset.days)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium text-muted">{ui.analytics.granularityLabel}</span>
        <select
          className="rounded-md border border-surface bg-surface px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          value={props.granularity}
          onChange={(event) =>
            props.onGranularityChange(event.target.value as AnalyticsGranularity)
          }
          aria-label={ui.analytics.granularityLabel}
        >
          <option value="day">{ui.analytics.granularity.day}</option>
          <option value="week">{ui.analytics.granularity.week}</option>
          <option value="hour">{ui.analytics.granularity.hour}</option>
        </select>
      </label>
    </div>
  );
}
