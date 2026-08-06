import { describe, expect, it } from "vitest";
import {
  QR_CONTENT_LIMITS,
  QR_OPTIONS_DEFAULTS,
  qrContentSchema,
  qrOptionsSchema,
} from "../src/index.js";

const parse = (value: unknown) => qrContentSchema.safeParse(value);

describe("qrContentSchema", () => {
  it("discrimina por type", () => {
    expect(parse({ type: "text", text: "hola" }).success).toBe(true);
    expect(parse({ type: "url", url: "https://example.com" }).success).toBe(true);
    expect(parse({ type: "desconocido" }).success).toBe(false);
  });

  it("text normaliza NFC y recorta", () => {
    const result = parse({ type: "text", text: "  e\u0301xito  " }); // e + acento agudo → é
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "text") {
      expect(result.data.text).toBe("éxito");
    }
  });

  it("text rechaza vacío y exceso del límite", () => {
    expect(parse({ type: "text", text: "   " }).success).toBe(false);
    expect(
      parse({ type: "text", text: "a".repeat(QR_CONTENT_LIMITS.textMaxLength + 1) }).success,
    ).toBe(false);
  });

  it("url acepta solo http/https y sin credenciales", () => {
    expect(parse({ type: "url", url: "http://example.com" }).success).toBe(true);
    expect(parse({ type: "url", url: "https://user:pass@example.com" }).success).toBe(false);
    expect(parse({ type: "url", url: "javascript:alert(1)" }).success).toBe(false);
    expect(parse({ type: "url", url: "data:text/html,x" }).success).toBe(false);
    expect(parse({ type: "url", url: "ftp://example.com" }).success).toBe(false);
    expect(parse({ type: "url", url: "no-es-url" }).success).toBe(false);
  });

  it("email valida formato", () => {
    expect(parse({ type: "email", email: "hola@acore.dev" }).success).toBe(true);
    expect(parse({ type: "email", email: "no-es-correo" }).success).toBe(false);
  });

  it("vcard rechaza esquemas peligrosos en su url", () => {
    const base = { type: "vcard", name: "Ana" };
    expect(parse({ ...base, url: "https://acore.dev" }).success).toBe(true);
    expect(parse({ ...base, url: "javascript:alert(1)" }).success).toBe(false);
    expect(parse({ ...base, url: "data:text/html,x" }).success).toBe(false);
  });

  it("phone admite dígitos, espacios y +", () => {
    expect(parse({ type: "phone", phone: "+34 600 123 456" }).success).toBe(true);
    expect(parse({ type: "phone", phone: "abc" }).success).toBe(false);
  });

  it("wifi exige password para WPA y lo prohíbe en nopass", () => {
    expect(parse({ type: "wifi", ssid: "MiRed", networkType: "WPA" }).success).toBe(false);
    expect(
      parse({ type: "wifi", ssid: "MiRed", password: "clave", networkType: "WPA" }).success,
    ).toBe(true);
    expect(
      parse({ type: "wifi", ssid: "Libre", password: "clave", networkType: "nopass" }).success,
    ).toBe(false);
    expect(parse({ type: "wifi", ssid: "Libre", networkType: "nopass" }).success).toBe(true);
  });

  it("calendar exige end posterior a start", () => {
    const base = { summary: "Reunión", start: "2026-08-05T15:00:00Z" };
    expect(parse({ type: "calendar", ...base }).success).toBe(true);
    expect(parse({ type: "calendar", ...base, end: "2026-08-05T16:00:00Z" }).success).toBe(true);
    expect(parse({ type: "calendar", ...base, end: "2026-08-05T14:00:00Z" }).success).toBe(false);
    expect(parse({ type: "calendar", ...base, end: "2026-13-45T99:99:99Z" }).success).toBe(false);
  });

  it("geo limita latitud y longitud", () => {
    expect(parse({ type: "geo", lat: 10.9685, lng: -74.7813 }).success).toBe(true);
    expect(parse({ type: "geo", lat: 91, lng: 0 }).success).toBe(false);
    expect(parse({ type: "geo", lat: 0, lng: 181 }).success).toBe(false);
  });
});

describe("qrOptionsSchema", () => {
  it("aplica los valores por defecto", () => {
    const options = qrOptionsSchema.parse({});
    expect(options).toEqual({ ...QR_OPTIONS_DEFAULTS });
  });

  it("valida límites y colores", () => {
    expect(qrOptionsSchema.parse({ size: 512 }).size).toBe(512);
    expect(qrOptionsSchema.safeParse({ size: 10 }).success).toBe(false);
    expect(qrOptionsSchema.safeParse({ foreground: "rojo" }).success).toBe(false);
    expect(qrOptionsSchema.safeParse({ foreground: "#ABC" }).success).toBe(true);
    expect(qrOptionsSchema.safeParse({ format: "webp" }).success).toBe(false);
  });
});
