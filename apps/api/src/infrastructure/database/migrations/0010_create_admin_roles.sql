-- 0010: roles de administración (Fase 08). Bootstrap por SQL manual (decisión
-- de la fase): INSERT INTO admin_roles (user_id, created_by) VALUES ('usr_...',
-- 'manual'); no hay endpoint de promoción. `created_by` anota quién asignó el
-- rol (id de usuario o 'manual').
CREATE TABLE admin_roles (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NULL
);

CREATE INDEX admin_roles_created ON admin_roles (created_at DESC);
