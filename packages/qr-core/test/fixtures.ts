/** Vectores estables de contenido para pruebas (09-TESTING-QUALITY §3). */
import type { QrContent } from "@acore/contracts";

export interface RoundTripFixture {
  name: string;
  content: QrContent;
}

export const roundTripFixtures: RoundTripFixture[] = [
  { name: "ascii", content: { type: "text", text: "Hello world" } },
  { name: "acentos", content: { type: "text", text: "áéíóú ñ ü ¿Qué tal?" } },
  { name: "emoji", content: { type: "text", text: "Hola 😀 café 🚀" } },
  { name: "multilinea", content: { type: "text", text: "Línea 1\nLínea 2\nLínea 3" } },
  { name: "url-con-query", content: { type: "url", url: "https://example.com/path?a=1&b=2#frag" } },
  { name: "url-larga", content: { type: "url", url: `https://example.com/${"x".repeat(400)}` } },
  {
    name: "email-con-asunto",
    content: {
      type: "email",
      email: "hola@acore.dev",
      subject: "Asunto de prueba",
      body: "Cuerpo del mensaje",
    },
  },
  { name: "phone", content: { type: "phone", phone: "+34 600 123 456" } },
  { name: "sms", content: { type: "sms", phone: "+34600123456", body: "Cita mañana a las 10" } },
  {
    name: "wifi-caracteres-especiales",
    content: {
      type: "wifi",
      ssid: 'Mi;Red:Con\\Comas,"ok"',
      password: 'Clave;:,"\\',
      networkType: "WPA",
      hidden: true,
    },
  },
  {
    name: "wifi-nopass",
    content: { type: "wifi", ssid: "CafeLibre", networkType: "nopass", hidden: false },
  },
  {
    name: "vcard-completa",
    content: {
      type: "vcard",
      name: "Ana",
      lastname: "García",
      org: "Acore",
      title: "Desarrolladora",
      phone: "+34 600 123 456",
      email: "ana@acore.dev",
      url: "https://acore.dev",
      address: "Calle 1, 2; Ciudad",
      note: "Nota con, coma y; punto",
    },
  },
  {
    name: "calendar-utc",
    content: {
      type: "calendar",
      summary: "Reunión de planificación",
      start: "2026-08-05T15:00:00Z",
      end: "2026-08-05T16:00:00Z",
      location: "Sala 1",
      description: "Repasar el roadmap",
    },
  },
  { name: "geo", content: { type: "geo", lat: 10.9685, lng: -74.7813 } },
  {
    name: "geo-con-etiqueta",
    content: { type: "geo", lat: 40.4168, lng: -3.7038, label: "Puerta del Sol" },
  },
];
