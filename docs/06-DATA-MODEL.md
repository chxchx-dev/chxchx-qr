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
scn_...
rep_...
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

### `scan_events` (Fase 08)

```text
id
dynamic_qr_id (qr_id)
scanned_at
visitor_hash nullable (NULL en bots)
is_bot
device_family
referrer_domain nullable
country nullable (inactivo: siempre NULL, sin geolocalización)
request_id
created_at
```

No almacenar:

- IP completa permanente (solo dentro del HMAC del `visitor_hash`);
- user-agent bruto indefinidamente (solo dentro del HMAC del `visitor_hash`);
- fingerprint invasivo;
- coordenadas precisas.

### `scan_aggregates` (Fase 08)

```text
dynamic_qr_id (qr_id)
day
device_family
total
unique_visitors
updated_at
```

PK compuesta `(qr_id, day, device_family)`. El job de agregación compacta
`scan_events` con upsert idempotente; `unique_visitors` es el recuento de
hashes distintos del día.

### `abuse_reports` (Fase 08)

```text
id
dynamic_qr_id (qr_id, nullable)
slug
reason
status (open | resolved | dismissed)
reporter_ip_hash (nunca la IP completa)
request_id
created_at
updated_at
resolved_at
resolved_by
```

### `admin_roles` (Fase 08)

```text
user_id (PK, FK a users)
created_at
created_by
```

Bootstrap por SQL manual (decisión de la fase); sin endpoint de promoción.

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
users 0..1---1 admin_roles
dynamic_qrs N---N qr_tags
dynamic_qrs 1---N scan_events
dynamic_qrs 1---N scan_aggregates
dynamic_qrs 0..1---N abuse_reports (ON DELETE SET NULL)
```

## 5. Retención

Valores iniciales recomendados:

| Dato | Retención |
|---|---|
| Sesión revocada | 30 días |
| Idempotency key | 24 horas |
| Evento crudo de escaneo | 90 días (`ANALYTICS_RAW_RETENTION_DAYS`, job de purga) |
| Agregado diario | sin purga en MVP (compacto; política futura al crecer) |
| Archivo anónimo | 7 días |
| Auditoría de seguridad | 12 meses |
| Logs de aplicación | 30 días |

Los valores deben ser configurables y compatibles con la política legal del despliegue.

## 6. Analítica única estimada

No prometer “persona única”.

Usar (implementación Fase 08):

```text
visitor_hash = HMAC(ANALYTICS_HMAC_SECRET_CURRENT, `${day} | ${ip} | ${user_agent}`)
```

Características:

- rota diariamente (el `day` va en el mensaje: mismo visitante → hash distinto
  al día siguiente);
- IP y UA solo entran al HMAC; nunca se persisten;
- los bots se registran en familia `bot` y sin `visitor_hash`;
- permite estimación diaria (el "único" de un rango = suma de únicos diarios);
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
  0007_create_scan_events.sql
  0008_create_scan_aggregates.sql
  0009_create_abuse_reports.sql
  0010_create_admin_roles.sql
```

`0006` introduce el ownership: `owner_user_id` (text, FK a `users`) en
`dynamic_qrs` e `idempotency_keys` (única por `(owner_user_id, key_hash)`),
`actor_user_id` en `audit_events`. Las filas previas quedan anónimas (`NULL`):
siguen redirigiendo pero no se gestionan desde el dashboard.

`0007`-`0010` (Fase 08) añaden analítica (`scan_events`, `scan_aggregates`),
reportes de abuso (`abuse_reports`) y rol admin (`admin_roles`).

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
