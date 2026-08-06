import type { QrContent } from "../domain/qr-content.js";

/**
 * Payload canónico de la URL: se re-serializa con `URL` nativa (una sola forma
 * canónica, p. ej. https://example.com → https://example.com/). El esquema y las
 * credenciales ya fueron validados por el contrato.
 */
export function buildUrl(content: Extract<QrContent, { type: "url" }>): string {
  return new URL(content.url).toString();
}
