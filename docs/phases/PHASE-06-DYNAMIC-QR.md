# Fase 06 — QR Dinámicos y Persistencia

## Objetivo

Crear URLs cortas editables con redirección confiable.

## Resultado

Un usuario técnico o cuenta interna puede crear un QR dinámico, editar su destino, pausarlo y resolverlo.

## Fuera de alcance

- analítica avanzada;
- equipos;
- facturación;
- dominios personalizados.

## Archivos

```text
apps/api/src/infrastructure/database/
├─ pool.ts
├─ transaction.ts
├─ migrate.ts
├─ migration-runner.ts
└─ migrations/
   ├─ 0001_create_dynamic_qrs.sql
   ├─ 0002_create_idempotency_keys.sql
   └─ 0003_create_audit_events.sql

apps/api/src/modules/dynamic-qrs/
├─ dynamic-qr.routes.ts
├─ dynamic-qr.controller.ts
├─ dynamic-qr.service.ts
├─ dynamic-qr.repository.ts
├─ dynamic-qr.sql.ts
├─ slug.ts
├─ destination-policy.ts
└─ dynamic-qr.errors.ts

apps/api/src/modules/redirect/
├─ redirect.routes.ts
├─ redirect.controller.ts
├─ redirect.service.ts
└─ redirect-cache-policy.ts

packages/contracts/src/
├─ dynamic-qr.schema.ts
└─ pagination.schema.ts
```

## Tareas

### 1. PostgreSQL

- `pg`;
- pool;
- timeout;
- SSL;
- migrations;
- test DB.

### 2. Slug

- crypto random;
- alfabeto;
- colisión;
- reserved words;
- longitud configurable.

### 3. Estado

- active;
- paused;
- expired;
- blocked;
- deleted.

### 4. Crear

- idempotency key;
- destination validation;
- audit;
- short URL.

### 5. Actualizar

- version;
- ETag/If-Match;
- audit;
- no lost updates.

### 6. Redirect

- path fuera de `/api`;
- lookup optimizado;
- 302;
- 410 expirado;
- página pausada;
- no fetch;
- headers seguros.

### 7. QR

El QR generado contiene short URL, no destination URL.

## Pruebas

- migración up/down;
- DB vacía;
- slug collision;
- idempotency;
- active redirect;
- changed destination;
- paused;
- expired;
- concurrency;
- SQL injection;
- DB timeout;
- latency.

## Criterios de aceptación

- destino cambia sin regenerar QR;
- redirect no depende de analítica;
- slug no es predecible;
- API versionada;
- migraciones reproducibles;
- backup/rollback documentado.

## Puerta de salida

- [ ] DB
- [ ] migrations
- [ ] create/update
- [ ] redirect
- [ ] concurrency
- [ ] load smoke
- [ ] reporte
