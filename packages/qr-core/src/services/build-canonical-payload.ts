/** Construye el payload canónico (una sola forma por contenido) con advertencias. */

import { buildCalendar } from "../builders/calendar.builder.js";
import { buildEmail } from "../builders/email.builder.js";
import { buildGeo } from "../builders/geo.builder.js";
import { buildPhone } from "../builders/phone.builder.js";
import { buildSms } from "../builders/sms.builder.js";
import { buildText } from "../builders/text.builder.js";
import { buildUrl } from "../builders/url.builder.js";
import { buildVCard } from "../builders/vcard.builder.js";
import { buildWifi } from "../builders/wifi.builder.js";
import type { BuildPayloadResult, QrContent } from "../domain/qr-content.js";

const HTTPS_WARNING = "Se recomienda usar https: para mayor seguridad.";
const PHONE_WARNING = "El número no parece internacional: añade el código de país si es necesario.";

export function buildCanonicalPayload(content: QrContent): BuildPayloadResult {
  switch (content.type) {
    case "text":
      return { payload: buildText(content), warnings: [] };
    case "url":
      return {
        payload: buildUrl(content),
        warnings: content.url.startsWith("http://") ? [HTTPS_WARNING] : [],
      };
    case "email":
      return { payload: buildEmail(content), warnings: [] };
    case "phone":
      return {
        payload: buildPhone(content),
        warnings: content.phone.trim().startsWith("+") ? [] : [PHONE_WARNING],
      };
    case "sms":
      return {
        payload: buildSms(content),
        warnings: content.phone.trim().startsWith("+") ? [] : [PHONE_WARNING],
      };
    case "wifi":
      return { payload: buildWifi(content), warnings: [] };
    case "vcard":
      return { payload: buildVCard(content), warnings: [] };
    case "calendar":
      return { payload: buildCalendar(content), warnings: [] };
    case "geo":
      return { payload: buildGeo(content), warnings: [] };
  }
}
