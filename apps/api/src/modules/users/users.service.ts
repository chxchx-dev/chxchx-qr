/**
 * Servicio de perfil de usuario (Fase 07). La lógica de dominio de cuentas
 * vive en el módulo auth; este módulo expone la superficie de gestión de
 * perfil (display name y cambio de contraseña) sin duplicarla.
 */
import type { AuthUser, UpdateProfileInput } from "@acore/contracts";
import type { AuthService } from "../auth/auth.service.js";

export interface UsersService {
  updateProfile(userId: string, sessionId: string, input: UpdateProfileInput): Promise<AuthUser>;
}

export function createUsersService(authService: AuthService): UsersService {
  return {
    updateProfile: (userId, sessionId, input) =>
      authService.updateProfile(userId, sessionId, input),
  };
}
