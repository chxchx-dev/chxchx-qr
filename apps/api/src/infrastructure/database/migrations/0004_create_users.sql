-- 0004: usuarios (Fase 07, ADR-005). Id externo usr_<uuid> (docs/06 §2).
-- email_normalized guarda la forma minúscula (único case-insensitive en la app).
CREATE TABLE users (
  id text PRIMARY KEY,
  email_normalized text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'blocked', 'deleted')),
  email_verified_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL
);
