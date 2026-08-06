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

Autenticación (desde Fase 07): **sesión de usuario** (cookie `HttpOnly`
`qr_session`, ADR-005). Sin sesión → `401 AUTH_UNAUTHENTICATED`. Las mutaciones
exigen además el header `Origin` de un origen permitido (CSRF) → si falla,
`403 AUTH_ORIGIN_FORBIDDEN`.

Los QR se asignan al usuario autenticado (`owner_user_id`): usuario A no ve ni
gestiona los recursos de B (toda consulta está scoped por owner; lo ajeno
responde `404 DQR_NOT_FOUND`, sin revelar existencia).

Request:

```json
{
  "name": "Menú principal",
  "destinationUrl": "https://restaurant.example/menu",
  "active": true,
  "expiresAt": null
}
```

> `tags` queda fuera de alcance (tablas `qr_tags`/`dynamic_qr_tags` en una fase
> futura de etiquetas; el contrato las muestra como evolución).

Headers:

```text
Idempotency-Key: <mín. 8 caracteres>
```

Idempotencia: con la misma key y el mismo body se devuelve el mismo recurso
(`201` con el mismo `id`); misma key con body distinto → `409
DQR_IDEMPOTENCY_CONFLICT`. Retención 24 h.

Response `201`:

```json
{
  "id": "dqr_13058d99-...",
  "slug": "vwk9VEVULp",
  "shortUrl": "https://q.example.com/r/vwk9VEVULp",
  "name": "Menú principal",
  "destinationUrl": "https://restaurant.example/menu",
  "status": "active",
  "version": 1,
  "expiresAt": null,
  "createdAt": "2026-08-05T16:00:00.000Z",
  "updatedAt": "2026-08-05T16:00:00.000Z"
}
```

El slug lo genera el servidor (criptográfico, alfabeto sin ambiguos, `DYNAMIC_SLUG_LENGTH`);
el usuario no puede elegirlo en MVP.

### `POST /api/v1/dynamic-qrs/{id}/duplicate`

Crea una copia del QR (mismo destino, estado activo si el original estaba
activo, slug nuevo). `201` con el recurso creado; el nombre se copia como
`"<original> (copia)"`. Requiere sesión y ser el propietario (`404` si no).

## 9. Actualizar destino

### `PATCH /api/v1/dynamic-qrs/{id}`

Campos permitidos (al menos uno):

```json
{
  "name": "Menú agosto",
  "destinationUrl": "https://restaurant.example/menu-august",
  "active": true,
  "expiresAt": null
}
```

Control de concurrencia obligatorio (sin lost updates):

```text
If-Match: "v4"
```

- versión correcta → `200` con `ETag: "v5"` (versión incrementada);
- versión obsoleta → `409 DQR_VERSION_CONFLICT`;
- sin `If-Match` → `428 DQR_VERSION_REQUIRED`.

`expiresAt: null` quita la expiración; un `expiresAt` pasado → `422
DQR_EXPIRES_IN_PAST`. También existe `DELETE /api/v1/dynamic-qrs/{id}`
(borrado suave → `204`; después, `404` en GET y en la redirección).

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

## 12. Analítica (Fase 08)

### `GET /api/v1/dynamic-qrs/{id}/analytics`

Requiere sesión y ser el propietario del QR (`404 ANL_NOT_FOUND` si ajeno o
inexistente, sin revelar existencia). Solo se expone si `ANALYTICS_ENABLED=true`
(si no, la ruta no existe → 404 genérico).

Parámetros:

```text
from   ISO 8601 UTC (opcional; defecto: to - 30 días)
to     ISO 8601 UTC (opcional; defecto: ahora)
granularity=hour|day|week (opcional; defecto: day)
```

Reglas de rango:

- máximo 90 días (`422 ANL_INVALID_RANGE` si se excede);
- `from` > `to` → `422 ANL_INVALID_RANGE`;
- `granularity=hour` solo para rangos ≤ 48 h → si no, `422 ANL_INVALID_RANGE`.

Respuesta `200`:

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
  "series": [
    { "bucket": "2026-08-01", "scans": 250 },
    { "bucket": "2026-08-02", "scans": 300 }
  ],
  "devices": [
    { "family": "mobile", "scans": 700 },
    { "family": "bot", "scans": 120 }
  ]
}
```

- `bucket` es fecha ISO (`YYYY-MM-DD` para day/week, `YYYY-MM-DDTHH:00:00Z` para
  hour); el timezone de presentación lo aplica el cliente (UTC interno);
- `estimatedUnique` es la **suma de únicos diarios** (el hash del visitante rota
  a diario → no es identidad real); la UI muestra un disclaimer;
- los bots se aíslan en la familia `bot` (sin hash de visitante);
- `countries` no se devuelve (columna inactiva; geolocalización fuera de
  alcance);
- datos privados del propietario: `Cache-Control: no-store`.

## 12b. Administración y reportes de abuso (Fase 08)

### `POST /api/v1/abuse-reports` — público

Reporta un QR por slug **sin sesión** (rate limit por IP/hora:
`RATE_LIMIT_ABUSE_REPORT_PER_HOUR` → `429 ABUSE_RATE_LIMITED`).

```json
{
  "slug": "aB9kP2XqLz",
  "reason": "El destino muestra contenido engañoso"
}
```

- `reason` de 10 a 500 caracteres; inválido → `400 ABUSE_SCHEMA_INVALID`;
- slug inexistente o borrado → `404 ADM_NOT_FOUND` (bloqueado/expirado sí
  reportable);
- `201` con el reporte (`status: "open"`); la IP del reportero solo se guarda
  hasheada.

### Endpoints de admin (rol en `admin_roles`, bootstrap por SQL manual)

Sin rol → `403 ADM_FORBIDDEN`. Mutaciones con sesión + rol + `Origin` (CSRF).

```text
GET  /api/v1/admin/abuse-reports?page&pageSize&status=open|resolved|dismissed
POST /api/v1/admin/abuse-reports/{id}/resolve   → 204 (auditado)
POST /api/v1/admin/abuse-reports/{id}/dismiss   → 204 (auditado)
POST /api/v1/admin/qrs/{id}/block               → 204 { reason } (deja de redirigir)
POST /api/v1/admin/qrs/{id}/unblock             → 204 { reason } (vuelve a active)
POST /api/v1/admin/users/{id}/block             → 204 { reason } (revoca sesiones)
POST /api/v1/admin/users/{id}/unblock           → 204 { reason }
```

Todas las acciones de moderación se registran en `audit_events` con
`actor_user_id`, `action` (`admin.block_qr`, `admin.unblock_qr`,
`admin.block_user`, `admin.unblock_user`, `admin.resolve_report`,
`admin.dismiss_report`) y el motivo en `metadata_json`. Recurso inexistente →
`404 ADM_NOT_FOUND`; cuerpo sin `reason` → `400 ADM_SCHEMA_INVALID`.

## 13. Sesión (Fase 07, ADR-005)

### `POST /api/v1/auth/register`

`{ email, password, displayName? }` → `201 { user }` + `Set-Cookie`. Email
duplicado (case-insensitive) → `409 AUTH_EMAIL_IN_USE`. Contraseña mín. 8,
máx. 128. El token nunca viaja en JSON.

### `POST /api/v1/auth/login`

`{ email, password }` → `200 { user }` + `Set-Cookie` nueva. Email desconocido
y contraseña incorrecta devuelven el **mismo** `401 AUTH_INVALID_CREDENTIALS`
(anti-enumeración). Cada login emite un token nuevo (anti-fixation).

### `POST /api/v1/auth/logout`

Revoca la sesión actual y limpia la cookie → `204`.

### `GET /api/v1/auth/me`

`200 { user }` con el perfil de la sesión; sin sesión válida → `401
AUTH_UNAUTHENTICATED`.

### `PATCH /api/v1/users/me`

Actualiza `displayName` y/o contraseña (`currentPassword` + `newPassword`).
Cambiar la contraseña revoca el resto de sesiones. `422 AUTH_PASSWORD_WEAK` si
la contraseña actual no coincide.

Detalles de la sesión:

- cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción;
- sesión opaca: token 256 bits firmado con HMAC (`SESSION_SECRET_CURRENT`);
- hash del token guardado en DB;
- expiración (`SESSION_TTL_HOURS`) y revocación (logout/cambio de contraseña);
- comprobación de `Origin` en mutaciones (registro, login, logout, QR, perfil).

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
| `DQR_DISABLED` | 403 | QR dinámicos deshabilitados en el entorno |
| `DQR_SCHEMA_INVALID` | 400 | entrada que no cumple el esquema del contrato |
| `DQR_NOT_FOUND` | 404 | slug o id inexistente (bloqueado/eliminado no se revelan) |
| `DQR_EXPIRED` | 410 | el QR expiró y ya no redirige |
| `DQR_VERSION_CONFLICT` | 409 | If-Match no coincide con la versión actual |
| `DQR_VERSION_REQUIRED` | 428 | falta If-Match en una mutación versionada |
| `DQR_IDEMPOTENCY_CONFLICT` | 409 | misma Idempotency-Key con otro request |
| `DQR_INVALID_DESTINATION` | 422 | destino no permitido (defensa en profundidad) |
| `DQR_EXPIRES_IN_PAST` | 422 | la expiración debe ser futura |
| `DQR_DB_UNAVAILABLE` | 503 | base de datos no disponible |
| `DQR_RATE_LIMITED` | 429 | límite de frecuencia de QR dinámicos superado |
| `AUTH_SCHEMA_INVALID` | 400 | entrada que no cumple el esquema de auth |
| `AUTH_EMAIL_IN_USE` | 409 | el email ya está registrado |
| `AUTH_INVALID_CREDENTIALS` | 401 | credenciales inválidas (mensaje genérico) |
| `AUTH_UNAUTHENTICATED` | 401 | sesión ausente, inválida o expirada |
| `AUTH_ORIGIN_FORBIDDEN` | 403 | Origin no permitido en una mutación (CSRF) |
| `AUTH_PASSWORD_WEAK` | 422 | contraseña actual incorrecta al cambiarla |
| `AUTH_RATE_LIMITED` | 429 | límite de login/registro superado |
| `ANL_INVALID_RANGE` | 422 | rango o granularidad de analítica no soportados |
| `ANL_NOT_FOUND` | 404 | QR ajeno o inexistente en analítica |
| `ABUSE_SCHEMA_INVALID` | 400 | reporte de abuso que no cumple el esquema |
| `ABUSE_RATE_LIMITED` | 429 | límite de reportes de abuso superado |
| `ADM_FORBIDDEN` | 403 | se requieren permisos de administrador |
| `ADM_NOT_FOUND` | 404 | recurso de administración inexistente |
| `ADM_SCHEMA_INVALID` | 400 | acción de moderación inválida |

## 15. Compatibilidad

Una vez publicado `/api/v1`:

- no eliminar campos;
- no cambiar semántica;
- campos nuevos deben ser opcionales;
- ruptura exige `/api/v2`;
- códigos de error son parte del contrato.
