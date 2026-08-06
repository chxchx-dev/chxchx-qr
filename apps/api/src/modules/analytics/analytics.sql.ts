/**
 * SQL explícito del módulo de analítica (Fase 08, ADR-006): parameterizado,
 * sin concatenación de entrada del usuario. La agregación es idempotente por
 * diseño (upsert por (qr_id, day, device_family)); la serie horaria solo se
 * sirve para rangos cortos (validación en el servicio).
 */
export const SQL = {
  insertEvent: `
    INSERT INTO scan_events
      (id, qr_id, scanned_at, visitor_hash, is_bot, device_family, referrer_domain, country, request_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8)
  `,
  /** Compacta un día completo: recomputar el mismo día no duplica (upsert). */
  upsertDaily: `
    INSERT INTO scan_aggregates (qr_id, day, device_family, total, unique_visitors, updated_at)
    SELECT qr_id, $1::date, device_family, count(*)::bigint, count(DISTINCT visitor_hash)::bigint, now()
    FROM scan_events
    WHERE scanned_at >= $1::date AND scanned_at < $1::date + INTERVAL '1 day'
    GROUP BY qr_id, device_family
    ON CONFLICT (qr_id, day, device_family) DO UPDATE SET
      total = excluded.total,
      unique_visitors = excluded.unique_visitors,
      updated_at = now()
  `,
  purgeEvents: `
    DELETE FROM scan_events WHERE scanned_at < now() - make_interval(days => $1)
  `,
  /** Días con eventos pero sin agregado (dentro de la retención, antes de hoy). */
  missingHistoricalDays: `
    SELECT DISTINCT to_char(scanned_at, 'YYYY-MM-DD') AS day
    FROM scan_events
    WHERE scanned_at >= now() - make_interval(days => $1)
      AND scanned_at < date_trunc('day', now())
      AND NOT EXISTS (
        SELECT 1 FROM scan_aggregates a
        WHERE a.qr_id = scan_events.qr_id AND a.day = scan_events.scanned_at::date
      )
    ORDER BY 1
  `,
  totals: `
    SELECT coalesce(sum(total), 0)::int AS scans, coalesce(sum(unique_visitors), 0)::int AS unique_visitors
    FROM scan_aggregates
    WHERE qr_id = $1 AND day >= $2::date AND day <= $3::date
  `,
  seriesDay: `
    SELECT to_char(day, 'YYYY-MM-DD') AS bucket, sum(total)::int AS scans
    FROM scan_aggregates
    WHERE qr_id = $1 AND day >= $2::date AND day <= $3::date
    GROUP BY day ORDER BY day
  `,
  seriesWeek: `
    SELECT to_char(date_trunc('week', day), 'YYYY-MM-DD') AS bucket, sum(total)::int AS scans
    FROM scan_aggregates
    WHERE qr_id = $1 AND day >= $2::date AND day <= $3::date
    GROUP BY 1 ORDER BY 1
  `,
  seriesHour: `
    SELECT to_char(date_trunc('hour', scanned_at), 'YYYY-MM-DD"T"HH24:00:00"Z"') AS bucket,
           count(*)::int AS scans
    FROM scan_events
    WHERE qr_id = $1 AND scanned_at >= $2 AND scanned_at <= $3
    GROUP BY 1 ORDER BY 1
  `,
  devices: `
    SELECT device_family AS family, sum(total)::int AS scans
    FROM scan_aggregates
    WHERE qr_id = $1 AND day >= $2::date AND day <= $3::date
    GROUP BY device_family ORDER BY scans DESC
  `,
} as const;
