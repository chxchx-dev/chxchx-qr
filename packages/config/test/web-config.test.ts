import { webConfig } from "@chxchx/config";
import { describe, expect, it } from "vitest";

describe("webConfig", () => {
  it("aplica valores por defecto", () => {
    const config = webConfig({});
    expect(config.VITE_API_BASE_URL).toBe("/api/v1");
    expect(config.VITE_APP_NAME).toBe("chxchx-qr");
  });

  it("acepta una URL relativa servida por el proxy local", () => {
    expect(webConfig({ VITE_API_BASE_URL: "/api/v1" }).VITE_API_BASE_URL).toBe("/api/v1");
  });

  it("acepta una URL absoluta para despliegues en otro origen", () => {
    expect(
      webConfig({ VITE_API_BASE_URL: "https://api.example.com/api/v1" }).VITE_API_BASE_URL,
    ).toBe("https://api.example.com/api/v1");
  });

  it("falla temprano con VITE_API_BASE_URL inválida", () => {
    expect(() => webConfig({ VITE_API_BASE_URL: "sin-protocolo" })).toThrow(
      /Configuración web inválida/,
    );
  });
});
