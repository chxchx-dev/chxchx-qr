import type { QrContent } from "../domain/qr-content.js";
import { escapeICal } from "./escaping.js";

/** Convierte ISO 8601 UTC a formato iCalendar: 2026-08-05T15:00:00Z → 20260805T150000Z. */
function toICalDateTime(iso: string): string {
  return iso.replace(/[-:]/g, "");
}

/**
 * Payload canónico iCalendar con envoltura VCALENDAR (necesaria en varios
 * lectores, 04 §9). DTEND posterior a DTSTART ya validado por el contrato.
 */
export function buildCalendar(content: Extract<QrContent, { type: "calendar" }>): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//chxchx-qr//EN",
    "BEGIN:VEVENT",
    `SUMMARY:${escapeICal(content.summary)}`,
    `DTSTART:${toICalDateTime(content.start)}`,
  ];
  if (content.end !== undefined) {
    lines.push(`DTEND:${toICalDateTime(content.end)}`);
  }
  if (content.location !== undefined && content.location !== "") {
    lines.push(`LOCATION:${escapeICal(content.location)}`);
  }
  if (content.description !== undefined && content.description !== "") {
    lines.push(`DESCRIPTION:${escapeICal(content.description)}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
