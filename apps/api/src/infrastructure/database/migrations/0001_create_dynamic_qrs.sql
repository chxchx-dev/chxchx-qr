-- 0001: QR dinámicos (Fase 06, ADR-004/006).
-- El id externo es dqr_<uuid>; el slug corto es la clave de /r/{slug}.
CREATE TABLE dynamic_qrs (
  id text PRIMARY KEY,
  owner_user_id uuid NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  destination_url text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'expired', 'blocked', 'deleted')),
  version integer NOT NULL DEFAULT 1,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL
);

-- Consultas prioritarias (docs/06 §10): resolver slug, listar por owner,
-- filtrar por estado y limpiar expirados.
CREATE INDEX dynamic_qrs_owner_updated ON dynamic_qrs (owner_user_id, updated_at DESC);
CREATE INDEX dynamic_qrs_owner_status ON dynamic_qrs (owner_user_id, status);
CREATE INDEX dynamic_qrs_expires_at ON dynamic_qrs (expires_at) WHERE expires_at IS NOT NULL;
