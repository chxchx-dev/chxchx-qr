/**
 * Esquemas de autenticación y perfil (Fase 07): registro, login y perfil del
 * usuario autenticado. Las contraseñas nunca viajan en respuestas; el email se
 * normaliza a minúsculas en el servicio.
 */
import { z } from "zod";

export const AUTH_LIMITS = {
  emailMaxLength: 254,
  passwordMinLength: 8,
  passwordMaxLength: 128,
  displayNameMaxLength: 60,
} as const;

/** Email obligatorio y con longitud estándar (RFC 5321). */
export const emailField = z
  .string()
  .trim()
  .min(1, "El correo es obligatorio")
  .max(AUTH_LIMITS.emailMaxLength, `Máximo ${AUTH_LIMITS.emailMaxLength} caracteres`)
  .email("Introduce un correo válido");

/** Contraseña: longitud mínima/máxima; scrypt acepta cualquier byte. */
export const passwordField = z
  .string()
  .min(AUTH_LIMITS.passwordMinLength, `Mínimo ${AUTH_LIMITS.passwordMinLength} caracteres`)
  .max(AUTH_LIMITS.passwordMaxLength, `Máximo ${AUTH_LIMITS.passwordMaxLength} caracteres`);

export const registerSchema = z.object({
  email: emailField,
  password: passwordField,
  displayName: z
    .string()
    .trim()
    .max(AUTH_LIMITS.displayNameMaxLength, `Máximo ${AUTH_LIMITS.displayNameMaxLength} caracteres`)
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Perfil del usuario autenticado. `displayName` puede ser null (sin nombre).
 * `email` es la forma normalizada (minúsculas) que se guarda.
 */
export const authUserSchema = z.object({
  id: z.string().min(1),
  email: emailField,
  displayName: z.string().max(AUTH_LIMITS.displayNameMaxLength).nullable(),
  createdAt: z.string().datetime(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const authResponseSchema = z.object({ user: authUserSchema });

export type AuthResponse = z.infer<typeof authResponseSchema>;

/**
 * Actualización de perfil: displayName y/o cambio de contraseña. Si se envía
 * `newPassword` debe acompañarse de `currentPassword` (verificación en el
 * servicio). Refine: al menos un campo, y newPassword exige currentPassword.
 */
export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .max(
        AUTH_LIMITS.displayNameMaxLength,
        `Máximo ${AUTH_LIMITS.displayNameMaxLength} caracteres`,
      )
      .optional(),
    currentPassword: passwordField.optional(),
    newPassword: passwordField.optional(),
  })
  .refine((patch) => patch.displayName !== undefined || patch.newPassword !== undefined, {
    message: "Envía al menos un campo para actualizar",
  })
  .refine((patch) => patch.newPassword === undefined || patch.currentPassword !== undefined, {
    message: "Para cambiar la contraseña envía también currentPassword",
    path: ["currentPassword"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
