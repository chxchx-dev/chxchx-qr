import type { QrContent } from "../domain/qr-content.js";
import { escapeWifi } from "./escaping.js";

/**
 * Payload canónico WiFi: WIFI:T:{type};S:{ssid};P:{pass};H:{hidden};;
 * nopass no incluye el campo P. SSID y contraseña se escapan (04 §7).
 */
export function buildWifi(content: Extract<QrContent, { type: "wifi" }>): string {
  const password = content.password;
  const parts = [`T:${content.networkType}`, `S:${escapeWifi(content.ssid)}`];
  if (content.networkType !== "nopass" && password !== undefined && password !== "") {
    parts.push(`P:${escapeWifi(password)}`);
  }
  parts.push(`H:${content.hidden ? "true" : "false"}`);
  return `WIFI:${parts.join(";")};;`;
}
