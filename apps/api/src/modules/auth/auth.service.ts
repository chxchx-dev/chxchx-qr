/**
 * Servicio de auth (Fase 07, ADR-005): registro/login con sesión opaca nueva
 * por acceso (anti-fixation), resolución de sesión para el middleware, logout
 * revocando, y actualización de perfil con revocación de las demás sesiones al
 * cambiar la contraseña.
 *
 * El email se normaliza a minúsculas (único case-insensitive); el login
 * devuelve el mismo error para email desconocido y contraseña incorrecta.
 */
import type { AuthUser, LoginInput, RegisterInput, UpdateProfileInput } from "@acore/contracts";
import type { Pool } from "pg";
import { withTransaction } from "../../infrastructure/database/transaction.js";
import {
  AuthCurrentPasswordInvalidError,
  AuthEmailInUseError,
  AuthInvalidCredentialsError,
  AuthUnauthenticatedError,
} from "./auth.errors.js";
import { newSessionId, newUserId } from "./ids.js";
import { hashPassword, type ScryptParams, verifyPassword } from "./password.js";
import { createSessionRepository, type SessionRepository } from "./session.repository.js";
import { generateSessionToken, hashSessionToken } from "./session-token.js";
import { createUserRepository, type UserRepository } from "./user.repository.js";

export interface SessionMeta {
  userAgentSummary: string | undefined;
  ipHash: string | undefined;
}

export interface AuthService {
  register(input: RegisterInput, meta: SessionMeta): Promise<{ user: AuthUser; token: string }>;
  login(input: LoginInput, meta: SessionMeta): Promise<{ user: AuthUser; token: string }>;
  logout(sessionId: string): Promise<void>;
  /** Resuelve un token de sesión (usado por el middleware); undefined si inválida. */
  resolveSession(
    token: string,
  ): Promise<{ sessionId: string; userId: string; user: AuthUser } | undefined>;
  getProfile(userId: string): Promise<AuthUser>;
  updateProfile(userId: string, sessionId: string, input: UpdateProfileInput): Promise<AuthUser>;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function toAuthUser(user: {
  id: string;
  emailNormalized: string;
  displayName: string | null;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    email: user.emailNormalized,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  };
}

export function createAuthService(input: {
  pool: Pool;
  scryptParams: ScryptParams;
  sessionTtlMs: number;
}): AuthService {
  const users: UserRepository = createUserRepository(input.pool);
  const sessions: SessionRepository = createSessionRepository(input.pool);

  async function issueSession(
    db: Parameters<SessionRepository["insert"]>[0],
    userId: string,
    meta: SessionMeta,
  ): Promise<{ token: string }> {
    const token = generateSessionToken();
    await sessions.insert(db, {
      id: newSessionId(),
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + input.sessionTtlMs),
      userAgentSummary: meta.userAgentSummary ?? null,
      ipHash: meta.ipHash ?? null,
    });
    return { token };
  }

  return {
    async register(registerInput, meta) {
      const emailNormalized = normalizeEmail(registerInput.email);
      const existing = await users.findByEmail(input.pool, emailNormalized);
      if (existing !== undefined) {
        throw new AuthEmailInUseError();
      }
      const passwordHash = await hashPassword(registerInput.password, input.scryptParams);
      const { user, token } = await withTransaction(input.pool, async (tx) => {
        const created = await users.insert(tx, {
          id: newUserId(),
          emailNormalized,
          passwordHash,
          displayName: registerInput.displayName ?? null,
        });
        const issued = await issueSession(tx, created.id, meta);
        return { user: created, token: issued.token };
      });
      return { user: toAuthUser(user), token };
    },

    async login(loginInput, meta) {
      const emailNormalized = normalizeEmail(loginInput.email);
      const user = await users.findByEmail(input.pool, emailNormalized);
      // Verificar el hash solo cuando existe; el error es idéntico en ambos casos.
      const passwordOk =
        user !== undefined &&
        (await verifyPassword(loginInput.password, user.passwordHash).catch(() => false));
      if (user === undefined || !passwordOk || user.status !== "active") {
        throw new AuthInvalidCredentialsError();
      }
      const token = await withTransaction(input.pool, async (tx) => {
        const issued = await issueSession(tx, user.id, meta);
        return issued.token;
      });
      return { user: toAuthUser(user), token };
    },

    async logout(sessionId) {
      await sessions.revoke(input.pool, sessionId);
    },

    async resolveSession(token) {
      const found = await sessions.findSessionWithUser(input.pool, hashSessionToken(token));
      if (found === undefined) {
        return undefined;
      }
      if (found.session.revokedAt !== null) {
        return undefined;
      }
      if (found.session.expiresAt.getTime() <= Date.now()) {
        return undefined;
      }
      if (found.user.status !== "active") {
        return undefined;
      }
      // last_seen perezoso: no bloquea la petición.
      void sessions.touchLastSeen(input.pool, found.session.id).catch(() => undefined);
      return {
        sessionId: found.session.id,
        userId: found.user.id,
        user: toAuthUser(found.user),
      };
    },

    async getProfile(userId) {
      const user = await users.findById(input.pool, userId);
      if (user === undefined) {
        throw new AuthUnauthenticatedError();
      }
      return toAuthUser(user);
    },

    async updateProfile(userId, sessionId, patch) {
      return withTransaction(input.pool, async (tx) => {
        if (patch.newPassword !== undefined) {
          const current = await users.findById(tx, userId);
          if (current === undefined) {
            throw new AuthUnauthenticatedError();
          }
          const ok = await verifyPassword(patch.currentPassword ?? "", current.passwordHash).catch(
            () => false,
          );
          if (!ok) {
            throw new AuthCurrentPasswordInvalidError();
          }
          const passwordHash = await hashPassword(patch.newPassword, input.scryptParams);
          await users.updatePassword(tx, userId, passwordHash);
          // Cambio de contraseña: revocar el resto de sesiones (mejora práctica).
          await sessions.revokeOthers(tx, userId, sessionId);
        }
        if (patch.displayName !== undefined) {
          await users.updateDisplayName(
            tx,
            userId,
            patch.displayName.trim() === "" ? null : patch.displayName,
          );
        }
        const updated = await users.findById(tx, userId);
        if (updated === undefined) {
          throw new AuthUnauthenticatedError();
        }
        return toAuthUser(updated);
      });
    },
  };
}
