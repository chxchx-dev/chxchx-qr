# API de QR estáticos

Base: `/api/v1`. Los errores usan `application/problem+json`. Las respuestas incluyen `X-Request-Id` y `X-Content-Type-Options: nosniff`.

## Tipos y opciones

`content` es una unión discriminada por `type`: `text`, `url`, `email`, `phone`, `sms`, `wifi`, `vcard`, `calendar` o `geo`. Campos y límites están en `packages/contracts/src/qr-content.schema.ts`.

Las opciones por defecto son:

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

`format`: `svg`, `png` o `gif`; `ecc`: `low`, `medium`, `quartile` o `high`; `size`: 128–4096; `marginModules`: 0–16; colores: `#RGB` o `#RRGGBB`.

## Salud

- `GET /health/live`: `{ "status": "ok", "service": "qr-api", "version": "0.1.0" }`
- `GET /health/ready`: `{ "status": "ready", "checks": { "qrEngine": "ok" } }`

## Validar

`POST /api/v1/qr/validate`

```json
{
  "content": { "type": "url", "url": "https://example.com" },
  "options": { "ecc": "medium", "size": 512 }
}
```

`200` devuelve `valid`, `canonicalPayload`, `density`, `warnings` y `recommendations`. La API valida contrato, capacidad y contraste.

## Renderizar

`POST /api/v1/qr/render` recibe el mismo objeto y produce un archivo adjunto. El body no se codifica como base64 en JSON.

```text
200 OK
Content-Type: image/svg+xml | image/png | image/gif
Content-Disposition: attachment; filename="qr-code.svg"
Cache-Control: no-store
```

PNG se rasteriza en el servidor; si la decodificación final no coincide con el payload, la API responde `422 QR_RENDER_UNSCANNABLE`.

## Errores relevantes

| HTTP | Código | Motivo |
|---|---|---|
| 400 | `QR_SCHEMA_INVALID` | entrada inválida |
| 415 | `QR_UNSUPPORTED_FORMAT` | formato no soportado |
| 422 | `QR_PAYLOAD_TOO_LARGE` | excede capacidad QR |
| 422 | `QR_CONTRAST_TOO_LOW` | contraste menor al mínimo |
| 422 | `QR_INVERTED_COLORS` | primer plano más claro que el fondo |
| 422 | `QR_RENDER_UNSCANNABLE` | PNG final no devuelve el payload esperado |
| 429 | `QR_RATE_LIMITED` | límite por IP superado |

Las cuotas configurables están en `docs/12-ENVIRONMENT-CONFIG.md`.
