# 04 — Tipos de contenido QR

Cada entrada produce un `canonicalPayload` que se codifica directamente en el QR estático.

| Tipo | Datos principales | Payload |
|---|---|---|
| `text` | `text` | texto normalizado NFC |
| `url` | `url` | URL HTTP/HTTPS normalizada |
| `email` | `email`, `subject?`, `body?` | `mailto:` |
| `phone` | `phone` | `tel:` |
| `sms` | `phone`, `body?` | `sms:` |
| `wifi` | `ssid`, `password?`, `networkType`, `hidden?` | `WIFI:` |
| `vcard` | nombre y campos opcionales | vCard 3.0 |
| `calendar` | resumen, inicio y campos opcionales | iCalendar |
| `geo` | latitud, longitud y etiqueta opcional | `geo:` |

Los límites por campo están definidos en `packages/contracts/src/qr-content.schema.ts`. El encoder impone además la capacidad real, que depende del contenido y del nivel de corrección.

## Reglas

- Se normaliza Unicode a NFC y se recortan los campos de texto definidos por contrato.
- Los builders escapan caracteres de WiFi, vCard e iCalendar.
- URLs admiten únicamente `http:` y `https:` y no pueden incluir usuario o contraseña.
- Los campos opcionales vacíos se omiten del payload cuando corresponde.
- Las contraseñas WiFi están incluidas en el QR resultante, pero no se persisten.
