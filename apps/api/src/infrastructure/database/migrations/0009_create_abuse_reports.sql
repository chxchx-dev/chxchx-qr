-- 0009: reportes de abuso (Fase 08). El endpoint es público (rate limit por IP);
-- se guarda el hash de la IP del reportero (nunca la IP completa) y el estado
-- de moderación. El slug se conserva para saber qué se reportó aunque el QR se
-- borre (qr_id se anula con ON DELETE SET NULL).
CREATE TABLE abuse_reports (
  id text PRIMARY KEY,
  qr_id text NULL REFERENCES dynamic_qrs(id) ON DELETE SET NULL,
  slug text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'dismissed')),
  reporter_ip_hash text NULL,
  request_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,
  resolved_by text NULL
);

-- Moderación: cola abierta primero; historial por QR.
CREATE INDEX abuse_reports_status ON abuse_reports (status, created_at DESC);
CREATE INDEX abuse_reports_qr ON abuse_reports (qr_id);
