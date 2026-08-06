import type { QrContent } from "../domain/qr-content.js";

/** Payload canónico mailto: usa URLSearchParams, nunca concatenación manual (04 §4). */
export function buildEmail(content: Extract<QrContent, { type: "email" }>): string {
  const params = new URLSearchParams();
  if (content.subject !== undefined && content.subject !== "") {
    params.set("subject", content.subject);
  }
  if (content.body !== undefined && content.body !== "") {
    params.set("body", content.body);
  }
  const query = params.toString();
  return query === "" ? `mailto:${content.email}` : `mailto:${content.email}?${query}`;
}
