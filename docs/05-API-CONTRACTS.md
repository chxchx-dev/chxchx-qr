# 05 — Contratos de API

## 1. Convenciones

Base:

```text
/api/v1
```

Content types:

```text
application/json
application/problem+json
image/svg+xml
image/gif
image/png
multipart/form-data
```

Headers:

```text
X-Request-Id
X-Content-Type-Options: nosniff
Cache-Control
Content-Disposition
```

## 2. Salud

### `GET /health/live`

Comprueba que el proceso vive.

Respuesta:

```json
{
  "status": "ok",
  "service": "qr-api",
  "version": "1.0.0"
}
```

### `GET /health/ready`

Comprueba dependencias necesarias.

Antes de DB:

```json
{
  "status": "ready",
  "checks": {
    "qrEngine": "ok"
  }
}
```

Después de DB/storage:

```json
{
  "status": "ready",
  "checks": {
    "qrEngine": "ok",
    "database": "ok",
    "storage": "ok"
  }
}
```

## 3. Validar contenido

### `POST /api/v1/qr/validate`

Request:

```json
{
  "content": {
    "type": "url",
    "url": "https://example.com"
  },
  "options": {
    "ecc": "medium",
    "size": 1024,
    "marginModules": 4,
    "foreground": "#000000",
    "background": "#FFFFFF"
  }
}
```

Response `200`:

```json
{
  "valid": true,
  "canonicalPayload": "https://example.com/",
  "density": "safe",
  "warnings": [],
  "recommendations": []
}
```

Response `422`:

```json
{
  "type": "https://docs.example.com/problems/qr-payload-too-large",
  "title": "El contenido excede la capacidad",
  "status": 422,
  "code": "QR_PAYLOAD_TOO_LARGE",
  "detail": "Utiliza un enlace en lugar de incrustar el contenido.",
  "requestId": "req_..."
}
```

## 4. Renderizar

### `POST /api/v1/qr/render`

Request: mismo modelo de validación, añadiendo formato.

```json
{
  "content": {
    "type": "url",
    "url": "https://example.com"
  },
  "options": {
    "format": "png",
    "ecc": "high",
    "size": 256,
    "marginModules": 4,
    "foreground": "#000000",
    "background": "#FFFFFF",
    "logo": "data:image/png;base64,..."
  }
}
```

Respuesta exitosa (SVG):

```text
200 OK
Content-Type: image/svg+xml
Content-Disposition: attachment; filename="qr-code.svg"
Cache-Control: no-store
```

Respuesta exitosa (PNG):

```text
200 OK
Content-Type: image/png
Content-Disposition: attachment; filename="qr-code.png"
Cache-Control: no-store
```

El body es binario o texto SVG, nunca base64 dentro de JSON.

Formatos soportados: `svg`, `gif`, `png`. El PNG solo se sirve si el decode final
verifica el payload (round-trip); en caso contrario `422 QR_RENDER_UNSCANNABLE`.

Reglas del logo en render:

- con `logo` presente, `ecc` debe ser `high` (si no → `422 QR_LOGO_REQUIRES_HIGH_ECC`);
- `logo` + `gif` no es compatible (`422 QR_LOGO_UNSUPPORTED_FORMAT`);
- el servidor re-valida el data URI del logo en cada render (firma + límites),
  nunca confía en el cliente;
- el logo debe proceder de `POST /api/v1/qr/logo` (PNG re-encodado sin metadata).

### Motivo

- menor tamaño;
- streaming;
- menos memoria;
- descarga directa;
- semántica HTTP correcta.

## 5. Logo

### `POST /api/v1/qr/logo`

Sube una imagen de logo; el servidor valida por firma mágica, re-encodea a PNG
(sin metadata) y devuelve un data URI listo para `options.logo`.

Content type:

```text
multipart/form-data
```

Campo:

```text
logo
```

Respuesta `200`:

```json
{
  "dataUri": "data:image/png;base64,...",
  "width": 128,
  "height": 128,
  "format": "png"
}
```

Reglas:

- formatos aceptados: PNG, JPEG, WebP (por firma mágica, no por extensión);
- máx. 2 MB y 1024×1024 (`413 QR_LOGO_TOO_LARGE`);
- archivo no decodificable o tipo no permitido → `400/415 QR_LOGO_INVALID`;
- la salida siempre es PNG re-encodado sin metadata EXIF/ICC;
- stateless: la web guarda el data URI solo en memoria.

## 6. Vista previa

Se reutiliza `/qr/render` con:

```json
{
  "options": {
    "format": "svg",
    "size": 512
  }
}
```

La web puede usar generación local para respuesta instantánea, pero valida contra API antes de descarga final.

## 7. Subir archivo

### `POST /api/v1/files`

Content type:

```text
multipart/form-data
```

Campo:

```text
file
```

Rate limit bajo (por hora): `FILE_RATE_LIMIT_UPLOAD_PER_HOUR`.

Response `200` (el binario nunca viaja en JSON):

```json
{
  "token": "opaque-token-24-bytes",
  "url": "https://files.example.com/f/opaque-token",
  "fileName": "documento.pdf",
  "sizeBytes": 243123,
  "mimeType": "application/pdf",
  "sha256": "8bb0cf6eb9b17d0f7d22b456f121257dc1254e1f01665370476383ea776df414",
  "expiresAt": "2026-08-12T16:00:00.000Z"
}
```

Tipos permitidos (por firma mágica, nunca el MIME del browser ni la extensión):

```text
image/png, image/jpeg, image/webp, application/pdf, text/plain
```

Reglas de validación:

- el nombre original es metadata, no ruta: la URL usa un token opaco de 24 bytes
  (`crypto.randomBytes`, base64url) que nunca es el storage key ni el nombre;
- la secuencia es: límite HTTP → firma mágica → MIME permitido → extensión
  coherente (bloqueada `.exe .svg .zip .html .js .sh …`) → SHA-256 → re-encode
  de imágenes con sharp (elimina metadata) → storage local → estado `clean`;
- `text/plain` puede deshabilitarse en producción (`FILE_ALLOWED_TYPES`);
- el servidor puede rechazar el re-encode de imágenes (`415`);
- si `FILE_UPLOAD_ENABLED=false` → `403 FILE_UPLOAD_DISABLED`.

### `GET /f/:token`

Descarga pública (ADR-003). Rate limit alto (por minuto):
`FILE_RATE_LIMIT_DOWNLOAD_PER_MINUTE`.

Headers de seguridad:

```text
Content-Type: <mime validado por firma>
Content-Disposition: attachment; filename="safe.pdf"; filename*=UTF-8''...
X-Content-Type-Options: nosniff
Content-Security-Policy: sandbox
Cache-Control: private, max-age=300
```

Comportamiento:

- `200` con el binario (siempre como adjunto, nunca inline);
- `404 FILE_NOT_FOUND` si el token no existe (y no hay listing);
- `410 FILE_EXPIRED` si expiró (el archivo se elimina en ese momento);
- `429 FILE_RATE_LIMITED` al superar la cuota.

## 8. Crear QR dinámico

### `POST /api/v1/dynamic-qrs`

Requiere autenticación.

Request:

```json
{
  "name": "Menú principal",
  "destinationUrl": "https://restaurant.example/menu",
  "active": true,
  "expiresAt": null,
  "tags": ["menu", "sede-centro"]
}
```

Headers:

```text
Idempotency-Key: uuid
```

Response `201`:

```json
{
  "id": "dqr_01...",
  "slug": "aB9kP2",
  "shortUrl": "https://q.example.com/r/aB9kP2",
  "destinationUrl": "https://restaurant.example/menu",
  "active": true,
  "createdAt": "2026-08-05T16:00:00.000Z"
}
```

## 9. Actualizar destino

### `PATCH /api/v1/dynamic-qrs/{id}`

Campos permitidos:

```json
{
  "name": "Menú agosto",
  "destinationUrl": "https://restaurant.example/menu-august",
  "active": true,
  "expiresAt": null
}
```

Usar control de concurrencia:

```text
If-Match: "version-4"
```

Respuesta puede incluir:

```text
ETag: "version-5"
```

## 10. Redirección

### `GET /r/{slug}`

Comportamiento:

- `302` por defecto para destinos editables;
- `410` si expiró;
- `404` si no existe;
- página segura si está pausado;
- no revelar destino privado en error;
- evento de analítica no debe bloquear redirección.

## 11. Historial

### `GET /api/v1/dynamic-qrs`

Filtros:

```text
?page=1&pageSize=20&search=menu&status=active&tag=menu
```

Respuesta:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 0
}
```

## 12. Analítica

### `GET /api/v1/dynamic-qrs/{id}/analytics`

Parámetros:

```text
from
to
granularity=hour|day|week
```

Respuesta:

```json
{
  "range": {
    "from": "2026-08-01T00:00:00.000Z",
    "to": "2026-08-05T23:59:59.999Z"
  },
  "totals": {
    "scans": 1250,
    "estimatedUnique": 860
  },
  "series": [],
  "devices": [],
  "countries": []
}
```

La geolocalización es opcional y no forma parte del núcleo.

## 13. Sesión

### `POST /api/v1/auth/register`
### `POST /api/v1/auth/login`
### `POST /api/v1/auth/logout`
### `GET /api/v1/auth/me`

Autenticación recomendada:

- cookie `HttpOnly`;
- `Secure` en producción;
- `SameSite=Lax`;
- sesión opaca;
- hash del token guardado en DB;
- comprobación de `Origin` en mutaciones.

## 14. Códigos HTTP

| Código | Uso |
|---|---|
| 200 | operación exitosa |
| 201 | recurso creado |
| 204 | operación sin body |
| 400 | JSON o parámetros inválidos |
| 401 | no autenticado |
| 403 | no autorizado |
| 404 | recurso inexistente |
| 409 | conflicto o idempotencia |
| 410 | recurso expirado |
| 413 | archivo/body demasiado grande |
| 415 | tipo no soportado |
| 422 | entrada válida sintácticamente, imposible para QR |
| 429 | límite excedido |
| 500 | error interno |
| 503 | dependencia no disponible |

Códigos de error QR (cuerpo `application/problem+json`, campo `code`):

| Código | HTTP | Significado |
|---|---|---|
| `QR_SCHEMA_INVALID` | 400 | entrada que no cumple el esquema del contrato |
| `QR_PAYLOAD_TOO_LARGE` | 422 | el payload excede la capacidad del encoder |
| `QR_CONTRAST_TOO_LOW` | 422 | contraste < 4.5:1 entre colores |
| `QR_INVERTED_COLORS` | 422 | foreground más claro que el fondo |
| `QR_UNSUPPORTED_FORMAT` | 415 | formato de salida no soportado |
| `QR_LOGO_INVALID` | 400/415 | logo de tipo no permitido o no decodificable |
| `QR_LOGO_TOO_LARGE` | 413 | logo > 2 MB o > 1024×1024 |
| `QR_LOGO_REQUIRES_HIGH_ECC` | 422 | logo presente con ECC inferior a high |
| `QR_LOGO_UNSUPPORTED_FORMAT` | 422 | logo no compatible con el formato (p. ej. GIF) |
| `QR_RENDER_UNSCANNABLE` | 422 | el render final no decodifica el payload |
| `QR_RATE_LIMITED` | 429 | límite de frecuencia superado |
| `FILE_UPLOAD_DISABLED` | 403 | subida de archivos deshabilitada en el entorno |
| `FILE_TOO_LARGE` | 413 | archivo mayor que `FILE_MAX_BYTES` |
| `FILE_TYPE_NOT_ALLOWED` | 415 | tipo no permitido o firma mágica inválida |
| `FILE_INVALID` | 400 | archivo no recibido o multipart inválido |
| `FILE_NOT_FOUND` | 404 | token de descarga inexistente |
| `FILE_EXPIRED` | 410 | el archivo expiró y fue eliminado |
| `FILE_STORAGE_UNAVAILABLE` | 503 | storage no disponible |
| `FILE_RATE_LIMITED` | 429 | límite de frecuencia de subida/descarga superado |

## 15. Compatibilidad

Una vez publicado `/api/v1`:

- no eliminar campos;
- no cambiar semántica;
- campos nuevos deben ser opcionales;
- ruptura exige `/api/v2`;
- códigos de error son parte del contrato.
