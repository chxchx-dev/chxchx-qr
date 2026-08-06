/**
 * Servicio de analítica (Fase 08): verifica ownership del QR (aislamiento A/B,
 * 404 sin revelar existencia), valida el rango y granularidad y construye la
 * respuesta con totales, serie y dispositivos. UTC interno; el timezone de
 * presentación es decisión del cliente (la web lo convierte).
 */
import {
  ANALYTICS_LIMITS,
  type AnalyticsGranularity,
  type AnalyticsQuery,
  type AnalyticsResponse,
} from "@acore/contracts";
import type { Pool } from "pg";
import {
  createDynamicQrRepository,
  type DynamicQrRepository,
} from "../dynamic-qrs/dynamic-qr.repository.js";
import { AnalyticsInvalidRangeError, AnalyticsNotFoundError } from "./analytics.errors.js";
import { type AnalyticsRepository, createAnalyticsRepository } from "./analytics.repository.js";
import { dayKeyOf } from "./visitor-hash.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export interface AnalyticsService {
  get(qrId: string, ownerUserId: string, query: AnalyticsQuery): Promise<AnalyticsResponse>;
}

function parseDate(value: string | undefined, fallback: Date): Date {
  if (value === undefined) {
    return fallback;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function validateRange(from: Date, to: Date, granularity: AnalyticsGranularity | undefined): void {
  if (from.getTime() > to.getTime()) {
    throw new AnalyticsInvalidRangeError("from debe ser anterior o igual a to");
  }
  if (to.getTime() - from.getTime() > ANALYTICS_LIMITS.maxRangeDays * DAY_MS) {
    throw new AnalyticsInvalidRangeError(
      `El rango máximo es de ${ANALYTICS_LIMITS.maxRangeDays} días`,
    );
  }
  if (
    granularity === "hour" &&
    to.getTime() - from.getTime() > ANALYTICS_LIMITS.maxHourRangeHours * HOUR_MS
  ) {
    throw new AnalyticsInvalidRangeError(
      `La granularidad horaria admite como máximo ${ANALYTICS_LIMITS.maxHourRangeHours} horas`,
    );
  }
}

export function createAnalyticsService(input: { pool: Pool }): AnalyticsService {
  const repo: AnalyticsRepository = createAnalyticsRepository(input.pool);
  const dynamicQrs: DynamicQrRepository = createDynamicQrRepository(input.pool);

  return {
    async get(qrId, ownerUserId, query) {
      // Ownership primero: ajeno o inexistente → 404 ANL_NOT_FOUND.
      const qr = await dynamicQrs.findById(input.pool, qrId, ownerUserId);
      if (qr === undefined) {
        throw new AnalyticsNotFoundError();
      }

      const to = parseDate(query.to, new Date());
      const from = parseDate(
        query.from,
        new Date(to.getTime() - ANALYTICS_LIMITS.defaultRangeDays * DAY_MS),
      );
      const granularity = query.granularity ?? "day";
      validateRange(from, to, granularity);

      const fromDay = dayKeyOf(from);
      const toDay = dayKeyOf(to);
      const totals = await repo.totals(input.pool, qrId, fromDay, toDay);
      const series = await repo.series(input.pool, granularity, qrId, from, to, fromDay, toDay);
      const devices = await repo.devices(input.pool, qrId, fromDay, toDay);

      return {
        range: { from: from.toISOString(), to: to.toISOString() },
        totals: { scans: totals.scans, estimatedUnique: totals.uniqueVisitors },
        series,
        devices,
      };
    },
  };
}
