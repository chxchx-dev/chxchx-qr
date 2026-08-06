import type { QrContent } from "../domain/qr-content.js";
import { cleanPhone } from "./escaping.js";

/** Payload canónico sms:+...?body=... (la compatibilidad varía por dispositivo). */
export function buildSms(content: Extract<QrContent, { type: "sms" }>): string {
  const phone = cleanPhone(content.phone);
  if (content.body === undefined || content.body === "") {
    return `sms:${phone}`;
  }
  const params = new URLSearchParams({ body: content.body });
  return `sms:${phone}?${params.toString()}`;
}
