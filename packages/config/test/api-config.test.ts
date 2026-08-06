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
    // Fase 06: defaults seguros (deshabilitado, sin token requerido).
    expect(config.DYNAMIC_QR_ENABLED).toBe(false);
    expect(config.DATABASE_URL).toBeUndefined();
    expect(config.DYNAMIC_SLUG_LENGTH).toBe(10);
    expect(config.SHORT_DOMAIN).toBe("http://localhost:4000");
    expect(config.REDIRECT_CACHE_TTL_SECONDS).toBe(30);
    // Fase 07: sesiones opacas y scrypt con defaults.
    expect(config.SESSION_COOKIE_NAME).toBe("qr_session");
    expect(config.SESSION_TTL_HOURS).toBe(168);
    expect(config.SESSION_SECRET_CURRENT).toBeUndefined();
    expect(config.PASSWORD_SCRYPT_N).toBe(16384);
    expect(config.PASSWORD_SCRYPT_R).toBe(8);
    expect(config.PASSWORD_SCRYPT_P).toBe(1);
    expect(config.RATE_LIMIT_LOGIN_PER_15_MINUTES).toBe(10);
    // Fase 08: analítica deshabilitada por defecto; retención y agregación con defaults.
    expect(config.ANALYTICS_ENABLED).toBe(false);
    expect(config.ANALYTICS_HMAC_SECRET_CURRENT).toBeUndefined();
    expect(config.ANALYTICS_RAW_RETENTION_DAYS).toBe(90);
    expect(config.ANALYTICS_AGGREGATION_INTERVAL_MINUTES).toBe(10);
    expect(config.RATE_LIMIT_ABUSE_REPORT_PER_HOUR).toBe(10);
  });

  it("DYNAMIC_QR_ENABLED=true exige DATABASE_URL y SESSION_SECRET_CURRENT", () => {
    expect(() => apiConfig({ DYNAMIC_QR_ENABLED: "true" })).toThrow(/DATABASE_URL/);
    expect(() =>
      apiConfig({ DYNAMIC_QR_ENABLED: "true", DATABASE_URL: "postgres://localhost/x" }),
    ).toThrow(/SESSION_SECRET_CURRENT/);
    const ok = apiConfig({
      DYNAMIC_QR_ENABLED: "true",
      DATABASE_URL: "postgres://localhost/acore_qr",
      SESSION_SECRET_CURRENT: "secreto-de-sesion-largo-y-aleatorio-123456",
    });
    expect(ok.DYNAMIC_QR_ENABLED).toBe(true);
    expect(ok.DATABASE_URL).toBe("postgres://localhost/acore_qr");
    expect(ok.SESSION_SECRET_CURRENT).toBe("secreto-de-sesion-largo-y-aleatorio-123456");
    expect(ok.SESSION_SECRET_PREVIOUS).toBeUndefined();
  });

  it("rechaza DYNAMIC_SLUG_LENGTH fuera de rango y secretos cortos", () => {
    expect(() => apiConfig({ DYNAMIC_SLUG_LENGTH: "4" })).toThrow(/Configuración de API inválida/);
    expect(() => apiConfig({ SESSION_SECRET_CURRENT: "corto" })).toThrow(
      /Configuración de API inválida/,
    );
    expect(() => apiConfig({ PASSWORD_SCRYPT_N: "10000" })).toThrow(
      /Configuración de API inválida/,
    );
  });

  it("ANALYTICS_ENABLED=true exige ANALYTICS_HMAC_SECRET_CURRENT", () => {
    expect(() => apiConfig({ ANALYTICS_ENABLED: "true" })).toThrow(/ANALYTICS_HMAC_SECRET_CURRENT/);
    expect(() => apiConfig({ ANALYTICS_HMAC_SECRET_CURRENT: "corto" })).toThrow(
      /Configuración de API inválida/,
    );
    const ok = apiConfig({
      ANALYTICS_ENABLED: "true",
      ANALYTICS_HMAC_SECRET_CURRENT: "hmac-secreto-largo-0123456789abcdef0123456789",
    });
    expect(ok.ANALYTICS_ENABLED).toBe(true);
    expect(ok.ANALYTICS_HMAC_SECRET_CURRENT).toBe("hmac-secreto-largo-0123456789abcdef0123456789");
  });

  it("rechaza retención de analítica fuera de rango", () => {
    expect(() => apiConfig({ ANALYTICS_RAW_RETENTION_DAYS: "0" })).toThrow(
      /Configuración de API inválida/,
    );
    expect(() => apiConfig({ ANALYTICS_RAW_RETENTION_DAYS: "400" })).toThrow(
      /Configuración de API inválida/,
    );
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
