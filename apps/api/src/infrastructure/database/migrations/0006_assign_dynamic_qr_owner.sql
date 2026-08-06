-- 0006: ownership (Fase 07). El token interno desaparece; los recursos pasan a
-- pertenecer a usuarios (sesión). La Fase 06 dejó columnas uuid previsoras;
-- aquí se alinean al formato de ids del proyecto (text: usr_…, dqr_…).
--
-- - dynamic_qrs.owner_user_id: uuid -> text + FK a users. Las filas existentes
--   quedan NULL (anónimas: siguen redirigiendo, sin gestión en dashboard).
-- - idempotency_keys: ownership por usuario (misma key en usuarios distintos
--   no colisiona). La PK de key_hash se sustituye por un único (owner, key).
-- - audit_events.actor_user_id: uuid -> text (actor_token_hash queda legacy).
ALTER TABLE dynamic_qrs
  ALTER COLUMN owner_user_id TYPE text,
  ADD CONSTRAINT dynamic_qrs_owner_fk FOREIGN KEY (owner_user_id) REFERENCES users(id)
    ON DELETE SET NULL;

-- Idempotencia por usuario: (owner_user_id, key_hash) único; legacy con NULL.
ALTER TABLE idempotency_keys
  DROP CONSTRAINT idempotency_keys_pkey,
  ADD COLUMN owner_user_id text NULL;
CREATE UNIQUE INDEX idempotency_keys_owner_key ON idempotency_keys (owner_user_id, key_hash);
-- Búsquedas legacy por key_hash siguen pudiendo indexarse.
CREATE INDEX idempotency_keys_key_hash ON idempotency_keys (key_hash);

ALTER TABLE audit_events ALTER COLUMN actor_user_id TYPE text;
