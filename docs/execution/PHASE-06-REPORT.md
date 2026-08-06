# PHASE-06-REPORT — QR Dinámicos (cerrada)

> Estado: **DONE** · Fecha: 2026-08-06 · Fuente: `docs/phases/PHASE-06-DYNAMIC-QR.md` · Plan: `PHASE-06-PLAN.md` · ADR: `ADR-004-database-postgres.md`, `ADR-006-explicit-sql.md`

## Resumen

Los QR dinámicos entran en producción con persistencia real en **PostgreSQL** (ADR-004) y **SQL explícito** (ADR-006): un slug criptográfico corto redirige (`302`) a un destino editable sin regenerar el QR. El módulo es backend-only (la UI del dashboard llega en Fase 07). Incluye: migraciones versionadas con advisory lock y rollback, creación con **Idempotency-Key** (replay seguro vía `pg_advisory_lock`), actualización optimista con **If-Match/ETag**, borrado suave, expiración con transición perezosa a `410`, estados pausado (`200` página sandbox) / bloqueado, auditoría en DB, **token interno** por env (auth real en Fase 07) y rate limits dedicados. La redirección pública (`GET /r/{slug}`) está fuera de `/api` con cache TTL configurable y headers anti-tracking.

## Puerta de salida

| Criterio | Estado |
|---|---|
| ADR-004 + ADR-006 escritos | ✅ `docs/adr/` (postgres + sql explícito) |
| Contratos `DQR_*` + esquemas | ✅ `dynamic-qr.schema.ts`, `pagination.schema.ts`, `safeUrlSchema` exportado, códigos `DQR_*` en `error-codes.ts` + tests |
| Config API | ✅ `DATABASE_URL`, `DYNAMIC_*`, `INTERNAL_API_TOKEN`, `REDIRECT_CACHE_TTL_SECONDS`, rate limits + tests |
| `pg` + `@types/pg` | ✅ instalados en `apps/api`, 0 vulnerabilidades reportadas |
| Migraciones | ✅ 0001 dynamic_qrs, 0002 idempotency_keys, 0003 audit_events (up + down), runner con advisory lock, CLI `db:migrate`/`db:rollback` |
| Módulo dynamic-qrs | ✅ repository (whitelist UPDATE), service (idempotencia + slug retry + expiración perezosa), controller (Idempotency-Key + If-Match/ETag), auth interna Bearer timing-safe |
| Módulo redirect | ✅ `/r/{slug}` público, cache TTL, 302/200 pausado/410/404 con headers seguros |
| Wiring | ✅ `app.ts` monta rutas condicionalmente (`DYNAMIC_QR_ENABLED`), `server.ts` migra al arranque y cierra pool en shutdown, `/health/ready` con chequeo de DB |
| CI | ✅ servicio `postgres:16` + `DATABASE_URL` en `ci.yml` |
| Tests | ✅ 25 nuevos (dynamic-qrs 17, redirect 5, migrations 3) sobre Postgres real |
| Smoke end-to-end compilado | ✅ migraciones al arranque, create + 302 + 401 verificado contra el binario `dist/server.js` |
| Reporte | ✅ este archivo |

## Evidencia verificable

| Gate | Resultado |
|---|---|
| lint / format / typecheck | ✅ Biome limpio (196 archivos, 0 errores); TS estricto 0 errores |
| tests | ✅ **209/209** (78 API + 28 web + 14 config + 23 contracts + 66 qr-core) |
| build | ✅ `tsc` API con migraciones copiadas a `dist` + Vite web (2.6 s) |
| smoke | ✅ health/ready `database: ok`, migraciones aplicadas al arranque, create → **302** → destino, **401** sin token, DB desechable limpiada |

## Decisiones clave (con evidencia)

- **Token interno por env (decisión del usuario)**: la Fase 07 trae cuentas/sesiones reales; hoy la autenticación de la API privada es `Authorization: Bearer <INTERNAL_API_TOKEN>` con comparación **timing-safe** y solo el **hash** del token llega a la auditoría (nunca el token). El middleware responde `403 DQR_DISABLED` si la feature está apagada.
- **Idempotencia con advisory lock**: `createWithIdempotency` adquiere `pg_advisory_lock` sobre el hash de la key, rejuega la respuesta guardada (mismo body) o devuelve `409 DQR_IDEMPOTENCY_CONFLICT` (misma key, body distinto). El TTL de la key es 24 h. El cast `::bigint` explícito elimina la ambigüedad int4/int8 del overload (hallazgo del revisor).
- **Optimistic concurrency**: PATCH exige `If-Match: "v{n}"` (428 si falta, 409 si obsoleto) y devuelve `ETag: "v{n+1}"`. El ETag se emite **quoteado** (RFC 9110) y el parseo acepta `v3` y `"v3"`.
- **Expiración perezosa**: el redirect marca `expired` en la primera visita vencida (un fallo de escritura no rompe la respuesta) y responde `410 DQR_EXPIRED`. Los estados terminales (`410`/`404`) llevan `Cache-Control: no-store` — un QR reactivado nunca queda cacheado como muerto.
- **Seguridad del slug**: generado en el servicio (no elegido por el usuario), alfabeto sin caracteres ambiguos, con retry ante colisión (`23505`) y whitelist de slugs reservados (`r`, `api`, …).
- **Postgres local + CI service (decisión del usuario)**: los tests crean DBs desechables `acore_qr_test_*` por suite (paralelismo seguro); CI provisiona Postgres 16 como servicio.
- **Fase 06 sin UI**: `VITE_DYNAMIC_QR_ENABLED=false` en la web; el dashboard de gestión (login, listado, edición) es la Fase 07.

## Hallazgos del revisor aplicados

- 🟠 **MEDIA — `pg_advisory_lock` latente int4/int8**: `idempotencyLockId` (sha256 → `readUInt32BE(0)`) puede devolver valores > 2^31−1; la inferencia de tipos de Postgres lo resolvió bien en PG 14, pero el cast explícito `$1::bigint` (en lock y unlock, idempotencia y migraciones) lo hace determinista en cualquier entorno.
- 🟠 **MEDIA — Cache-Control en estados terminales del redirect**: los `410` (expirado) y `404` salían por `sendProblem` sin `Cache-Control`, con riesgo de que un CDN cacheara un QR "muerto" para siempre. Ahora ambos llevan `no-store`, con aserción de test añadida.
- 🟢 **Verificados sin cambio**: ETag ya era un string quoteado (`"v{n}"`); `timingSafeEqual` con guard de longitud (no lanza con buffers desiguales); `/health/ready` maneja `database === undefined` (reporta `ready` sin chequeo de DB cuando la feature está apagada); `list` construye filtros 100 % parameterizados con `escapeLike` + enum de zod; tests de 409 (idempotencia) y 428/409 (If-Match) ya existían en la suite.

## Deuda aceptada (documentada)

| Deuda | Condición de resolución |
|---|---|
| Token interno como auth (Bearer global) | Fase 07: cuentas, sesiones y autorización por propietario (`owner_user_id` ya existe en el schema) |
| Sin dashboard/UI web | Fase 07 (listado, edición, activar/pausar desde la web) |
| Redirección sin analítica de clics | Fase 08 (`analytics/` con evento por redirect) |
| Rate limit por proceso (token bucket en memoria) | Fase multi-proceso / Redis (documentado en `docs/12`) |
| Pool sin max conexiones explícito por entorno | Tunear `pool.max` en producción (configurable en `pool.ts`) |
| Sin índices adicionales para analítica | Fase 08 al introducir consultas de agregación |

## Archivos clave

- **Nuevo (API)**: `src/infrastructure/database/{pool,transaction,migrate,migration-runner,cli}.ts` + `migrations/{0001,0002,0003}*.sql` (+ `.down.sql`); `src/modules/dynamic-qrs/{ids,slug,destination-policy,dynamic-qr.errors,dynamic-qr.sql,dynamic-qr.repository,dynamic-qr.service,dynamic-qr.controller,dynamic-qr.routes,internal-auth.middleware}.ts`; `src/modules/redirect/{redirect-cache-policy,redirect.service,redirect.controller,redirect.routes}.ts`.
- **Modificado (API)**: `src/app.ts` (montaje condicional), `src/server.ts` (migraciones + shutdown pool), `src/routes/health.routes.ts` (ready con DB), `package.json` (`db:migrate`/`db:rollback`).
- **Contratos**: `src/dynamic-qr.schema.ts`, `src/pagination.schema.ts`, `src/qr-content.schema.ts` (export `safeUrlSchema`), `src/error-codes.ts` (`DQR_*`), `src/index.ts` + tests.
- **Config**: `api-config.ts` (`DATABASE_*`, `DYNAMIC_*`, `INTERNAL_API_TOKEN`, `REDIRECT_CACHE_TTL_SECONDS`, rate limits) + tests.
- **Tests**: `test/db-helpers.ts`, `test/dynamic-qrs.test.ts` (17), `test/redirect.test.ts` (5), `test/migrations.test.ts` (3); `test/helpers.ts` acepta DB externa.
- **CI / env**: `.github/workflows/ci.yml` (servicio postgres:16 + `DATABASE_URL`), `.env.example` (raíz y `apps/api`).
- **Docs**: `docs/adr/ADR-004-database-postgres.md`, `docs/adr/ADR-006-explicit-sql.md`, `05-API-CONTRACTS.md` (§8-10 + `DQR_*`), `12-ENVIRONMENT-CONFIG.md`, `PHASE-06-DYNAMIC-QR.md` (checklist ✅), `PHASE-06-PLAN.md`.

## Próximo paso permitido

**Fase 07 — Cuentas y historial** (`docs/phases/PHASE-07-AUTH-HISTORY.md`): sustituir el token interno por cuentas reales con sesiones, filtrar QR dinámicos por `owner_user_id` (columna ya migrada) y construir el dashboard web (listado, edición, activar/pausar/expirar). Requiere decidir el mecanismo de sesión (cookie httpOnly vs JWT) y qué historial se expone.
