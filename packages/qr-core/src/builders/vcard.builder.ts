import type { QrContent } from "../domain/qr-content.js";
import { cleanPhone, escapeVCard } from "./escaping.js";

/**
 * Payload canónico vCard 3.0 con saltos CRLF. FN obligatorio; se omiten líneas
 * vacías; `\ , ;` y saltos se escapan (04 §8).
 */
export function buildVCard(content: Extract<QrContent, { type: "vcard" }>): string {
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`N:${escapeVCard(content.lastname ?? "")};${escapeVCard(content.name)};;;`);
  const fullName = content.lastname ? `${content.name} ${content.lastname}` : content.name;
  lines.push(`FN:${escapeVCard(fullName)}`);
  if (content.org !== undefined && content.org !== "") {
    lines.push(`ORG:${escapeVCard(content.org)}`);
  }
  if (content.title !== undefined && content.title !== "") {
    lines.push(`TITLE:${escapeVCard(content.title)}`);
  }
  if (content.phone !== undefined && content.phone !== "") {
    lines.push(`TEL;TYPE=CELL:${cleanPhone(content.phone)}`);
  }
  if (content.email !== undefined && content.email !== "") {
    lines.push(`EMAIL:${content.email}`);
  }
  if (content.url !== undefined && content.url !== "") {
    lines.push(`URL:${content.url}`);
  }
  if (content.address !== undefined && content.address !== "") {
    lines.push(`ADR:;;${escapeVCard(content.address)};;;;`);
  }
  if (content.note !== undefined && content.note !== "") {
    lines.push(`NOTE:${escapeVCard(content.note)}`);
  }
  lines.push("END:VCARD");
  return lines.join("\r\n");
}
