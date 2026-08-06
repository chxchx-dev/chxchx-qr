import { describe, expect, it } from "vitest";
import {
  createDynamicQrSchema,
  dynamicQrResponseSchema,
  listDynamicQrsQuerySchema,
  patchDynamicQrSchema,
} from "../src/index.js";

describe("createDynamicQrSchema", () => {
  it("acepta un body válido", () => {
    const result = createDynamicQrSchema.safeParse({
      name: "Menú principal",
      destinationUrl: "https://restaurant.example/menu",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // Ausente: el servicio lo normaliza a null (sin expiración).
      expect(result.data.expiresAt).toBeUndefined();
    }
  });

  it("acepta expiresAt nulo y active false", () => {
    const result = createDynamicQrSchema.safeParse({
      name: "Promo",
      destinationUrl: "https://example.com/promo",
      active: false,
      expiresAt: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(false);
      expect(result.data.expiresAt).toBeNull();
    }
  });

  it("rechaza esquemas peligrosos en el destino (javascript:, credenciales, sin dominio)", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,<script>",
      "ftp://example.com/x",
      "https://user:pass@example.com",
      "not-a-url",
      "https://",
    ]) {
      const result = createDynamicQrSchema.safeParse({ name: "x", destinationUrl: url });
      expect(result.success).toBe(false);
    }
  });

  it("rechaza nombre vacío o demasiado largo", () => {
    expect(
      createDynamicQrSchema.safeParse({ name: "  ", destinationUrl: "https://a.dev" }).success,
    ).toBe(false);
    expect(
      createDynamicQrSchema.safeParse({
        name: "x".repeat(121),
        destinationUrl: "https://a.dev",
      }).success,
    ).toBe(false);
  });

  it("rechaza expiresAt malformado", () => {
    expect(
      createDynamicQrSchema.safeParse({
        name: "x",
        destinationUrl: "https://a.dev",
        expiresAt: "mañana",
      }).success,
    ).toBe(false);
  });
});

describe("patchDynamicQrSchema", () => {
  it("exige al menos un campo", () => {
    expect(patchDynamicQrSchema.safeParse({}).success).toBe(false);
  });

  it("permite null en expiresAt para quitar la expiración", () => {
    const result = patchDynamicQrSchema.safeParse({ expiresAt: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expiresAt).toBeNull();
    }
  });

  it("acepta actualizar destino y estado por separado", () => {
    expect(
      patchDynamicQrSchema.safeParse({ destinationUrl: "https://other.example" }).success,
    ).toBe(true);
    expect(patchDynamicQrSchema.safeParse({ active: false }).success).toBe(true);
  });
});

describe("dynamicQrResponseSchema", () => {
  it("valida la forma de la respuesta", () => {
    const result = dynamicQrResponseSchema.safeParse({
      id: "dqr_01",
      slug: "aB9kP2xQ7z",
      shortUrl: "https://q.example.com/r/aB9kP2xQ7z",
      name: "Menú",
      destinationUrl: "https://restaurant.example/menu",
      status: "active",
      version: 3,
      expiresAt: null,
      createdAt: "2026-08-05T16:00:00.000Z",
      updatedAt: "2026-08-05T16:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("listDynamicQrsQuerySchema", () => {
  it("parsea query params como strings y aplica defaults", () => {
    const result = listDynamicQrsQuerySchema.safeParse({
      page: "3",
      pageSize: "50",
      search: "menu",
      status: "active",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.pageSize).toBe(50);
      expect(result.data.status).toBe("active");
    }
  });

  it("rechaza pageSize fuera de rango o status inválido", () => {
    expect(listDynamicQrsQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
    expect(listDynamicQrsQuerySchema.safeParse({ status: "cualquiera" }).success).toBe(false);
  });
});
