-- 0008: agregados diarios por QR y familia (Fase 08). El job de agregación
-- compacta scan_events con upsert idempotente (reprocesar el mismo día no
-- duplica; mismo (qr_id, day, family) se sobrescribe). unique_visitors es el
-- recuento de hashes distintos del día; como los hashes rotan a diario, el
-- "único" de un rango se estima sumando los de cada día (disclaimer en la UI).
CREATE TABLE scan_aggregates (
  qr_id text NOT NULL REFERENCES dynamic_qrs(id) ON DELETE CASCADE,
  day date NOT NULL,
  device_family text NOT NULL,
  total bigint NOT NULL DEFAULT 0,
  unique_visitors bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (qr_id, day, device_family)
);

CREATE INDEX scan_aggregates_qr_day ON scan_aggregates (qr_id, day DESC);
