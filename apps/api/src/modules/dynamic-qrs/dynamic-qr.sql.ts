/**
 * SQL explícito del módulo (ADR-006): todas las consultas son parameterizadas
 * ($1, $2…) y viven aquí para ser auditable. Nunca se concatena entrada del
 * usuario; los campos del UPDATE se construyen con whitelist en el repository.
 *
 * Fase 07 (ownership): toda consulta de gestión incluye `owner_user_id` en el
 * WHERE (aislamiento usuario A/B). La resolución pública por slug (redirect)
 * no necesita owner: los QR anónimos siguen redirigiendo.
 */

export const DYNAMIC_QR_COLUMNS = `
  id, owner_user_id, name, slug, destination_url, status, version,
  expires_at, created_at, updated_at, deleted_at
`;

export const SQL = {
  insert: `
    INSERT INTO dynamic_qrs
      (id, owner_user_id, name, slug, destination_url, status, version, expires_at, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, 1, $7, now(), now())
    RETURNING ${DYNAMIC_QR_COLUMNS}
  `,
  /** Consulta de gestión: scoped por owner (nunca revela recursos ajenos). */
  findById: `
    SELECT ${DYNAMIC_QR_COLUMNS} FROM dynamic_qrs
    WHERE id = $1 AND owner_user_id = $2 AND deleted_at IS NULL
  `,
  /** Pública (redirect): no requiere owner; los anónimos siguen resolviendo. */
  findBySlug: `
    SELECT ${DYNAMIC_QR_COLUMNS} FROM dynamic_qrs
    WHERE slug = $1 AND deleted_at IS NULL
  `,
  softDelete: `
    UPDATE dynamic_qrs
    SET status = 'deleted', deleted_at = now(), version = version + 1, updated_at = now()
    WHERE id = $1 AND owner_user_id = $2 AND deleted_at IS NULL
    RETURNING ${DYNAMIC_QR_COLUMNS}
  `,
  /** Pública (transición perezosa de expirados): por id, sin owner. */
  markExpired: `
    UPDATE dynamic_qrs
    SET status = 'expired', updated_at = now()
    WHERE id = $1 AND status = 'active' AND expires_at <= now()
    RETURNING ${DYNAMIC_QR_COLUMNS}
  `,
  /** `sets` (whitelist del repository); $1 id, $2 version, $3 owner. */
  updateVersioned: (sets: string): string => `
    UPDATE dynamic_qrs
    SET ${sets}, version = version + 1, updated_at = now()
    WHERE id = $1 AND version = $2 AND owner_user_id = $3 AND deleted_at IS NULL
    RETURNING ${DYNAMIC_QR_COLUMNS}
  `,
  /** `where` incluye ya el owner en $1; search/status siguen. */
  list: (where: string, limitIndex: number, offsetIndex: number): string => `
    SELECT ${DYNAMIC_QR_COLUMNS} FROM dynamic_qrs
    WHERE deleted_at IS NULL${where}
    ORDER BY created_at DESC, id DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
  `,
  count: (where: string): string => `
    SELECT count(*)::int AS total FROM dynamic_qrs
    WHERE deleted_at IS NULL${where}
  `,
  /** Idempotencia por usuario (Fase 07): la key vive bajo el owner. */
  insertIdempotency: `
    INSERT INTO idempotency_keys
      (key_hash, owner_user_id, route, request_hash, response_status, response_body_json, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
    ON CONFLICT (owner_user_id, key_hash) DO NOTHING
  `,
  findIdempotency: `
    SELECT key_hash, route, request_hash, response_status, response_body_json, expires_at
    FROM idempotency_keys WHERE key_hash = $1 AND owner_user_id = $2
  `,
  insertAudit: `
    INSERT INTO audit_events
      (id, actor_token_hash, actor_user_id, action, resource_type, resource_id, metadata_json, request_id)
    VALUES ($1, NULL, $2, $3, $4, $5, $6::jsonb, $7)
  `,
} as const;
