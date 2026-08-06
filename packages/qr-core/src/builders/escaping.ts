/** Escapado por formato. No concatenar manualmente payloads con estos valores. */

/** WiFi: escapa \ ; , : "  (04-DOMAIN-CONTENT-TYPES §7). */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** vCard: escapa \ , ; y saltos de línea (04-DOMAIN-CONTENT-TYPES §8). */
export function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** iCalendar: escapa \ , ; y saltos de línea (04-DOMAIN-CONTENT-TYPES §9). */
export function escapeICal(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Limpia un teléfono: quita espacios, guiones y paréntesis; conserva el + (04 §5). */
export function cleanPhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, "");
}
