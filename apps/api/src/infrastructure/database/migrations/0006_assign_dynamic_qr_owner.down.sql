-- Reversión a la forma de la Fase 06 (uuid NULL). Sin filas no-nulas: segura.
-- El cast text→uuid requiere USING explícito (todas las filas son NULL).
ALTER TABLE dynamic_qrs
  DROP CONSTRAINT dynamic_qrs_owner_fk,
  ALTER COLUMN owner_user_id TYPE uuid USING owner_user_id::uuid;

DROP INDEX idempotency_keys_owner_key;
DROP INDEX idempotency_keys_key_hash;
ALTER TABLE idempotency_keys DROP COLUMN owner_user_id;
ALTER TABLE idempotency_keys ADD PRIMARY KEY (key_hash);

ALTER TABLE audit_events
  ALTER COLUMN actor_user_id TYPE uuid USING actor_user_id::uuid;
