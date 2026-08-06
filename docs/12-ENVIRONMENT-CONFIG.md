# 12 — Configuración y Variables de Entorno

## 1. Principio

La aplicación falla al iniciar si falta una variable obligatoria o tiene formato inválido.

No existen defaults inseguros en producción.

## 2. API base

```dotenv
NODE_ENV=development
PORT=4000
APP_VERSION=0.1.0
LOG_LEVEL=debug
PUBLIC_API_URL=http://localhost:4000
WEB_ORIGIN=http://localhost:5173
TRUST_PROXY=false
# 2 MB: permite el data URI del logo (PNG re-encodado ≤1024×1024) en validate/render
REQUEST_BODY_LIMIT=2mb
```

## 3. QR

```dotenv
QR_DEFAULT_ECC=medium
QR_DEFAULT_SIZE=1024
QR_MIN_SIZE=128
QR_MAX_SIZE=4096
QR_DEFAULT_MARGIN=4
QR_MAX_TEXT_LENGTH=2000
QR_ENABLE_SERVER_PNG=true
QR_ENABLE_LOGO=true
LOGO_MAX_BYTES=2097152
LOGO_MAX_DIMENSION=1024
```

`LOGO_MAX_BYTES` y `LOGO_MAX_DIMENSION` aplican al upload de logo y a la
re-validación del data URI en cada render (límites anti-abuso de Fase 04).

Los límites de producto deben ser menores o iguales a la capacidad técnica.

## 4. Rate limit

```dotenv
RATE_LIMIT_VALIDATE_PER_MINUTE=120
RATE_LIMIT_RENDER_PER_MINUTE=60
RATE_LIMIT_PNG_PER_MINUTE=20
RATE_LIMIT_UPLOAD_PER_HOUR=20
RATE_LIMIT_LOGIN_PER_15_MINUTES=10
```

`RATE_LIMIT_LOGIN_PER_15_MINUTES` aplica a registro y login (brute force,
docs/07 §11).

## 5. Archivos

```dotenv
# Activo por defecto; false desactiva la subida (p. ej. sin text/plain)
FILE_UPLOAD_ENABLED=true
FILE_MAX_BYTES=10485760
FILE_ALLOWED_TYPES=image/png,image/jpeg,image/webp,application/pdf,text/plain
FILE_ANONYMOUS_TTL_HOURS=168
FILE_TEMP_DIR=/tmp/qr-studio
FILE_STORAGE_DRIVER=local
FILE_PUBLIC_BASE_URL=http://localhost:4000
FILE_RATE_LIMIT_UPLOAD_PER_HOUR=10
FILE_RATE_LIMIT_DOWNLOAD_PER_MINUTE=120
FILE_CLEANUP_INTERVAL_MINUTES=60
```

- `FILE_PUBLIC_BASE_URL` es la base de la URL que va dentro del QR
  (`{base}/f/{token}`, ADR-003): debe ser la URL pública del despliegue;
- el storage local no persiste en contenedores sin volumen: montar
  `FILE_TEMP_DIR` en un volumen nombrado;
- `FILE_CLEANUP_INTERVAL_MINUTES` rige el job que borra expirados, huérfanos
  y temporales (`file-cleanup.ts`);
- `text/plain` puede retirarse de `FILE_ALLOWED_TYPES` en producción para
  reducir superficie (los scripts se bloquean igualmente por extensión).

Producción:

```dotenv
FILE_STORAGE_DRIVER=s3
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false
```

Nunca exponer credenciales S3 al frontend.

## 6. Base de datos

```dotenv
DATABASE_URL=postgres://localhost:5432/acore_qr
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=10
DATABASE_SSL=false
DATABASE_STATEMENT_TIMEOUT_MS=5000
```

- obligatoria si `DYNAMIC_QR_ENABLED=true` (fallo temprano en `apiConfig`);
- las migraciones (`apps/api/src/infrastructure/database/migrations/`) se aplican
  al arranque del server y vía `npm run db:migrate -w apps/api` (advisory lock +
  transacción; `db:migrate:down` revierte la última);
- los tests de QR dinámicos usan DBs propias (`acore_qr_test_*`), creadas y
  migradas automáticamente; en CI corre un servicio postgres (`DATABASE_URL_TEST`).

## 7. Sesiones (Fase 07, ADR-005)

```dotenv
SESSION_COOKIE_NAME=qr_session
SESSION_TTL_HOURS=168
SESSION_SECRET_CURRENT=
SESSION_SECRET_PREVIOUS=
PASSWORD_SCRYPT_N=16384
PASSWORD_SCRYPT_R=8
PASSWORD_SCRYPT_P=1
```

- `SESSION_SECRET_CURRENT` es **obligatoria** si `DYNAMIC_QR_ENABLED=true`
  (mín. 32 caracteres): firma HMAC del valor de la cookie (`token.firma`);
- `SESSION_SECRET_PREVIOUS` habilita rotación sin invalidar sesiones
  (docs/12 §12): mover current→previous, generar nuevo current, desplegar;
- cookie: `HttpOnly`, `SameSite=Lax`, `Secure` en producción, `Path=/`;
- el token (32 bytes aleatorios) solo existe en la cookie; la DB guarda
  `sha256(token)`;
- contraseñas: scrypt de Node con salt aleatorio; los parámetros
  (`PASSWORD_SCRYPT_N/R/P`) se almacenan versionados con cada hash (re-hash sin
  romper los existentes). Probar el coste en el hardware objetivo.

## 8. Dinámicos

```dotenv
DYNAMIC_QR_ENABLED=false
SHORT_DOMAIN=http://localhost:4000
DYNAMIC_SLUG_LENGTH=10
REDIRECT_CACHE_TTL_SECONDS=30
RATE_LIMIT_DQR_CREATE_PER_MINUTE=20
RATE_LIMIT_DQR_READ_PER_MINUTE=60
RATE_LIMIT_REDIRECT_PER_MINUTE=600
ANALYTICS_ENABLED=false
ANALYTICS_RAW_RETENTION_DAYS=90
ANALYTICS_HMAC_SECRET_CURRENT=
ANALYTICS_HMAC_SECRET_PREVIOUS=
```

- desde la Fase 07 la auth es por **sesión de usuario** (cookie HttpOnly,
  ADR-005): `INTERNAL_API_TOKEN` fue eliminado; los QR existentes sin dueño
  quedaron anónimos (siguen redirigiendo, sin gestión en dashboard);
- `SHORT_DOMAIN` es la base de la URL que viaja en el QR (`{SHORT_DOMAIN}/r/{slug}`);
- `REDIRECT_CACHE_TTL_SECONDS=0` desactiva la cache en memoria (tests).

## 9. Web

Solo variables públicas con prefijo:

```dotenv
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_APP_NAME=QR Studio
VITE_FILE_UPLOAD_ENABLED=false
VITE_DYNAMIC_QR_ENABLED=false
```

No poner secretos en variables `VITE_*`.

## 10. Validación

`packages/config` exporta:

```ts
apiConfig
webConfig
```

Reglas:

- parsear boolean;
- parsear entero;
- rango;
- URL;
- secreto mínimo;
- coherencia entre flags.

Ejemplo:

- si `DYNAMIC_QR_ENABLED=true`, `DATABASE_URL` y `SHORT_DOMAIN` son obligatorias;
- si `FILE_STORAGE_DRIVER=s3`, todas las variables S3 son obligatorias;
- si `NODE_ENV=production`, HTTPS y cookies seguras son obligatorias.

## 11. Archivos de ejemplo

Repositorio:

```text
.env.example
apps/api/.env.example
apps/web/.env.example
```

No incluir valores reales.

## 12. Rotación

Secretos con current/previous permiten rotación gradual.

Procedimiento:

1. mover current a previous;
2. crear nuevo current;
3. desplegar;
4. esperar expiración;
5. eliminar previous.
