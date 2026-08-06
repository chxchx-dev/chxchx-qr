-- 0007: eventos de escaneo (Fase 08). Sin IP completa ni UA crudo: solo el hash
-- diario del visitante (HMAC con ANALYTICS_HMAC_SECRET_CURRENT + fecha), la
-- familia de dispositivo y el dominio del referrer. `country` queda inactivo
-- (siempre NULL; decisión de la fase: la geolocalización no está habilitada).
-- Los bots se separan en la familia 'bot' y sin visitor_hash.
CREATE TABLE scan_events (
  id text PRIMARY KEY,
  qr_id text NOT NULL REFERENCES dynamic_qrs(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL,
  visitor_hash text NULL,
  is_bot boolean NOT NULL DEFAULT false,
  device_family text NOT NULL,
  referrer_domain text NULL,
  country text NULL,
  request_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Consultas prioritarias: serie por QR y purga por retención.
CREATE INDEX scan_events_qr_scanned ON scan_events (qr_id, scanned_at);
CREATE INDEX scan_events_scanned ON scan_events (scanned_at);
-- Auditoría de abuso futura por visitante (solo hashes, nunca IP/UA).
CREATE INDEX scan_events_visitor ON scan_events (visitor_hash) WHERE visitor_hash IS NOT NULL;
