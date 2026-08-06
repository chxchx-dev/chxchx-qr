/**
 * Esquemas de analítica de QR dinámicos (Fase 08): consulta con rango y
 * granularidad, y respuesta con totales, serie temporal y dispositivos. El
 * rango máximo se aplica en el servicio (validación de negocio, no de esquema).
 */
import { z } from "zod";

export const ANALYTICS_LIMITS = {
  /** Rango máximo consultable (días). */
  maxRangeDays: 90,
  /** Granularidad horaria solo para rangos cortos (horas). */
  maxHourRangeHours: 48,
  /** Rango por defecto (días hacia atrás desde `to`). */
  defaultRangeDays: 30,
} as const;

export const analyticsGranularitySchema = z.enum(["hour", "day", "week"]);

export type AnalyticsGranularity = z.infer<typeof analyticsGranularitySchema>;

/** Fecha ISO 8601 (Z). `to`/`from` son opcionales; los defaults los pone el servicio. */
export const analyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: analyticsGranularitySchema.optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

export const analyticsResponseSchema = z.object({
  range: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  totals: z.object({
    scans: z.number().int().nonnegative(),
    estimatedUnique: z.number().int().nonnegative(),
  }),
  series: z.array(
    z.object({
      bucket: z.string().min(1),
      scans: z.number().int().nonnegative(),
    }),
  ),
  devices: z.array(
    z.object({
      family: z.string().min(1),
      scans: z.number().int().nonnegative(),
    }),
  ),
});

export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;
