# QR-ENDPOINTS — Endpoints estáticos del motor QR (Fase 02)

Base: `/api/v1`. Errores en formato **Problem Details (RFC 9457)** con `Content-Type: application/problem+json`.

Todos los cuerpos JSON de error incluyen `requestId`. Todas las respuestas incluyen `X-Request-Id` y `X-Content-Type-Options: nosniff`.

## Contenido (`content`)

Unión discriminada por `type` (los strings se normalizan a NFC y se recortan):

| type | Campos | Límites |
|---|---|---|
| `text` | `text` | 1..500 |
| `url` | `url` | solo `http:`/`https:`, sin credenciales, ≤ 2000 |
| `email` | `email`, `subject?`, `body?` | email válido; subject ≤ 500, body ≤ 1000 |
| `phone` | `phone` | dígitos/espacios/guiones/paréntesis y un `+` inicial; ≤ 32 |
| `sms` | `phone`, `body?` | igual que phone; body ≤ 500 |
| `wifi` | `ssid`, `password?`, `networkType`, `hidden?` | ssid ≤ 64; password ≤ 64; `WPA`/`WEP` exigen password, `nopass` lo prohíbe |
| `vcard` | `name`, `lastname?`, `org?`, `title?`, `phone?`, `email?`, `url?`, `address?`, `note?` | `name` obligatorio (FN); campos ≤ 200, note ≤ 500 |
| `calendar` | `summary`, `start`, `end?`, `location?`, `description?` | `start`/`end` ISO 8601 UTC con `Z`; `end` > `start` |
| `geo` | `lat`, `lng`, `label?` | lat ∈ [-90,90], lng ∈ [-180,180] |

> **Nota de contrato (WiFi):** el tipo de red se llama **`networkType`** (`WPA`/`WEP`/`nopass`) para no colisionar con el discriminante `type` de la unión. Los docs maestros usaban `type` para ambos; ver `PHASE-02-PLAN`.

## Opciones (`options?`)

Si se omite, se aplican los valores por defecto:

```json
{
  "format": "svg",
  "ecc": "medium",
  "size": 1024,
  "marginModules": 4,
  "foreground": "#000000",
  "background": "#FFFFFF"
}
```

- `format`: `svg` | `gif` | `png` (el servidor renderiza `svg`/`gif`; `png` → 415 en esta fase).
- `ecc`: `low` | `medium` | `quartile` | `high`.
- `size`: 128..4096. `marginModules`: 0..16.
- Colores: `#RGB` o `#RRGGBB`.

## `POST /api/v1/qr/validate`

Valida contenido + opciones sin generar el archivo.

```json
{
  "content": { "type": "url", "url": "https://example.com" },
  "options": { "ecc": "medium", "size": 1024, "marginModules": 4 }
}
```

Respuesta `200`:

```json
{
  "valid": true,
  "canonicalPayload": "https://example.com/",
  "density": "safe",
  "warnings": [],
  "recommendations": []
}
```

- `canonicalPayload`: única forma canónica (URL re-serializada con `URL`, email `mailto:...`, `WIFI:...`, vCard/iCalendar con CRLF, etc.).
- `density`: `safe` (v1-9) · `dense` (v10-19, sugiere mayor tamaño/margen) · `critical` (v20-40, sugiere evitar personalización o usar enlace corto).
- `warnings`: p. ej. `http:` sin TLS, teléfono no internacional, colores personalizados con formato GIF (solo SVG los aplica en esta fase).

## `POST /api/v1/qr/render`

Igual modelo que `validate` más `format`. Devuelve el **binario real** (nunca base64 en JSON).

```text
200 OK
Content-Type: image/svg+xml   (o image/gif)
Content-Disposition: attachment; filename="qr-code.svg"
Cache-Control: no-store
X-Content-Type-Options: nosniff
```

- El SVG se genera internamente: sin scripts, sin enlaces, sin `foreignObject`, colores validados.
- El GIF es GIF87a generado directamente por el encoder (sin colores personalizados).

## Códigos de error

| status | code | significado |
|---|---|---|
| 400 | `QR_SCHEMA_INVALID` | la entrada no cumple el contrato (detalle del primer issue) |
| 415 | `QR_UNSUPPORTED_FORMAT` | formato no renderizable en esta fase (p. ej. `png`) |
| 422 | `QR_PAYLOAD_TOO_LARGE` | el payload excede la capacidad del QR (usa un enlace) |
| 422 | `QR_CONTRAST_TOO_LOW` | contraste < 4.5:1 |
| 422 | `QR_INVERTED_COLORS` | foreground más claro que el fondo (bloqueado en MVP) |

Los códigos son parte del contrato (`@acore/contracts` → `ErrorCodes`) y no cambian.
