-- 0002: claves de idempotencia (Fase 06). Replay de mutaciones: se guarda el
-- hash de la clave + hash del request + la respuesta almacenada. Retención 24h.
CREATE TABLE idempotency_keys (
  key_hash text PRIMARY KEY,
  route text NOT NULL,
  request_hash text NOT NULL,
  response_status integer NOT NULL,
  response_body_json jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idempotency_keys_expires_at ON idempotency_keys (expires_at);
