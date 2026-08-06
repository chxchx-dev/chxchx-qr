import { describe, expect, it } from "vitest";
import {
  abuseReportResponseSchema,
  abuseReportSchema,
  adminActionSchema,
} from "../src/admin.schema.js";

describe("abuseReportSchema (público)", () => {
  it("acepta un reporte válido con motivo de al menos 10 caracteres", () => {
    const parsed = abuseReportSchema.safeParse({
      slug: "aB9kP2XqLz",
      reason: "El enlace apunta a contenido engañoso",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza motivo corto, slug corto y motivo demasiado largo", () => {
    expect(abuseReportSchema.safeParse({ slug: "aB9kP2XqLz", reason: "corto" }).success).toBe(
      false,
    );
    expect(abuseReportSchema.safeParse({ slug: "abc", reason: "motivo válido aquí" }).success).toBe(
      false,
    );
    expect(
      abuseReportSchema.safeParse({ slug: "aB9kP2XqLz", reason: "x".repeat(501) }).success,
    ).toBe(false);
  });
});

describe("adminActionSchema (moderación)", () => {
  it("requiere un motivo no vacío", () => {
    expect(adminActionSchema.safeParse({ reason: "Phishing detectado" }).success).toBe(true);
    expect(adminActionSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(adminActionSchema.safeParse({ reason: "   " }).success).toBe(false);
  });
});

describe("abuseReportResponseSchema", () => {
  it("valida la respuesta de un reporte creado", () => {
    const parsed = abuseReportResponseSchema.safeParse({
      id: "rep_123",
      qrId: "dqr_456",
      slug: "aB9kP2XqLz",
      reason: "Enlace a phishing",
      status: "open",
      createdAt: "2026-08-06T12:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
  });

  it("acepta qrId null (slug sin QR asignable) y rechaza estados desconocidos", () => {
    expect(
      abuseReportResponseSchema.safeParse({
        id: "rep_1",
        qrId: null,
        slug: "aB9kP2XqLz",
        reason: "Spam detectado en el destino",
        status: "open",
        createdAt: "2026-08-06T12:00:00.000Z",
      }).success,
    ).toBe(true);
    expect(
      abuseReportResponseSchema.safeParse({
        id: "rep_1",
        qrId: null,
        slug: "aB9kP2XqLz",
        reason: "Spam detectado en el destino",
        status: "weird",
        createdAt: "2026-08-06T12:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});
