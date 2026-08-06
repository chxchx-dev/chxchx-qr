# PHASE-06-PLAN — QR Dinámicos y Persistencia

> Fuente de verdad: `docs/phases/PHASE-06-DYNAMIC-QR.md`. Estado: **DONE** (2026-08-06). Cierre: `docs/execution/PHASE-06-REPORT.md`.

## Objetivo

Introducir PostgreSQL (ADR-004/006) y permitir crear QRs dinámicos: URL corta `{SHORT_DOMAIN}/r/{slug}` con destino editable, pausa y expiración, redirección confiable y gestión vía API. Backend-only: la UI web (dashboard) llega en Fase 07.

## Decisiones confirmadas

| Decisión | Detalle |
|---|---|
| Autenticación Fase 06 | **Token interno por env** (`INTERNAL_API_TOKEN`, header `Authorization: Bearer`), comparado con `timingSafeEqual`. Es la "cuenta interna" del doc de fase; se sustituye por cuentas reales en Fase 07. Hash del token en `audit_events` (nunca el token). |
| Base de datos | **PostgreSQL local (:5432)** para dev y tests (DB `acore_qr` dev, `acore_qr_test` tests auto-creada/migrada), + servicio postgres en CI. `pg` + SQL explícito (ADR-006, sin ORM). |
| Migraciones | Archivos SQL `NNNN_name.sql` (up) + `NNNN_name.down.sql` (down), tabla `schema_migrations`, cada migración en transacción con `pg_advisory_lock` (arranque concurrente seguro). Se aplican al arranque del server y vía `npm run db:migrate`. |
| Redirección | `GET /r/{slug}` fuera de `/api`: `302` activo, `410` expirado (transición perezosa `active→expired`), `404` inexistente/bloqueado/eliminado, `200` página segura pausada (CSP `sandbox`, sin revelar destino). Cache en memoria con TTL configurable (`REDIRECT_CACHE_TTL_SECONDS`, 0 en tests). |
| Slug | `crypto.randomInt` sobre alfabeto sin ambiguos (58 chars: sin 0/O/1/l/I), longitud `DYNAMIC_SLUG_LENGTH` (defecto 10), reintento de colisión (hasta 5), reserved words internas. El usuario no elige slug en MVP. |
| Idempotencia | `Idempotency-Key` (hash SHA-256 de key+body) → replay 201 con mismo body; misma key con body distinto → `409 DQR_IDEMPOTENCY_CONFLICT`. `ON CONFLICT` protege la carrera. Retención 24 h. |
| Concurrencia | `PATCH` con `If-Match: "v{n}"` (ETag `"v{n+1}"`); `UPDATE ... WHERE version = $n`; 0 filas → `409 DQR_VERSION_CONFLICT`. |
| Tags | **Fuera de alcance Fase 06** (tablas `qr_tags`/`dynamic_qr_tags` llegan con el historial de Fase 07). El contrato §8 las muestra a futuro; la API de Fase 06 no las acepta. |
| Analítica | Fuera de alcance (Fase 08); la redirección no depende de analítica. |

## Fuera de alcance (confirmado)

Analítica, equipos, facturación, dominios personalizados, cuentas/sesiones (Fase 07), UI web del dashboard (Fase 07), tags, elección de slug por el usuario.

## Archivos por crear

```text
docs/execution/PHASE-06-PLAN.md ✅
docs/adr/ADR-004-database-postgres.md
docs/adr/ADR-006-explicit-sql.md
packages/contracts/src/{dynamic-qr.schema,pagination.schema}.ts
apps/api/src/infrastructure/database/{pool,transaction,migrate,migration-runner}.ts
apps/api/src/infrastructure/database/migrations/{0001_create_dynamic_qrs,0002_create_idempotency_keys,0003_create_audit_events}.sql
apps/api/src/infrastructure/database/migrations/{0001,0002,0003}.down.sql
apps/api/src/modules/dynamic-qrs/{dynamic-qr.routes,dynamic-qr.controller,dynamic-qr.service,dynamic-qr.repository,dynamic-qr.sql,slug,destination-policy,dynamic-qr.errors,internal-auth.middleware}.ts
apps/api/src/modules/redirect/{redirect.routes,redirect.controller,redirect.service,redirect-cache-policy}.ts
apps/api/test/{db-helpers,dynamic-qrs.test,redirect.test}.ts
docs/execution/PHASE-06-REPORT.md
```

## Archivos por modificar

- `packages/contracts/src/{error-codes,qr-content.schema,index}.ts` (códigos `DQR_*`, export `SAFE_URL_SCHEMA`)
- `packages/config/src/api-config.ts` (`DATABASE_*`, `DYNAMIC_*`, `INTERNAL_API_TOKEN`, rate limits)
- `apps/api/src/{app,server}.ts` (rutas, pool, migraciones, `/r/:slug`, health/ready con DB)
- `apps/api/src/routes/health.routes.ts` (check `database`)
- `apps/api/package.json` (`pg` + `@types/pg`)
- `.env.example`, `apps/api/.env.example`, `.github/workflows/ci.yml`
- Docs: `05-API-CONTRACTS.md`, `12-ENVIRONMENT-CONFIG.md`, `PHASE-06-DYNAMIC-QR.md` (checklist)

## Orden de tareas

1. Plan + ADR-004/006 + contracts (schemas, códigos) + tests contracts.
2. Config (`DATABASE_*`, `DYNAMIC_*`, `INTERNAL_API_TOKEN`) + tests config.
3. `pg` + `@types/pg`.
4. DB infra (pool/transaction/migrate/runner) + migraciones.
5. Módulo dynamic-qrs (slug → policy → errors → sql → repository → service → controller → routes → auth).
6. Módulo redirect (cache policy → service → controller → routes).
7. Wiring (app/server/health) + migraciones al arranque.
8. Tests API (helpers de DB, dynamic-qrs, redirect) + CI postgres.
9. Gates completos + revisión.
10. Reporte + docs.

## Pruebas

- migraciones up/down en DB vacía y desde versión anterior;
- slug: alfabeto/longitud/entropía; 20 creaciones → slugs únicos;
- idempotencia: replay (mismo body) y conflicto (mismo key, otro body);
- create: 201 + shortUrl; destino inválido (`javascript:`) → 422; expiración pasada → 422; sin token → 401; deshabilitado → 403;
- patch: If-Match correcto → version+1 y ETag; versión obsoleta → 409; sin If-Match → 428;
- redirect: 302 activo, destino cambiado (TTL=0), 200 pausado con CSP sandbox sin filtraciones, 410 expirado, 404 desconocido/bloqueado/eliminado, headers seguros;
- concurrencia: N PATCH paralelos con misma versión → exactamente 1 éxito; creates paralelos → slugs distintos;
- inyección SQL: nombre con `'; DROP TABLE` → 201 (parámetros);
- DB caída → 503 (`DQR_DB_UNAVAILABLE`);
- rate limit: create bajo → 429.

## Criterios de aceptación (de la fase)

- [x] destino cambia sin regenerar QR (redirección lee la DB en cada request);
- [x] redirect no depende de analítica;
- [x] slug no predecible (crypto, sin secuencia);
- [x] API versionada (`/api/v1`, códigos estables);
- [x] migraciones reproducibles (up/down, advisory lock, transaccionales);
- [x] backup/rollback documentado.

## Riesgos

- Postgres no disponible en CI/máquinas nuevas → servicio en CI y mensaje de error claro en tests;
- cache de redirect con datos obsoletos → TTL corto configurable (0 en tests) y `Cache-Control: no-cache`;
- migraciones en producción → advisory lock + transacción + down documentado;
- token interno filtrado → solo por env, nunca en código, comparación timing-safe, hash en auditoría.
