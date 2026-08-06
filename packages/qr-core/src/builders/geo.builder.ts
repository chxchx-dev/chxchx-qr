import type { QrContent } from "../domain/qr-content.js";

/** Precisión máxima de coordenadas (~0.1 m); 04 §10 "precisión limitada". */
const COORD_PRECISION = 6;

/** Payload canónico geo:lat,lng opcionalmente ?q=etiqueta. */
export function buildGeo(content: Extract<QrContent, { type: "geo" }>): string {
  const coords = `${content.lat.toFixed(COORD_PRECISION)},${content.lng.toFixed(COORD_PRECISION)}`;
  if (content.label === undefined || content.label === "") {
    return `geo:${coords}`;
  }
  return `geo:${coords}?q=${encodeURIComponent(content.label)}`;
}
