/**
 * Cliente de auth (Fase 07). La sesión la gestiona el navegador vía cookie
 * HttpOnly: este cliente solo llama a los endpoints; nunca guarda tokens.
 */
import type { AuthUser, LoginInput, RegisterInput } from "@acore/contracts";
import { apiFetch } from "../../shared/lib/api";

export interface AuthResponse {
  user: AuthUser;
}

export async function registerRequest(input: RegisterInput): Promise<AuthUser> {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as AuthResponse;
  return body.user;
}

export async function loginRequest(input: LoginInput): Promise<AuthUser> {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as AuthResponse;
  return body.user;
}

export async function logoutRequest(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

/** Perfil del usuario autenticado; 401 → ApiError (sesión ausente/expirada). */
export async function meRequest(): Promise<AuthUser> {
  const res = await apiFetch("/auth/me");
  const body = (await res.json()) as AuthResponse;
  return body.user;
}
