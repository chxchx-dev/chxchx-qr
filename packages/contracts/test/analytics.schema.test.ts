import { describe, expect, it } from "vitest";
import {
  ANALYTICS_LIMITS,
  analyticsGranularitySchema,
  analyticsQuerySchema,
  analyticsResponseSchema,
} from "../src/analytics.schema.js";

describe("analyticsQuerySchema", () => {
  it("acepta una consulta vacía (defaults en el servicio)", () => {
    expect(analyticsQuerySchema.safeParse({}).success).toBe(true);
  });

  it("acepta from/to ISO UTC y las tres granularidades", () => {
    const parsed = analyticsQuerySchema.safeParse({
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-08-05T23:59:59.999Z",
      granularity: "week",
    });
    expect(parsed.success).toBe(true);
    for (const granularity of ["hour", "day", "week"] as const) {
      expect(analyticsGranularitySchema.safeParse(granularity).success).toBe(true);
    }
  });

  it("rechaza fechas sin Z y granularidad desconocida", () => {
    expect(analyticsQuerySchema.safeParse({ from: "01-08-2026" }).success).toBe(false);
    expect(analyticsQuerySchema.safeParse({ granularity: "month" }).success).toBe(false);
  });
});

describe("analyticsResponseSchema", () => {
  const valid = {
    range: { from: "2026-08-01T00:00:00.000Z", to: "2026-08-05T23:59:59.999Z" },
    totals: { scans: 1250, estimatedUnique: 860 },
    series: [
      { bucket: "2026-08-01", scans: 250 },
      { bucket: "2026-08-02", scans: 300 },
    ],
    devices: [
      { family: "mobile", scans: 700 },
      { family: "desktop", scans: 550 },
    ],
  };

  it("acepta una respuesta completa", () => {
    expect(analyticsResponseSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza totales negativos o series sin bucket", () => {
    expect(
      analyticsResponseSchema.safeParse({ ...valid, totals: { scans: -1, estimatedUnique: 0 } })
        .success,
    ).toBe(false);
    expect(
      analyticsResponseSchema.safeParse({
        ...valid,
        series: [{ bucket: "", scans: 10 }],
      }).success,
    ).toBe(false);
  });

  it("expone los límites documentados (rango 90d, hora 48h)", () => {
    expect(ANALYTICS_LIMITS.maxRangeDays).toBe(90);
    expect(ANALYTICS_LIMITS.maxHourRangeHours).toBe(48);
  });
});
