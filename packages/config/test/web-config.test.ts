import { webConfig } from "@acore/config";
import { describe, expect, it } from "vitest";

describe("webConfig", () => {
  it("aplica valores por defecto con entorno vacío", () => {
    const config = webConfig({});
    expect(config.VITE_API_BASE_URL).toBe("http://localhost:4000/api/v1");
    expect(config.VITE_APP_NAME).toBe("acore-qr");
    expect(config.VITE_FILE_UPLOAD_ENABLED).toBe(true);
    expect(config.VITE_DYNAMIC_QR_ENABLED).toBe(false);
  });

  it("parsea un entorno válido", () => {
    const config = webConfig({
      VITE_APP_NAME: "acore-qr",
      VITE_FILE_UPLOAD_ENABLED: "true",
    });
    expect(config.VITE_FILE_UPLOAD_ENABLED).toBe(true);
  });

  it("permite deshabilitar la subida de archivos en producción", () => {
    const config = webConfig({ VITE_FILE_UPLOAD_ENABLED: "false" });
    expect(config.VITE_FILE_UPLOAD_ENABLED).toBe(false);
  });

  it("falla temprano con VITE_API_BASE_URL inválida", () => {
    expect(() => webConfig({ VITE_API_BASE_URL: "sin-protocolo" })).toThrow(
      /Configuración web inválida/,
    );
  });

  it("falla temprano con boolean inválido", () => {
    expect(() => webConfig({ VITE_DYNAMIC_QR_ENABLED: "quizás" })).toThrow(
      /Configuración web inválida/,
    );
  });
});
