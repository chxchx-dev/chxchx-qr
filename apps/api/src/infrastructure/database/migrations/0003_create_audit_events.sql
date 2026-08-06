-- 0003: auditoría (Fase 06). Rastro no bloqueante de mutaciones. El actor en
-- esta fase es el hash del token interno (nunca el token); usuario llega en
-- Fase 07. No se guardan secretos ni contraseñas en metadata.
CREATE TABLE audit_events (
  id text PRIMARY KEY,
  actor_token_hash text NULL,
  actor_user_id uuid NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  metadata_json jsonb NULL,
  request_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_resource ON audit_events (resource_type, resource_id, created_at DESC);
CREATE INDEX audit_events_created ON audit_events (created_at DESC);
