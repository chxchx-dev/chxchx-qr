# PHASE-08-REPORT — Analítica y Administración (cerrada)

> Estado: **DONE** · Fecha: 2026-08-06 · Fuente: `docs/phases/PHASE-08-ANALYTICS-ADMIN.md` · Plan: `PHASE-08-PLAN.md` · ADR: no (decisión 4 del plan)

## Resumen

La Fase 08 añade **analítica mínima de clics** a los QR dinámicos (sin degradar la redirección) y **moderación de abuso** con rol de administración auditado. Cada `GET /r/{slug}` registra un evento **fire-and-forget** (nunca bloquea el 302): visitor hash **HMAC diario** (IP+UA entran solo en el hash, nunca se persisten crudos; rota cada día UTC), familia de dispositivo/UA, bot sí/no (separados del recuento de únicos), dominio del referrer y request ID. Un job idempotente compacta `scan_events` → `scan_aggregates` (upsert por `(qr_id, day, device_family)`, reprocessing de días pendientes, purga por `ANALYTICS_RAW_RETENTION_DAYS`). El endpoint `GET /api/v1/dynamic-qrs/{id}/analytics` queda scoped por owner (aislamiento A/B como Fase 07) con rangos acotados y granularidad hour/day/week. En administración: reporte de abuso **público** (rate limit propio, motivo mínimo validado, IP solo hasheada), cola de moderación paginada/filtrable, block/unblock de QR y usuarios con `reason`, rol `admin` por tabla `admin_roles` (bootstrap por **SQL manual**, decisión del usuario) y toda acción auditada en `audit_events` con `actor_user_id` + `request_id`. La web gana la `AnalyticsPage` (totales con disclaimer de únicos estimados, serie temporal SVG, desglose por dispositivo, filtros) y el `AdminDashboard` (reportes + bloqueos). La columna `country` existe en `scan_events` desde ya, siempre NULL (geolocalización inactiva, sin migrar después).

## Puerta de salida

| Criterio | Estado |
|---|---|
| Contracts `ANL_*`/`ADM_*`/`ABUSE_*` + esquemas | ✅ `analytics.schema.ts` (rango ≤ 90 días, granularidad, formato de fecha UTC) y `admin.schema.ts` (reporte público, razón 5–500, paginación) + tests |
| Config `ANALYTICS_*` | ✅ `ANALYTICS_ENABLED`, `ANALYTICS_HMAC_SECRET_CURRENT/PREVIOUS` (obligatorio si enabled), `ANALYTICS_RAW_RETENTION_DAYS`, `ANALYTICS_AGGREGATION_INTERVAL_MINUTES`, `RATE_LIMIT_ABUSE_REPORT_PER_HOUR` + tests |
| Migraciones 0007–0010 | ✅ `scan_events` (con `country` NULL, índice `(qr_id, scanned_at)`), `scan_aggregates` (UNIQUE `(qr_id, day, device_family)`), `abuse_reports`, `admin_roles` (up + down) |
| Privacidad | ✅ `visitor_hash = HMAC(day\|ip\|ua, secret)` con rotación diaria; nunca IP completa ni UA crudo; bots sin hash (no inflan únicos); retención cruda con purga |
| Hook no-bloqueante en redirect | ✅ recorder fire-and-forget tras decidir el 302; test: fallo de analítica no rompe el redirect |
| Agregación idempotente | ✅ upsert por día/familia, reprocessing de días faltantes (backfill acotado por retención), hoy siempre reprocesado; test de no-duplicación |
| Endpoint analytics | ✅ scoped por owner (`404 DQR_NOT_FOUND` en ajeno), rango/granularidad validados, serie horaria solo en rangos cortos |
| Módulo admin | ✅ middleware de rol (403 `ADM_FORBIDDEN`), reporte público, cola, block/unblock QR y usuarios (bloqueo de usuario revoca sesiones), auditoría `actor_user_id` + `reason` + `request_id` |
| Wiring | ✅ `app.ts` monta analytics (anidada en dynamic-qrs) y `/api/v1/admin` solo con DB; `server.ts` arranca el job de agregación si `ANALYTICS_ENABLED` |
| Web | ✅ AnalyticsPage (totales/serie/dispositivos/filtros + disclaimer), AdminDashboard (reportes, bloqueos, estado de usuario), enlace "Analítica" en el detalle, nav admin condicional, rutas |
| CI / env / docs | ✅ `.env.example` (raíz y `apps/api`), 05-API-CONTRACTS (§12 analítica + §admin), 06-DATA-MODEL (tablas 0007-0010), 12-ENVIRONMENT-CONFIG, 13-DECISIONS-AND-RISKS, checklist de fase ✅ |
| Reporte | ✅ este archivo |

## Evidencia verificable

| Gate | Resultado |
|---|---|
| lint / format / typecheck | ✅ Biome limpio (260 archivos, 0 errores); TS estricto 0 errores en los 6 workspaces |
| tests | ✅ **286/286** — API **121** (12 archivos) + web 38 (5) + contracts 45 (5) + config 16 (2) + qr-core 66 (11) |
| build | ✅ `tsc` API (migraciones a `dist`) + Vite web (4.3 s) |
| smoke end-to-end (binario `dist/server.js`, Postgres real) | ✅ migraciones 0001–0010 al arranque; register 201 + cookie; 2 redirects + 1 bot UA → evento; agregación con intervalo 1 min → `GET /{id}/analytics` devuelve `scans: 3, estimatedUnique: 2` (el bot no cuenta como único), serie con bucket del día, dispositivos separados; reporte de abuso 201; block → 404 en `GET /r/{slug}`; unblock → 302; latencia de redirect con analítica activa **avg 2.75 ms** (degradación < 5 %) |

## Decisiones clave (con evidencia)

- **Bootstrap del admin por SQL manual** (decisión 1): no hay mecanismo en producto ni CLI; `admin.middleware` solo consulta `admin_roles`. La verificación de rol se cachea por request y se audita cada acción.
- **Reporte de abuso público** (decisión 2): sin sesión; rate limit por IP (`RATE_LIMIT_ABUSE_REPORT_PER_HOUR`, token bucket en memoria como el resto); motivo 5–500 caracteres; la IP del reportero se guarda **solo hasheada** (`sha256(ip)`) igual que las sesiones.
- **País inactivo desde ya** (decisión 3): columna `country` nullable en `scan_events`, siempre NULL, sin geolocalización; evita migración futura.
- **Sin ADR** (decisión 4): privacidad y roles documentados en este reporte y en `docs/13`.
- **Privacidad del visitor hash**: `HMAC-SHA256(secret, dayKey|ip|ua)` con `dayKey = YYYY-MM-DD` UTC; rota diario (mismo visitante → hash distinto entre días, test). `HMAC_SECRET_PREVIOUS` valida el día anterior durante la rotación. Bots (`bot-policy`: UA conocido / `headless`) → `visitor_hash = NULL` y familia `bot`.
- **No-bloqueante por diseño**: el recorder clasifica y hashea de forma síncrona barata y dispara el `INSERT` sin esperarlo (`.catch` con warn); un error de analítica jamás altera el 302 (test dedicado).
- **Agregación idempotente y reproducible**: `upsertDaily` recomputa un día completo desde `scan_events` (misma consulta → mismo resultado; nunca duplica), el job reprocesa días faltantes y siempre hoy; la purga por retención evita crecimiento infinito.
- **Timezone fijado en el pool**: `options: "-c timezone=UTC"` para que los buckets (`date_trunc`/`to_char`) y las fronteras de día sean independientes del TZ del servidor PG (hallazgo del revisor aplicado).
- **Aislamiento por owner**: el endpoint de analítica exige sesión + `findById(..., ownerUserId)` → `404` en ajeno, igual que la gestión de QRs.
- **Bloqueo de usuario = revocación de sesiones**: `admin.block_user` revoca todas las sesiones activas del usuario (cierra la puerta a abuso continuado).

## Hallazgos del revisor aplicados

- 🟥 **ALTA — timezone de los buckets de analítica**: el pool no fijaba UTC, así que `date_trunc`/`to_char` y las fronteras de día dependían del TZ de la sesión PG (los eventos se hashean con `toISOString()` UTC pero se agrupaban en local). **Fix**: `options: "-c timezone=UTC"` en `createDatabase` (pool.ts). Sin migración (buckets de datos aún no producidos en producción).
- 🟠 **MEDIA — backfill de agregación sin límite**: el job podía reprocesar días históricos indefinidamente si un ciclo fallaba. **Fix**: el reprocessing se acota a la ventana de retención (`missingHistoricalDays` filtra por `retentionDays` y solo hasta ayer; hoy siempre se reprocesa).
- 🟠 **MEDIA — auditoría admin no atómica**: el insert de auditoría ocurre tras la acción y, si falla, solo avisa (`console.warn`), igual que el patrón de dynamic-qrs. Se mantiene el patrón del codebase (await + warn) y se registra en deuda: convertir la acción+auditoría en transacción si se endurece el requisito.
- 🟠 **MEDIA — `request_id` hardcodeado**: el reporte de abuso usaba un request ID fijo. **Fix**: `requestIdOf(res)` lee el header `x-request-id` real (o `undefined`); se persiste en `abuse_reports.request_id` y en la auditoría admin.

## Deuda aceptada (documentada)

| Deuda | Condición de resolución |
|---|---|
| Auditoría admin no atómica con la acción (warn en fallo, patrón dynamic-qrs) | Endurecer a transacción si se exige auditoría garantizada (solo-modernización) |
| Sesiones expiradas sin job de limpieza (heredada de Fase 07) | Job periódico tipo `file-cleanup` |
| Rate limit por proceso (token bucket en memoria) | Fase multi-proceso / Redis (documentado en `docs/12`) |
| `country` siempre NULL (geolocalización inactiva) | Fase futura de geolocalización (columna ya lista) |
| Sin analítica de QR estáticos (requiere rastreo, prohibido) | No planificada |
| Dashboard global de admin con métricas de plataforma | Fase futura (hoy solo moderación) |

## Archivos clave

- **Nuevo (API)**: `src/modules/analytics/{visitor-hash,bot-policy,scan-event,ids,analytics.sql,analytics.repository,analytics.service,analytics.errors,analytics.controller,analytics.routes,aggregation.job}.ts`; `src/modules/admin/{admin.middleware,abuse.repository,admin.service,admin.errors,admin.controller,admin.routes}.ts`; migraciones `0007_create_scan_events`, `0008_create_scan_aggregates`, `0009_create_abuse_reports`, `0010_create_admin_roles` (+ `.down.sql`).
- **Modificado (API)**: `app.ts` (monta analytics/admin con DB), `server.ts` (job de agregación), `modules/redirect/redirect.{service,controller,routes}.ts` (hook no-bloqueante + `qrId` en la resolución), `modules/dynamic-qrs/dynamic-qr.service.ts` (qrId en RedirectResolution), `infrastructure/database/pool.ts` (timezone UTC).
- **Contratos**: `analytics.schema.ts`, `admin.schema.ts` (+ tests), `error-codes.ts` (`ANL_*`, `ADM_*`, `ABUSE_*`), `index.ts`.
- **Config**: `api-config.ts` (`ANALYTICS_*`, `RATE_LIMIT_ABUSE_REPORT_PER_HOUR`) + tests.
- **Web**: `features/analytics/{AnalyticsPage,ScanSummary,ScanSeriesChart,DeviceBreakdown,AnalyticsFilters,analytics-api.client}.ts(x)`, `features/admin/{AdminDashboard,AbuseReportList,BlockQrDialog,UserStatusControl,admin-api.client}.ts(x)`, `app/{routes,App}.tsx`, `features/dashboard/QrDetailPage.tsx` (enlace Analítica), `shared/lib/messages.ts`, `test/phase08-clients.test.ts`.
- **Tests**: `test/analytics.test.ts`, `test/admin.test.ts`, `test/migrations.test.ts` (0007-0010), `test/db-helpers.ts` (deadlock-retry en TRUNCATE).
- **Env/docs**: `.env.example` (raíz y `apps/api`), `05-API-CONTRACTS.md`, `06-DATA-MODEL.md`, `12-ENVIRONMENT-CONFIG.md`, `13-DECISIONS-AND-RISKS.md`, `PHASE-08-ANALYTICS-ADMIN.md` (checklist ✅).

## Próximo paso permitido

**Fase 09 — Endurecimiento y release** (`docs/phases/PHASE-09-HARDENING-RELEASE.md`): checklist de release (deuda de Fase 07-08 candidata: limpieza de sesiones), hardening operativo y empaquetado. Plan previo obligatorio (`docs/execution/PHASE-09-PLAN.md`) antes de implementar.
