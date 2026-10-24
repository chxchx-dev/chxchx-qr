/** Construye el DTO de contenido (contrato) desde el draft del formulario. */
import type { ContentDraft, QrContentType } from "../generator.types";

function str(value: string | boolean | undefined): string {
  return typeof value === "string" ? value : "";
}

function optStr(value: string | boolean | undefined): string | undefined {
  const s = str(value);
  return s === "" ? undefined : s;
}

function toFiniteNumber(value: string | boolean | undefined): number | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

/** Convierte un valor datetime-local a ISO 8601 UTC (el usuario indica hora local). */
export function toUtcIso(localValue: string | boolean | undefined): string | undefined {
  const value = str(localValue);
  if (value === "") {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Ensambla el objeto que valida `qrContentSchema`. */
export function buildContentDto(type: QrContentType, draft: ContentDraft): unknown {
  switch (type) {
    case "text":
      return { type, text: str(draft.text) };
    case "url":
      return { type, url: str(draft.url) };
    case "email":
      return {
        type,
        email: str(draft.email),
        subject: optStr(draft.subject),
        body: optStr(draft.body),
      };
    case "phone":
      return { type, phone: str(draft.phone) };
    case "sms":
      return { type, phone: str(draft.phone), body: optStr(draft.body) };
    case "wifi":
      return {
        type,
        ssid: str(draft.ssid),
        password: optStr(draft.password),
        networkType: str(draft.networkType) === "" ? "WPA" : str(draft.networkType),
        hidden: draft.hidden === true,
      };
    case "vcard":
      return {
        type,
        name: str(draft.name),
        lastname: optStr(draft.lastname),
        org: optStr(draft.org),
        title: optStr(draft.title),
        phone: optStr(draft.phone),
        email: optStr(draft.email),
        url: optStr(draft.url),
        address: optStr(draft.address),
        note: optStr(draft.note),
      };
    case "calendar":
      return {
        type,
        summary: str(draft.summary),
        start: toUtcIso(draft.start),
        end: toUtcIso(draft.end),
        location: optStr(draft.location),
        description: optStr(draft.description),
      };
    case "geo":
      return {
        type,
        lat: toFiniteNumber(draft.lat),
        lng: toFiniteNumber(draft.lng),
        label: optStr(draft.label),
      };
    default: {
      const unsupported: never = type;
      return unsupported;
    }
  }
}

/** ¿Hay algún dato introducido? (para el estado inicial vs inválido). */
export function hasAnyInput(draft: ContentDraft): boolean {
  return Object.values(draft).some(
    (value) => value === true || (typeof value === "string" && value.trim() !== ""),
  );
}
