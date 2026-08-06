/**
 * Repositorio de usuarios (Fase 07). SQL parameterizado explícito (ADR-006);
 * el email se normaliza a minúsculas en el servicio, la DB lo guarda tal cual.
 */
import type { Pool, QueryResult, QueryResultRow } from "pg";

interface Queryable {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface UserRow {
  id: string;
  emailNormalized: string;
  passwordHash: string;
  displayName: string | null;
  status: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface UserRowShape {
  id: string;
  email_normalized: string;
  password_hash: string;
  display_name: string | null;
  status: string;
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const USER_COLUMNS = `
  id, email_normalized, password_hash, display_name, status,
  email_verified_at, created_at, updated_at, deleted_at
`;

function toRow(row: UserRowShape): UserRow {
  return {
    id: row.id,
    emailNormalized: row.email_normalized,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    status: row.status,
    emailVerifiedAt: row.email_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export interface UserRepository {
  insert(
    db: Queryable,
    row: { id: string; emailNormalized: string; passwordHash: string; displayName: string | null },
  ): Promise<UserRow>;
  findByEmail(db: Queryable, emailNormalized: string): Promise<UserRow | undefined>;
  findById(db: Queryable, id: string): Promise<UserRow | undefined>;
  updateDisplayName(
    db: Queryable,
    id: string,
    displayName: string | null,
  ): Promise<UserRow | undefined>;
  updatePassword(db: Queryable, id: string, passwordHash: string): Promise<UserRow | undefined>;
}

export function createUserRepository(_pool: Pool): UserRepository {
  return {
    async insert(db, row) {
      const result = await db.query<UserRowShape>(
        `
          INSERT INTO users (id, email_normalized, password_hash, display_name)
          VALUES ($1, $2, $3, $4)
          RETURNING ${USER_COLUMNS}
        `,
        [row.id, row.emailNormalized, row.passwordHash, row.displayName],
      );
      const inserted = result.rows[0];
      if (inserted === undefined) {
        throw new Error("La inserción de users no devolvió fila");
      }
      return toRow(inserted);
    },

    async findByEmail(db, emailNormalized) {
      const result = await db.query<UserRowShape>(
        `SELECT ${USER_COLUMNS} FROM users WHERE email_normalized = $1 AND deleted_at IS NULL`,
        [emailNormalized],
      );
      return result.rows[0] === undefined ? undefined : toRow(result.rows[0]);
    },

    async findById(db, id) {
      const result = await db.query<UserRowShape>(
        `SELECT ${USER_COLUMNS} FROM users WHERE id = $1 AND deleted_at IS NULL`,
        [id],
      );
      return result.rows[0] === undefined ? undefined : toRow(result.rows[0]);
    },

    async updateDisplayName(db, id, displayName) {
      const result = await db.query<UserRowShape>(
        `
          UPDATE users SET display_name = $2, updated_at = now()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING ${USER_COLUMNS}
        `,
        [id, displayName],
      );
      return result.rows[0] === undefined ? undefined : toRow(result.rows[0]);
    },

    async updatePassword(db, id, passwordHash) {
      const result = await db.query<UserRowShape>(
        `
          UPDATE users SET password_hash = $2, updated_at = now()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING ${USER_COLUMNS}
        `,
        [id, passwordHash],
      );
      return result.rows[0] === undefined ? undefined : toRow(result.rows[0]);
    },
  };
}
