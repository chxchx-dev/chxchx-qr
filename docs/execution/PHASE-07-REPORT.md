# PHASE-07-REPORT — Cuentas, Sesiones e Historial (cerrada)

> Estado: **DONE** · Fecha: 2026-08-06 · Fuente: `docs/phases/PHASE-07-AUTH-HISTORY.md` · Plan: `PHASE-07-PLAN.md` · ADR: `ADR-005-opaque-sessions.md`

## Resumen

Los QR dinámicos pasan de la autenticación por token interno (Fase 06) a **cuentas reales con sesiones opacas** (ADR-005): registro, login, logout y perfil (`PATCH /api/v1/users/me`), contraseñas con **scrypt versionado** (parámetros por env), cookie HttpOnly **firmada con HMAC** (`SESSION_SECRET_CURRENT`/`PREVIOUS`, rotación sin invalidar sesiones), Origin check en mutaciones (CSRF) y rate limit estricto de login/registro. Cada recurso dinámico queda scoped por `owner_user_id` (aislamiento A/B verificado por tests, 404 en recursos ajenos) con auditoría `actor_user_id`. El historial completo llega a la web con **react-router-dom** (decisión del usuario): login/registro, dashboard con listado paginado/búsqueda/filtro, detalle, edición (If-Match/ETag), **duplicar** y borrado suave. El `INTERNAL_API_TOKEN` se elimina; los QR sin dueño existentes siguen redirigiendo pero quedan anónimos (fuera de gestión hasta un futuro admin).

## Puerta de salida

| Criterio | Estado |
|---|---|
| ADR-005 escrito | ✅ `docs/adr/ADR-005-opaque-sessions.md` (sesiones opacas, cookie HMAC) |
| Contratos `AUTH_*` + esquemas | ✅ `auth.schema.ts` (register/login/logout/me/perfil con `currentPassword`/`newPassword`), códigos `AUTH_*` en `error-codes.ts` + tests |
| Config API | ✅ `SESSION_*`, `PASSWORD_SCRYPT_*`, `RATE_LIMIT_LOGIN_PER_15_MINUTES`; `INTERNAL_API_TOKEN` eliminado + tests |
| Migraciones | ✅ 0004 users, 0005 sessions, 0006 `owner_user_id`/`actor_user_id` (up + down; 0006 con columna nullable para QR anónimos) |
| Módulo auth | ✅ password scrypt versionado (timing-safe), token 256 bits (solo hash en DB), cookie `token.firma` HMAC con rechazo temprano, rotación anti-fixation, revocación, expiry, middlewares auth + origin |
| Módulo users | ✅ `PATCH /api/v1/users/me` (displayName; cambio de contraseña con `currentPassword`, revoca las demás sesiones) |
| Ownership + duplicate | ✅ todas las consultas de gestión scoped por owner; `POST /{id}/duplicate`; auditoría con `actor_user_id` |
| Wiring | ✅ `app.ts` monta auth/users/dynamic-qrs/redirect solo con DB; CORS con credenciales; `Origin` obligatorio en mutaciones |
| Web | ✅ react-router-dom, `RequireAuth`, Login/Register, contexto de sesión, dashboard (listado, detalle, formulario, diálogo de borrado) |
| Tests API reescritos | ✅ Fase 06 reescrita con sesiones (auth.test.ts + dynamic-qrs/redirect/migrations actualizados) |
| CI / env / docs | ✅ CI sin cambios de secretos (los tests generan sus propios), `.env.example` (raíz y `apps/api`), 05, 06, 12, 13, checklist de fase ✅ |
| Reporte | ✅ este archivo |

## Evidencia verificable

| Gate | Resultado |
|---|---|
| lint / format / typecheck | ✅ Biome limpio (225 archivos, 0 errores); TS estricto 0 errores en los 6 workspaces |
| tests | ✅ **249/249** — API **102** (10 archivos) + web 33 (4) + contracts 34 (3) + config 14 (2) + qr-core 66 (11) |
| build | ✅ `tsc` API con migraciones copiadas a `dist` + Vite web (5.4 s) |
| smoke end-to-end (binario `dist/server.js`) | ✅ migraciones 0001–0006 al arranque; `/health/ready` con `database: ok`; register **201** + `Set-Cookie` HttpOnly/SameSite=Lax; `/auth/me` 200; create dynamic-qr **201** (slug `ArEyAUUNt7`); `GET /r/{slug}` **302**; sin sesión **401**; Origin malicioso **403**; logout **204**; DB desechable limpiada |

## Decisiones clave (con evidencia)

- **Sesión opaca con cookie firmada (decisión del plan)**: el valor de la cookie es `token.firma` (HMAC-SHA256 con `SESSION_SECRET_CURRENT`; `PREVIOUS` valida en rotación). Rechazo temprano de cookies forjadas sin tocar DB; la DB solo guarda `sha256(token)`. Tests de fixation (cookies distintas por login), flags y expiración.
- **scrypt versionado por env**: `PASSWORD_SCRYPT_N/R/P` se guardan con el hash (`$scrypt$N$r$p$salt$hash`), re-hash no rompe hashes previos; comparación timing-safe; coste acotado y verificado en la suite.
- **Origin check como CSRF (sin dependencias)**: toda mutación exige `Origin` permitido (misma lista que CORS); la cookie es `SameSite=Lax` + `HttpOnly`; el frontend nunca guarda tokens (API client con `credentials: "include"`).
- **Aislamiento A/B por `owner_user_id`**: toda consulta de gestión incluye `AND owner_user_id = $2`; lo ajeno responde `404 DQR_NOT_FOUND` (sin revelar existencia). Auditoría registra `actor_user_id` (el hash del token de Fase 06 desaparece con el token).
- **QR anónimos heredados**: migración 0006 añade `owner_user_id` nullable; los recursos sin dueño siguen redirigiendo pero no aparecen en ningún dashboard (reclamación futura en admin).
- **`Idempotency-Key` y `If-Match`/ETag conservados de Fase 06** y ahora scoped por usuario (la idempotencia rejuega solo si la key es del mismo owner).
- **Navegación web con react-router-dom** (dependencia aprobada): rutas públicas (`/`, `/login`, `/register`) y protegidas (`/dashboard`, `/qr/new`, `/qr/:id` vía `RequireAuth`).

## Hallazgos del revisor aplicados

- 🟢 **Verificados sin cambio (evidencia en el código/tests)**: `Origin` ausente
  → `403` (el middleware rechaza `undefined`, no solo orígenes ajenos); el
  middleware de Origin corre **antes** de resolver la sesión en mutaciones
  (`verifyOrigin → requireAuth` en logout, `PATCH /users/me` y dynamic-qrs),
  sin oráculo de sesión; `Cache-Control: no-store` en todo el módulo auth
  (register/login/me); TTL de cookie y DB derivados del mismo
  `SESSION_TTL_HOURS`; idempotencia scoped por owner (WHERE por
  `owner_user_id` + `ON CONFLICT (owner_user_id, key_hash)`) con test
  "la misma key en usuarios distintos no colisiona"; register auto-login
  documentado en `docs/05` §13; `credentials: "include"` en `apiFetch`;
  `RequireAuth` con estado `loading` (sin flash a /login); tests de
  aislamiento A/B, concurrencia (8 PATCHes en paralelo) y SQL injection.
- 🟠 **MEDIA — código muerto de Fase 06**: `DQR_UNAUTHORIZED` (token interno)
  quedaba en `error-codes.ts` sin uso; eliminado del contrato y de `docs/05`
  §14 (la fila de la tabla de códigos referenciaba el token eliminado).
- 🟠 **MEDIA — nota de tags obsoleta en `docs/05`**: decía que los tags se
  incorporaban en la Fase 07; el plan los dejó fuera de alcance. Corregida la
  nota (fase futura de etiquetas).
- 🟠 **MEDIA — sesiones expiradas sin limpieza** (único hallazgo sin resolver):
  cada login/register inserta una fila en `sessions`; logout revoca pero no
  borra y no existe job de limpieza por TTL (patrón `file-cleanup`). Registrado
  en deuda aceptada con condición de resolución.

## Deuda aceptada (documentada)

| Deuda | Condición de resolución |
|---|---|
| Sin listing de sesiones en la web | Fase futura ("opcional" del plan; la API revoca por logout y cambio de contraseña) |
| Sesiones expiradas sin job de limpieza (la tabla crece con cada login) | Job periódico tipo `file-cleanup` al introducir operaciones/jobs (hallazgo del revisor de cierre) |
| `email_verified_at` sin flujo de verificación | Fase futura (emails transaccionales) |
| Tags (`qr_tags`/`dynamic_qr_tags`) | Fase futura de etiquetas |
| Redirección sin analítica de clics | Fase 08 (`analytics/` con evento por redirect) |
| Rate limit por proceso (token bucket en memoria) | Fase multi-proceso / Redis (documentado en `docs/12`) |
| QR anónimos sin reclamación desde la web | Admin futuro (`owner_user_id` ya es nullable) |

## Archivos clave

- **Nuevo (API)**: `src/modules/auth/{password,session-token,user.repository,session.repository,auth.service,auth.middleware,origin.middleware,auth.errors,auth.controller,auth.routes,ids}.ts`; `src/modules/users/{users.service,users.controller,users.routes}.ts`; migraciones `0004_create_users`, `0005_create_sessions`, `0006_assign_dynamic_qr_owner` (+ `.down.sql`).
- **Modificado (API)**: `app.ts` (wiring condicional + CORS credenciales), `cors.ts` (PATCH/DELETE + credenciales), `server.ts` (sin cambios de arranque: mismo pool), `modules/dynamic-qrs/*` (ownership, duplicate, auditoría `actor_user_id`, sin `internal-auth.middleware.ts` — eliminado), `routes/health.routes.ts` (inalterado: ready ya chequeaba DB).
- **Contratos**: `auth.schema.ts` (+ tests), `error-codes.ts` (`AUTH_*`), `index.ts`.
- **Config**: `api-config.ts` (`SESSION_*`, `PASSWORD_SCRYPT_*`, `RATE_LIMIT_LOGIN_PER_15_MINUTES`, sin `INTERNAL_API_TOKEN`) + tests.
- **Web**: `app/{App,providers,routes}.tsx`, `shared/lib/{api,messages}.ts`, `features/auth/*`, `features/dashboard/*`, `test/api-client.test.ts`.
- **Tests**: `test/auth.test.ts` (nuevo), `test/dynamic-qrs.test.ts`, `test/redirect.test.ts`, `test/migrations.test.ts` (reescritos con sesiones), `test/db-helpers.ts` (env común de sesión).
- **CI / env**: `.github/workflows/ci.yml` (postgres service desde Fase 06, sin cambios necesarios), `.env.example` (raíz y `apps/api`).
- **Docs**: `ADR-005-opaque-sessions.md`, `05-API-CONTRACTS.md` (§8-13 sesión), `06-DATA-MODEL.md`, `12-ENVIRONMENT-CONFIG.md` (§7 sesiones, §8 sin token interno), `13-DECISIONS-AND-RISKS.md`, `PHASE-07-AUTH-HISTORY.md` (checklist ✅).

## Próximo paso permitido

**Fase 08 — Analítica y Administración** (`docs/phases/PHASE-08-ANALYTICS-ADMIN.md`): eventos por redirección (`ANALYTICS_ENABLED`, retención cruda, HMAC), agregados por QR (clics, tendencia), panel de analítica en el dashboard y administración de abuso (bloqueo de QR/dominios, moderación). Plan previo obligatorio (`docs/execution/PHASE-08-PLAN.md`) antes de implementar.
