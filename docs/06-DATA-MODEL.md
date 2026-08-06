# 06 — Modelo de Datos

## 1. Principio

No se añade base de datos al generador estático. PostgreSQL entra cuando existe una necesidad persistente: QR dinámicos, cuentas, historial o analítica.

## 2. Identificadores

Formato externo recomendado:

```text
usr_...
dqr_...
fil_...
ses_...
evt_...
```

Implementación:

- UUID v7, ULID o identificador aleatorio equivalente;
- no exponer secuencias;
- slugs cortos con entropía suficiente;
- slug y ID no son el mismo dato.

## 3. Tablas

### `users`

```text
id
email_normalized
password_hash
display_name
status
email_verified_at
created_at
updated_at
deleted_at
```

Restricciones:

- email único case-insensitive;
- estado: `active`, `blocked`, `deleted`;
- password hash con scrypt y salt individual.

### `sessions`

```text
id
user_id
token_hash
expires_at
last_seen_at
created_at
revoked_at
user_agent_summary
ip_hash
```

No guardar token original.

### `dynamic_qrs`

```text
id
owner_user_id
name
slug
destination_url
status
expires_at
version
created_at
updated_at
deleted_at
```

Estados:

```text
active
paused
expired
blocked
deleted
```

Índices:

- unique `slug`;
- owner + updated_at;
- owner + status;
- expires_at parcial.

### `qr_tags`

```text
id
owner_user_id
name
normalized_name
created_at
```

### `dynamic_qr_tags`

```text
dynamic_qr_id
tag_id
```

PK compuesta.

### `files`

```text
id
owner_user_id nullable
storage_key
original_name
content_type
size_bytes
sha256
status
expires_at
created_at
deleted_at
```

Estados:

```text
pending
clean
blocked
deleted
expired
```

### `scan_events`

```text
id
dynamic_qr_id
occurred_at
day_bucket
visitor_hash
ip_prefix_hash
user_agent_family
device_family
os_family
country_code nullable
referrer_domain nullable
is_bot
request_id
```

No almacenar:

- IP completa permanente;
- user-agent bruto indefinidamente;
- fingerprint invasivo;
- coordenadas precisas.

### `audit_events`

```text
id
actor_user_id nullable
action
resource_type
resource_id
metadata_json
created_at
request_id
```

No incluir secretos ni contraseñas en metadata.

### `idempotency_keys`

```text
key_hash
owner_user_id
route
request_hash
response_status
response_body_json
expires_at
created_at
```

## 4. Relaciones

```text
users 1---N sessions
users 1---N dynamic_qrs
users 1---N files
dynamic_qrs N---N qr_tags
dynamic_qrs 1---N scan_events
```

## 5. Retención

Valores iniciales recomendados:

| Dato | Retención |
|---|---|
| Sesión revocada | 30 días |
| Idempotency key | 24 horas |
| Evento crudo de escaneo | 90 días |
| Agregado diario | 24 meses |
| Archivo anónimo | 7 días |
| Auditoría de seguridad | 12 meses |
| Logs de aplicación | 30 días |

Los valores deben ser configurables y compatibles con la política legal del despliegue.

## 6. Analítica única estimada

No prometer “persona única”.

Usar:

```text
visitor_hash = HMAC(rotating_daily_secret, truncated_ip + ua_family)
```

Características:

- rota diariamente;
- reduce seguimiento prolongado;
- permite estimación diaria;
- no es identidad real.

## 7. Slug

Requisitos:

- alfabeto sin caracteres ambiguos;
- mínimo 8 caracteres si el volumen lo exige;
- generado criptográficamente;
- reintentar colisión;
- no secuencial;
- reservado para rutas internas.

No permitir que el usuario elija slug en MVP.

## 8. Migraciones

Estructura (la numeración sigue el orden real de aplicación):

```text
apps/api/src/infrastructure/database/migrations/
  0001_create_dynamic_qrs.sql
  0002_create_idempotency_keys.sql
  0003_create_audit_events.sql
  0004_create_users.sql
  0005_create_sessions.sql
  0006_assign_dynamic_qr_owner.sql
```

`0006` introduce el ownership: `owner_user_id` (text, FK a `users`) en
`dynamic_qrs` e `idempotency_keys` (única por `(owner_user_id, key_hash)`),
`actor_user_id` en `audit_events`. Las filas previas quedan anónimas (`NULL`):
siguen redirigiendo pero no se gestionan desde el dashboard.

Cada migración incluye:

- `up`;
- `down` cuando sea seguro;
- transacción;
- prueba en DB vacía;
- prueba desde versión anterior;
- estimación de bloqueo.

## 9. Backups

Antes de cambios destructivos:

- backup verificado;
- restauración probada;
- ventana definida;
- rollback documentado.

## 10. Consultas prioritarias

- resolver slug activo;
- listar QR de un usuario;
- actualizar destino con versión;
- agregar escaneos por día;
- eliminar eventos expirados;
- buscar por nombre y etiqueta.

Los índices se crean para estas consultas, no por intuición.
