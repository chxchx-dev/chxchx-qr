import { apiConfig } from "@chxchx/config";
import { describe, expect, it } from "vitest";

describe("apiConfig", () => {
  it("aplica valores por defecto para el generador estático", () => {
    const config = apiConfig({});
    expect(config.NODE_ENV).toBe("development");
    expect(config.PORT).toBe(4000);
    expect(config.WEB_ORIGIN).toBe("http://localhost:5173");
    expect(config.REQUEST_BODY_LIMIT).toBe("32kb");
    expect(config.RATE_LIMIT_VALIDATE_PER_MINUTE).toBe(120);
    expect(config.RATE_LIMIT_RENDER_PER_MINUTE).toBe(60);
    expect(config.RATE_LIMIT_PNG_PER_MINUTE).toBe(20);
    expect(config.TRUST_PROXY).toBe(false);
  });

  it("parsea entorno válido y convierte booleanos e enteros", () => {
    const config = apiConfig({ NODE_ENV: "production", PORT: "8080", TRUST_PROXY: "true" });
    expect(config.NODE_ENV).toBe("production");
    expect(config.PORT).toBe(8080);
    expect(config.TRUST_PROXY).toBe(true);
  });

  it("falla temprano con NODE_ENV, puerto o booleano inválidos", () => {
    expect(() => apiConfig({ NODE_ENV: "nope" })).toThrow(/Configuración de API inválida/);
    expect(() => apiConfig({ PORT: "70000" })).toThrow(/Configuración de API inválida/);
    expect(() => apiConfig({ TRUST_PROXY: "yes" })).toThrow(/Configuración de API inválida/);
  });
});
