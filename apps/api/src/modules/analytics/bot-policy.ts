/**
 * Clasificación de user-agent (Fase 08): separa bots (familia 'bot', sin hash
 * de visitante) y estima la familia de dispositivo. Heurística simple y
 * documentada como tal: no es detección de fraude, solo etiquetado de eventos.
 */
const BOT_PATTERN =
  /bot|crawler|crawl|spider|slurp|curl|wget|python-?requests|node-fetch|headless|phantomjs|facebookexternalhit|whatsapp|telegram|preview|scan|httpclient|okhttp/i;

export interface DeviceInfo {
  isBot: boolean;
  deviceFamily: string;
}

export function classifyUserAgent(userAgent: string | undefined): DeviceInfo {
  const ua = userAgent ?? "";
  if (ua === "") {
    return { isBot: false, deviceFamily: "unknown" };
  }
  if (BOT_PATTERN.test(ua)) {
    return { isBot: true, deviceFamily: "bot" };
  }
  if (/iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua)) {
    return { isBot: false, deviceFamily: "tablet" };
  }
  if (/Mobi|iPhone|iPod|Android|BlackBerry|Windows Phone/i.test(ua)) {
    return { isBot: false, deviceFamily: "mobile" };
  }
  return { isBot: false, deviceFamily: "desktop" };
}
