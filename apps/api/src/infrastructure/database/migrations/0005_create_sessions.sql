-- 0005: sesiones opacas (Fase 07, ADR-005). Solo se guarda el hash del token
-- (sha256); nunca el token original. Revocación y expiración por fila.
CREATE TABLE sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz NULL,
  user_agent_summary text NULL,
  ip_hash text NULL
);

-- Consultas prioritarias: sesiones de un usuario y limpieza de expiradas.
CREATE INDEX sessions_user ON sessions (user_id, created_at DESC);
CREATE INDEX sessions_expires ON sessions (expires_at);
