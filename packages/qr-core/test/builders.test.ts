import { describe, expect, it } from "vitest";
import {
  buildCalendar,
  buildEmail,
  buildGeo,
  buildPhone,
  buildSms,
  buildText,
  buildUrl,
  buildVCard,
  buildWifi,
  cleanPhone,
} from "../src/index.js";

describe("builders", () => {
  it("text conserva el contenido y los saltos de línea", () => {
    expect(buildText({ type: "text", text: "Línea 1\nLínea 2" })).toBe("Línea 1\nLínea 2");
  });

  it("url produce una única forma canónica", () => {
    expect(buildUrl({ type: "url", url: "https://example.com" })).toBe("https://example.com/");
    expect(buildUrl({ type: "url", url: "https://example.com/path?a=1#f" })).toBe(
      "https://example.com/path?a=1#f",
    );
  });

  it("email usa URLSearchParams y omite vacíos", () => {
    expect(buildEmail({ type: "email", email: "hola@acore.dev" })).toBe("mailto:hola@acore.dev");
    expect(
      buildEmail({ type: "email", email: "hola@acore.dev", subject: "Asunto", body: "Cuerpo" }),
    ).toBe("mailto:hola@acore.dev?subject=Asunto&body=Cuerpo");
  });

  it("phone limpia separadores y conserva +", () => {
    expect(cleanPhone("+34 600-123 (456)")).toBe("+34600123456");
    expect(buildPhone({ type: "phone", phone: "+34 600 123 456" })).toBe("tel:+34600123456");
  });

  it("sms construye el payload con body opcional", () => {
    expect(buildSms({ type: "sms", phone: "+34600123456" })).toBe("sms:+34600123456");
    expect(buildSms({ type: "sms", phone: "+34 600 123 456", body: "Hola mundo" })).toBe(
      "sms:+34600123456?body=Hola+mundo",
    );
  });

  it('wifi escapa \\ ; , : " y omite P en nopass', () => {
    expect(
      buildWifi({
        type: "wifi",
        ssid: 'Mi;Red:Con\\Comas,"ok"',
        password: 'Clave;:,"\\',
        networkType: "WPA",
        hidden: true,
      }),
    ).toBe('WIFI:T:WPA;S:Mi\\;Red\\:Con\\\\Comas\\,\\"ok\\";P:Clave\\;\\:\\,\\"\\\\;H:true;;');
    expect(
      buildWifi({ type: "wifi", ssid: "CafeLibre", networkType: "nopass", hidden: false }),
    ).toBe("WIFI:T:nopass;S:CafeLibre;H:false;;");
  });

  it("vcard usa CRLF, escapa y omite líneas vacías", () => {
    const vcard = buildVCard({
      type: "vcard",
      name: "Ana",
      lastname: "García",
      org: "Acore",
      phone: "+34 600 123 456",
      email: "ana@acore.dev",
      address: "Calle 1, 2",
      note: "Nota con, coma",
    });
    expect(vcard).toContain("BEGIN:VCARD\r\nVERSION:3.0");
    expect(vcard).toContain("N:García;Ana;;;");
    expect(vcard).toContain("FN:Ana García");
    expect(vcard).toContain("TEL;TYPE=CELL:+34600123456");
    expect(vcard).toContain("ADR:;;Calle 1\\, 2;;;;");
    expect(vcard).toContain("NOTE:Nota con\\, coma");
    expect(vcard).toContain("\r\nEND:VCARD");
    expect(vcard).not.toContain("\n\n");
  });

  it("calendar convierte ISO UTC a formato iCalendar", () => {
    const ical = buildCalendar({
      type: "calendar",
      summary: "Reunión, equipo",
      start: "2026-08-05T15:00:00Z",
      end: "2026-08-05T16:00:00Z",
      location: "Sala 1",
    });
    expect(ical).toBe(
      "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//acore-qr//EN\r\nBEGIN:VEVENT\r\n" +
        "SUMMARY:Reunión\\, equipo\r\nDTSTART:20260805T150000Z\r\nDTEND:20260805T160000Z\r\n" +
        "LOCATION:Sala 1\r\nEND:VEVENT\r\nEND:VCALENDAR",
    );
  });

  it("geo limita precisión y añade etiqueta codificada", () => {
    expect(buildGeo({ type: "geo", lat: 10.96845, lng: -74.78134 })).toBe(
      "geo:10.968450,-74.781340",
    );
    expect(buildGeo({ type: "geo", lat: 40.4168, lng: -3.7038, label: "Puerta del Sol" })).toBe(
      "geo:40.416800,-3.703800?q=Puerta%20del%20Sol",
    );
  });
});
