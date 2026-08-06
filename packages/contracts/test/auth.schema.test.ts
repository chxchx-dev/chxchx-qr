import { describe, expect, it } from "vitest";
import {
  AUTH_LIMITS,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../src/auth.schema.js";

describe("registerSchema", () => {
  it("acepta un registro válido sin displayName", () => {
    const result = registerSchema.safeParse({
      email: "  Usuario@Example.com  ",
      password: "clave-super-segura",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // El trim del email ocurre aquí; la normalización a minúsculas en el servicio.
      expect(result.data.email).toBe("Usuario@Example.com");
    }
  });

  it("acepta displayName opcional", () => {
    const result = registerSchema.safeParse({
      email: "usuario@example.com",
      password: "clave-super-segura",
      displayName: "Ana López",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza email inválido", () => {
    expect(registerSchema.safeParse({ email: "no-es-email", password: "clave1234" }).success).toBe(
      false,
    );
  });

  it("rechaza contraseña corta y larga", () => {
    const short = `x`.repeat(AUTH_LIMITS.passwordMinLength - 1);
    expect(registerSchema.safeParse({ email: "a@b.co", password: short }).success).toBe(false);
    const long = `x`.repeat(AUTH_LIMITS.passwordMaxLength + 1);
    expect(registerSchema.safeParse({ email: "a@b.co", password: long }).success).toBe(false);
  });

  it("rechaza displayName demasiado largo", () => {
    expect(
      registerSchema.safeParse({
        email: "a@b.co",
        password: "clave1234",
        displayName: `x`.repeat(AUTH_LIMITS.displayNameMaxLength + 1),
      }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("acepta credenciales válidas", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "clave1234" }).success).toBe(true);
  });
  it("rechaza email inválido", () => {
    expect(loginSchema.safeParse({ email: "x", password: "clave1234" }).success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("acepta solo displayName", () => {
    const result = updateProfileSchema.safeParse({ displayName: "Ana" });
    expect(result.success).toBe(true);
  });

  it("acepta cambio de contraseña con currentPassword", () => {
    const result = updateProfileSchema.safeParse({
      currentPassword: "clave-vieja",
      newPassword: "clave-nueva-segura",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza newPassword sin currentPassword", () => {
    const result = updateProfileSchema.safeParse({ newPassword: "clave-nueva" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "currentPassword")).toBe(true);
    }
  });

  it("rechaza un body vacío", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });
});
