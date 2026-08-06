import type { QrContent } from "../domain/qr-content.js";

/** Payload canónico del texto: conserva saltos de línea, ya normalizado a NFC. */
export function buildText(content: Extract<QrContent, { type: "text" }>): string {
  return content.text;
}
