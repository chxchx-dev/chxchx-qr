# Plan — Fase 07 · Cuentas, Sesiones e Historial

## Objetivo

Asignar los QR dinámicos a cuentas reales y ofrecer gestión segura: registro,
login, logout, sesión opaca, historial con edición/duplicado/eliminación
autorizada. Sustituye el `INTERNAL_API_TOKEN` de la Fase 06.

## Alcance

- **Auth**: registro, login, logout, `GET /auth/me`; contraseñas con scrypt
  versionado (parámetros por env); sesiones opacas (token 256 bits, hash en DB,
  cookie HttpOnly, rotación anti-fixation, revocación); Origin check en
  mutaciones (CSRF); rate limit estricto de login/registro.
- **Ownership**: `dynamic_qrs.owner_user_id`; todas las consultas de gestión
  scoped por owner (aislamiento usuario A/B); auditoría con `actor_user_id`.
- **Historial**: listado con paginación, búsqueda y filtro por estado; detalle;
  edición (If-Match/ETag, ya existente); **duplicar**; eliminar (borrado suave).
- **Web**: login/registro, contexto de sesión (`RequireAuth`), dashboard con
  listado, detalle, formulario de edición/creación y diálogo de borrado.
  Navegación con **react-router-dom** (decisión del usuario).
- **Migraciones**: `0004_create_users`, `0005_create_sessions`,
  `0006_assign_dynamic_qr_owner` (columnas `owner_user_id` en `dynamic_qrs` e
  `idempotency_keys`, `actor_user_id` en `audit_events`).

## Fuera de alcance

- OAuth, MFA, equipos, pagos, SSO;
- verificación de email (`email_verified_at` queda sin flujo);
- tags (`qr_tags`); analítica (Fase 08);
- listing de sesiones ("opcional" en el plan de fase: se documenta como futuro).

## Decisiones tomadas

1. **`INTERNAL_API_TOKEN` se elimina.** Los QR existentes (sin dueño) quedan
   anónimos (`owner_user_id = NULL`): siguen redirigiendo pero no se gestionan
   desde el dashboard (opción "permanecer anónimos" del plan de fase).
2. **Navegación web con react-router-dom** (dependencia nueva aprobada).
3. **Cookie firmada con HMAC** (`SESSION_SECRET_CURRENT`/`PREVIOUS`): el valor de
   la cookie es `token.firma`; rechazo temprano de cookies forjadas y rotación
   gradual del secreto según docs/12 §12.

## Archivos por crear

```text
packages/contracts/src/auth.schema.ts
packages/contracts/test/auth.schema.test.ts
apps/api/src/infrastructure/database/migrations/0004_create_users.sql (+down)
apps/api/src/infrastructure/database/migrations/0005_create_sessions.sql (+down)
apps/api/src/infrastructure/database/migrations/0006_assign_dynamic_qr_owner.sql (+down)
apps/api/src/modules/auth/password.ts
apps/api/src/modules/auth/session-token.ts
apps/api/src/modules/auth/user.repository.ts
apps/api/src/modules/auth/session.repository.ts
apps/api/src/modules/auth/auth.service.ts
apps/api/src/modules/auth/auth.middleware.ts
apps/api/src/modules/auth/origin.middleware.ts
apps/api/src/modules/auth/auth.errors.ts
apps/api/src/modules/auth/auth.controller.ts
apps/api/src/modules/auth/auth.routes.ts
apps/api/src/modules/users/users.service.ts
apps/api/src/modules/users/users.controller.ts
apps/api/src/modules/users/users.routes.ts
apps/api/test/auth.test.ts
apps/web/src/features/auth/auth-api.client.ts
apps/web/src/features/auth/auth-context.tsx
apps/web/src/features/auth/RequireAuth.tsx
apps/web/src/features/auth/LoginPage.tsx
apps/web/src/features/auth/RegisterPage.tsx
apps/web/src/features/dashboard/dashboard-api.client.ts
apps/web/src/features/dashboard/DashboardPage.tsx
apps/web/src/features/dashboard/QrList.tsx
apps/web/src/features/dashboard/QrDetailPage.tsx
apps/web/src/features/dashboard/QrEditForm.tsx
apps/web/src/features/dashboard/QrDeleteDialog.tsx
docs/adr/ADR-005-opaque-sessions.md
docs/execution/PHASE-07-REPORT.md
```

## Archivos por modificar

```text
packages/contracts/src/error-codes.ts  packages/contracts/src/index.ts
packages/config/src/api-config.ts      packages/config/test/api-config.test.ts
apps/api/src/app.ts                    apps/api/src/cors.ts
apps/api/src/modules/dynamic-qrs/*     (service, repository, sql, controller, routes)
apps/api/src/modules/dynamic-qrs/internal-auth.middleware.ts  (eliminar)
apps/api/test/helpers.ts               apps/api/test/db-helpers.ts
apps/api/test/dynamic-qrs.test.ts      apps/api/test/redirect.test.ts
apps/api/test/migrations.test.ts
apps/web/package.json                  apps/web/src/app/App.tsx
apps/web/src/app/routes.tsx            apps/web/src/app/providers.tsx
apps/web/src/shared/lib/messages.ts
apps/web/test/* (nuevos unit tests)
.github/workflows/ci.yml               .env.example  apps/api/.env.example
docs/05-API-CONTRACTS.md               docs/06-DATA-MODEL.md
docs/12-ENVIRONMENT-CONFIG.md          docs/13-DECISIONS-AND-RISKS.md
docs/phases/PHASE-07-AUTH-HISTORY.md
```

## Orden de tareas

1. Contracts y códigos `AUTH_*` (+tests).
2. Config: `SESSION_*`, `PASSWORD_SCRYPT_*`, `RATE_LIMIT_LOGIN_PER_15_MINUTES`;
   eliminar `INTERNAL_API_TOKEN` (+tests).
3. Migraciones 0004–0006.
4. Módulo auth (password, sesión, repos, service, middlewares, controller,
   routes).
5. Módulo users (`PATCH /api/v1/users/me`).
6. Ownership + duplicate en dynamic-qrs; auditoría con `actor_user_id`.
7. Wiring (`app.ts`, cors con credenciales, `origin` en mutaciones).
8. Tests API (auth, aislamiento, historial, reescritura de Fase 06).
9. Web: router, auth, dashboard.
10. CI, env examples y docs; ADR-005.
11. Gates: biome, typecheck, tests, build + revisión + reporte.

## Pruebas

- **Contracts**: esquemas de auth (email inválido, contraseña corta/larga,
  display name, PATCH perfil con `currentPassword`+`newPassword`).
- **Config**: secretos requeridos con `DYNAMIC_QR_ENABLED`, defaults, ausencia
  de `INTERNAL_API_TOKEN`.
- **API (Postgres real)**: register, email duplicado (409), login, contraseña
  incorrecta (401 genérico), enumeración (mismo 401 con email desconocido),
  session fixation (cookies distintas por login), cookie flags (HttpOnly,
  SameSite, Secure en producción), logout (revoca y limpia), sesión expirada
  (401), CSRF (mutación sin/con Origin erróneo → 403), rate limit login (429),
  aislamiento A/B (404 en recursos ajenos), historial (paginación, búsqueda,
  estado, duplicar), migraciones 0004–0006.
- **Web**: unit tests del cliente auth y del helper de query del dashboard.
- **Gates**: `npm run format:check`, `npm run lint`, `npm run typecheck`,
  `npm run test`, `npm run build`.

## Riesgos

- Cambiar la auth de Fase 06 rompe sus tests: se reescriben con sesiones.
- El scrypt con N=16384 puede ser lento en CI/hardware débil: parámetros por
  env y verificados en la suite (tiempo acotado).
- QRs anónimos huérfanos: documentado; reclamación futura (admin).
- Origin check rompe clientes no-browser: los tests envían `Origin`; la web usa
  proxy (mismo origen) o CORS con credenciales.

## Criterios de aceptación

- usuario A no ve ni gestiona recursos de B (404);
- sesión revocable (logout) y contraseña segura (scrypt + policy);
- el frontend no guarda token (cookie HttpOnly) y las mutaciones verifican
  Origin;
- historial funciona (paginación, búsqueda, estado, duplicar, editar, eliminar);
- puerta de salida: auth, sessions, ownership, history, isolation tests,
  reporte.
