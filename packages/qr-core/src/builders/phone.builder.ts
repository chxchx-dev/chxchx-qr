import type { QrContent } from "../domain/qr-content.js";
import { cleanPhone } from "./escaping.js";

/** Payload canónico tel:+... (limpia separadores, conserva +). */
export function buildPhone(content: Extract<QrContent, { type: "phone" }>): string {
  return `tel:${cleanPhone(content.phone)}`;
}
