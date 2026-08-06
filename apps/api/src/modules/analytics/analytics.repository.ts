/**
 * Repositorio de analítica (Fase 08): eventos crudos (escritura), agregados
 * diarios (upsert idempotente) y lecturas para el endpoint (totales, serie,
 * dispositivos). Todo el SQL vive en `analytics.sql.ts` (ADR-006).
 */
import type { AnalyticsGranularity } from "@acore/contracts";
import type { Pool, QueryResult, QueryResultRow } from "pg";
import { SQL } from "./analytics.sql.js";

interface Queryable {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface ScanEventInput {
  id: string;
  qrId: string;
  scannedAt: Date;
  visitorHash: string | null;
  isBot: boolean;
  deviceFamily: string;
  referrerDomain: string | null;
  requestId: string | undefined;
}

interface TotalsRow {
  scans: number;
  unique_visitors: number;
}

interface SeriesRow {
  bucket: string;
  scans: number;
}

interface DeviceRow {
  family: string;
  scans: number;
}

export interface AnalyticsRepository {
  insertEvent(db: Queryable, event: ScanEventInput): Promise<void>;
  upsertDaily(db: Queryable, day: string): Promise<void>;
  missingHistoricalDays(db: Queryable, retentionDays: number): Promise<string[]>;
  purgeEvents(db: Queryable, retentionDays: number): Promise<void>;
  totals(
    db: Queryable,
    qrId: string,
    fromDay: string,
    toDay: string,
  ): Promise<{ scans: number; uniqueVisitors: number }>;
  series(
    db: Queryable,
    granularity: AnalyticsGranularity,
    qrId: string,
    from: Date,
    to: Date,
    fromDay: string,
    toDay: string,
  ): Promise<Array<{ bucket: string; scans: number }>>;
  devices(
    db: Queryable,
    qrId: string,
    fromDay: string,
    toDay: string,
  ): Promise<Array<{ family: string; scans: number }>>;
}

export function createAnalyticsRepository(_pool: Pool): AnalyticsRepository {
  return {
    async insertEvent(db, event) {
      await db.query(SQL.insertEvent, [
        event.id,
        event.qrId,
        event.scannedAt,
        event.visitorHash,
        event.isBot,
        event.deviceFamily,
        event.referrerDomain,
        event.requestId ?? null,
      ]);
    },

    async upsertDaily(db, day) {
      await db.query(SQL.upsertDaily, [day]);
    },

    async missingHistoricalDays(db, retentionDays) {
      const result = await db.query<{ day: string }>(SQL.missingHistoricalDays, [retentionDays]);
      return result.rows.map((row) => row.day);
    },

    async purgeEvents(db, retentionDays) {
      await db.query(SQL.purgeEvents, [retentionDays]);
    },

    async totals(db, qrId, fromDay, toDay) {
      const result = await db.query<TotalsRow>(SQL.totals, [qrId, fromDay, toDay]);
      const row = result.rows[0];
      return {
        scans: row?.scans ?? 0,
        uniqueVisitors: row?.unique_visitors ?? 0,
      };
    },

    async series(db, granularity, qrId, from, to, fromDay, toDay) {
      if (granularity === "hour") {
        const result = await db.query<SeriesRow>(SQL.seriesHour, [qrId, from, to]);
        return result.rows;
      }
      const result = await db.query<SeriesRow>(
        granularity === "week" ? SQL.seriesWeek : SQL.seriesDay,
        [qrId, fromDay, toDay],
      );
      return result.rows;
    },

    async devices(db, qrId, fromDay, toDay) {
      const result = await db.query<DeviceRow>(SQL.devices, [qrId, fromDay, toDay]);
      return result.rows;
    },
  };
}
