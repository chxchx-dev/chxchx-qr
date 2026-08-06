import { apiConfig } from "@acore/config";
import { describe, expect, it } from "vitest";

describe("apiConfig", () => {
  it("aplica valores por defecto con entorno vacío", () => {
    const config = apiConfig({});
    expect(config.NODE_ENV).toBe("development");
    expect(config.PORT).toBe(4000);
    expect(config.REQUEST_BODY_LIMIT).toBe("2mb");
    expect(config.QR_DEFAULT_ECC).toBe("medium");
    expect(config.QR_DEFAULT_SIZE).toBe(1024);
    expect(config.QR_DEFAULT_MARGIN).toBe(4);
    expect(config.QR_MAX_TEXT_LENGTH).toBe(500);
    expect(config.QR_ENABLE_SERVER_PNG).toBe(true);
    expect(config.QR_ENABLE_LOGO).toBe(true);
    expect(config.LOGO_MAX_BYTES).toBe(2 * 1024 * 1024);
    expect(config.LOGO_MAX_DIMENSION).toBe(1024);
    expect(config.RATE_LIMIT_VALIDATE_PER_MINUTE).toBe(120);
    expect(config.RATE_LIMIT_RENDER_PER_MINUTE).toBe(60);
    expect(config.RATE_LIMIT_PNG_PER_MINUTE).toBe(20);
    expect(config.RATE_LIMIT_UPLOAD_PER_HOUR).toBe(20);
    expect(config.TRUST_PROXY).toBe(false);
  });

  it("rechaza LOGO_MAX_DIMENSION fuera de rango", () => {
    expect(() => apiConfig({ LOGO_MAX_DIMENSION: "5000" })).toThrow(
      /Configuración de API inválida/,
    );
  });

  it("parsea un entorno válido y convierte booleanos e enteros", () => {
    const config = apiConfig({
      NODE_ENV: "production",
      PORT: "8080",
      TRUST_PROXY: "true",
      QR_MAX_TEXT_LENGTH: "300",
      QR_ENABLE_SERVER_PNG: "false",
    });
    expect(config.NODE_ENV).toBe("production");
    expect(config.PORT).toBe(8080);
    expect(config.TRUST_PROXY).toBe(true);
    expect(config.QR_MAX_TEXT_LENGTH).toBe(300);
    expect(config.QR_ENABLE_SERVER_PNG).toBe(false);
  });

  it("falla temprano con NODE_ENV inválido", () => {
    expect(() => apiConfig({ NODE_ENV: "nope" })).toThrow(/Configuración de API inválida/);
  });

  it("falla temprano con PORT fuera de rango", () => {
    expect(() => apiConfig({ PORT: "70000" })).toThrow(/Configuración de API inválida/);
  });

  it("falla temprano con boolean inválido", () => {
    expect(() => apiConfig({ TRUST_PROXY: "yes" })).toThrow(/Configuración de API inválida/);
  });

  it("falla temprano con PUBLIC_API_URL no válida", () => {
    expect(() => apiConfig({ PUBLIC_API_URL: "no-es-una-url" })).toThrow(
      /Configuración de API inválida/,
    );
  });
});
