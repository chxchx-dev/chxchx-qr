import { describe, expect, it } from "vitest";
import { buildContentDto, hasAnyInput, toUtcIso } from "../src/features/generator/lib/build-dto";

describe("buildContentDto", () => {
  it("text: string simple", () => {
    expect(buildContentDto("text", { text: "hola" })).toEqual({ type: "text", text: "hola" });
  });

  it("url: pasa la URL tal cual", () => {
    expect(buildContentDto("url", { url: "https://example.com" })).toEqual({
      type: "url",
      url: "https://example.com",
    });
  });

  it("email: opcionales undefined cuando están vacíos", () => {
    expect(buildContentDto("email", { email: "a@b.dev", subject: "", body: "" })).toEqual({
      type: "email",
      email: "a@b.dev",
      subject: undefined,
      body: undefined,
    });
  });

  it("phone: string simple", () => {
    expect(buildContentDto("phone", { phone: "+34600123456" })).toEqual({
      type: "phone",
      phone: "+34600123456",
    });
  });

  it("sms: body opcional", () => {
    expect(buildContentDto("sms", { phone: "600123456", body: "Hola" })).toEqual({
      type: "sms",
      phone: "600123456",
      body: "Hola",
    });
    expect(buildContentDto("sms", { phone: "600123456", body: "" })).toEqual({
      type: "sms",
      phone: "600123456",
      body: undefined,
    });
  });

  it("wifi: defaults a WPA y hidden false", () => {
    expect(buildContentDto("wifi", { ssid: "MiRed", networkType: "" })).toEqual({
      type: "wifi",
      ssid: "MiRed",
      password: undefined,
      networkType: "WPA",
      hidden: false,
    });
    expect(
      buildContentDto("wifi", { ssid: "R", password: "p", networkType: "WPA2", hidden: true }),
    ).toEqual({
      type: "wifi",
      ssid: "R",
      password: "p",
      networkType: "WPA2",
      hidden: true,
    });
  });

  it("vcard: todos los campos opcionales", () => {
    expect(
      buildContentDto("vcard", {
        name: "Ana",
        lastname: "Pérez",
        org: "Acme",
        title: "CEO",
        phone: "+34",
        email: "a@b.dev",
        url: "https://acme.dev",
        address: "Calle 1",
        note: "Hola",
      }),
    ).toEqual({
      type: "vcard",
      name: "Ana",
      lastname: "Pérez",
      org: "Acme",
      title: "CEO",
      phone: "+34",
      email: "a@b.dev",
      url: "https://acme.dev",
      address: "Calle 1",
      note: "Hola",
    });
  });

  it("calendar: convierte datetime-local a ISO UTC y opcionales undefined", () => {
    const dto = buildContentDto("calendar", {
      summary: "Reunión",
      start: "2026-08-05T10:00",
      end: "",
      location: "",
      description: "Agenda",
    }) as { type: string; start: string; end: string | undefined; location: string | undefined };
    expect(dto.type).toBe("calendar");
    expect(dto.start).toBe(new Date("2026-08-05T10:00").toISOString().replace(/\.\d{3}Z$/, "Z"));
    expect(dto.end).toBeUndefined();
    expect(dto.location).toBeUndefined();
  });

  it("geo: convierte números a finitos y label opcional", () => {
    expect(buildContentDto("geo", { lat: "40.4168", lng: "-3.7038", label: "Madrid" })).toEqual({
      type: "geo",
      lat: 40.4168,
      lng: -3.7038,
      label: "Madrid",
    });
    // Números no finitos o vacíos → undefined
    expect(buildContentDto("geo", { lat: "", lng: "abc", label: "" })).toEqual({
      type: "geo",
      lat: undefined,
      lng: undefined,
      label: undefined,
    });
    expect(buildContentDto("geo", { lat: true, lng: false })).toEqual({
      type: "geo",
      lat: undefined,
      lng: undefined,
      label: undefined,
    });
  });
});

describe("toUtcIso", () => {
  it("convierte hora local a ISO UTC", () => {
    expect(toUtcIso("2026-08-05T10:00")).toBe(
      new Date("2026-08-05T10:00").toISOString().replace(/\.\d{3}Z$/, "Z"),
    );
  });

  it("devuelve undefined para vacío o inválido", () => {
    expect(toUtcIso("")).toBeUndefined();
    expect(toUtcIso(undefined)).toBeUndefined();
    expect(toUtcIso("no-es-fecha")).toBeUndefined();
  });
});

describe("hasAnyInput", () => {
  it("detecta strings no vacíos y booleanos", () => {
    expect(hasAnyInput({ text: "hola" })).toBe(true);
    expect(hasAnyInput({ hidden: true })).toBe(true);
    expect(hasAnyInput({})).toBe(false);
    expect(hasAnyInput({ text: "", hidden: false })).toBe(false);
  });
});
