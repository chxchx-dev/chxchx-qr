/**
 * Repositorio de sesiones (Fase 07, ADR-005). Solo se consulta por el hash del
 * token (nunca hay token en la DB). `findSessionWithUser` hace el join en una
 * sola consulta para el middleware de auth.
 */
import type { Pool, QueryResult, QueryResultRow } from "pg";

interface Queryable {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface SessionRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  lastSeenAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface SessionWithUser {
  session: { id: string; userId: string; expiresAt: Date; revokedAt: Date | null };
  user: {
    id: string;
    emailNormalized: string;
    displayName: string | null;
    status: string;
    createdAt: Date;
  };
}

interface SessionRowShape {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  last_seen_at: Date | null;
  created_at: Date;
  revoked_at: Date | null;
}

interface SessionWithUserShape {
  session_id: string;
  user_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  u_id: string;
  email_normalized: string;
  display_name: string | null;
  status: string;
  created_at: Date;
}

function toSession(row: SessionRowShape): SessionRow {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

function toSessionWithUser(row: SessionWithUserShape): SessionWithUser {
  return {
    session: {
      id: row.session_id,
      userId: row.user_id,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
    },
    user: {
      id: row.u_id,
      emailNormalized: row.email_normalized,
      displayName: row.display_name,
      status: row.status,
      createdAt: row.created_at,
    },
  };
}

export interface SessionRepository {
  insert(
    db: Queryable,
    row: {
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      userAgentSummary: string | null;
      ipHash: string | null;
    },
  ): Promise<void>;
  findByTokenHash(db: Queryable, tokenHash: string): Promise<SessionRow | undefined>;
  findSessionWithUser(db: Queryable, tokenHash: string): Promise<SessionWithUser | undefined>;
  revoke(db: Queryable, sessionId: string): Promise<void>;
  /** Revoca las demás sesiones del usuario (cambio de contraseña). */
  revokeOthers(db: Queryable, userId: string, keepSessionId: string): Promise<void>;
  touchLastSeen(db: Queryable, sessionId: string): Promise<void>;
}

export function createSessionRepository(_pool: Pool): SessionRepository {
  return {
    async insert(db, row) {
      await db.query(
        `
          INSERT INTO sessions (id, user_id, token_hash, expires_at, user_agent_summary, ip_hash)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [row.id, row.userId, row.tokenHash, row.expiresAt, row.userAgentSummary, row.ipHash],
      );
    },

    async findByTokenHash(db, tokenHash) {
      const result = await db.query<SessionRowShape>(
        `
          SELECT id, user_id, token_hash, expires_at, last_seen_at, created_at, revoked_at
          FROM sessions WHERE token_hash = $1
        `,
        [tokenHash],
      );
      return result.rows[0] === undefined ? undefined : toSession(result.rows[0]);
    },

    async findSessionWithUser(db, tokenHash) {
      const result = await db.query<SessionWithUserShape>(
        `
          SELECT s.id AS session_id, s.user_id, s.expires_at, s.revoked_at,
                 u.id AS u_id, u.email_normalized, u.display_name, u.status, u.created_at
          FROM sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = $1
        `,
        [tokenHash],
      );
      return result.rows[0] === undefined ? undefined : toSessionWithUser(result.rows[0]);
    },

    async revoke(db, sessionId) {
      await db.query(
        "UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL",
        [sessionId],
      );
    },

    async revokeOthers(db, userId, keepSessionId) {
      await db.query(
        `
          UPDATE sessions SET revoked_at = now()
          WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL
        `,
        [userId, keepSessionId],
      );
    },

    async touchLastSeen(db, sessionId) {
      await db.query("UPDATE sessions SET last_seen_at = now() WHERE id = $1", [sessionId]);
    },
  };
}
