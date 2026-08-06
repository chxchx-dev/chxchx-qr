# Plan — Fase 08 · Analítica y Administración

> Fuente: `docs/phases/PHASE-08-ANALYTICS-ADMIN.md` · Plantilla: `docs/templates/PHASE-TEMPLATE.md`
> Estado: **PLANNED** — pendiente de decisiones del usuario antes de implementar.

## Objetivo

Registrar métricas mínimas de los QR dinámicos (sin degradar la redirección) y
controlar abuso con roles de administración auditados: evento de escaneo
no-bloqueante, agregados por día, panel por QR y moderación de
bloqueos/reportes.

## Alcance

- **Evento**: en cada `GET /r/{slug}` se captura QR, timestamp, hash diario del
  visitante, familia de dispositivo/UA, dominio del referrer, bot sí/no y
  request ID — **después** de decidir la respuesta (fire-and-forget; un fallo
  de analítica jamás rompe el redirect).
- **Privacidad**: `visitor_hash = HMAC(ip+UA, ANALYTICS_HMAC_SECRET_CURRENT)` con
  rotación diaria (nunca IP completa ni UA crudo persistido); bots separados
  (familia `bot`); retención cruda configurable (`ANALYTICS_RAW_RETENTION_DAYS`,
  default 90) con job de purga.
- **Agregación**: job idempotente que compacta `scan_events` → `scan_aggregates`
  (buckets de día, por QR y familia), reproducible (reprocessing sin duplicar:
  upsert con `UNIQUE (qr_id, day, family)`).
- **API**: `GET /api/v1/dynamic-qrs/{id}/analytics?from&to&granularity=hour|day|week`
  scoped por owner (aislamiento A/B como Fase 07); rango acotado (máx. 90 días);
  UTC interno, timezone del usuario solo para presentación (la web lo convierte).
- **UI**: `AnalyticsPage` en el dashboard (totales, serie temporal, desglose por
  dispositivo; países solo si se habilita la geolocalización) con disclaimer de
  "únicos estimados".
- **Administración**: endpoint público de reporte de abuso (QR + motivo),
  moderación (bloquear/desbloquear QR con `reason`), rol `admin` por tabla
  `admin_roles`, todas las acciones en `audit_events` con `actor_user_id`.
- **Migraciones**: `0007_create_scan_events`, `0008_create_scan_aggregates`,
  `0009_create_abuse_reports`, `0010_create_admin_roles` (+ `.down.sql`).

## Fuera de alcance

- fingerprinting y atribución publicitaria;
- geolocalización precisa (países queda deshabilitado por defecto);
- venta o exportación de datos personales;
- billing, equipos, SSO;
- analítica de QR estáticos (requieren rastreo, prohibido por docs/00);
- dashboard global de admin con métricas de plataforma (solo moderación).

## Decisiones pendientes (bloquean tareas 5-6)

1. **Bootstrap del primer admin**: ¿env `ADMIN_EMAILS` (lista en config) o script
   CLI `db:promote-admin`? (la Fase 07 no tiene mecanismo de roles aún).
2. **Reporte de abuso**: ¿público (sin sesión, con rate limit propio) o solo
   autenticado? El plan de fase dice "report endpoint" sin especificar.
3. **Países**: el doc de fase los deja "solo si habilitado" — ¿se incluye la
   columna `country` opcional en `scan_events` desde ya (sin geoactiva) o se
   aplaza la tabla completa?
4. **ADR**: ¿escribir `ADR-008-analytics-privacy` (hash diario, no IP/UA) y
   `ADR-009-admin-roles`? (cambio mayor según docs/13 §6: datos de usuarios).

## Archivos por crear

```text
packages/contracts/src/analytics.schema.ts
packages/contracts/src/admin.schema.ts
packages/contracts/test/analytics.schema.test.ts
packages/contracts/test/admin.schema.test.ts
apps/api/src/infrastructure/database/migrations/0007_create_scan_events.sql (+down)
apps/api/src/infrastructure/database/migrations/0008_create_scan_aggregates.sql (+down)
apps/api/src/infrastructure/database/migrations/0009_create_abuse_reports.sql (+down)
apps/api/src/infrastructure/database/migrations/0010_create_admin_roles.sql (+down)
apps/api/src/modules/analytics/visitor-hash.ts
apps/api/src/modules/analytics/bot-policy.ts
apps/api/src/modules/analytics/scan-event.ts
apps/api/src/modules/analytics/analytics.repository.ts
apps/api/src/modules/analytics/analytics.service.ts
apps/api/src/modules/analytics/analytics.errors.ts
apps/api/src/modules/analytics/analytics.controller.ts
apps/api/src/modules/analytics/analytics.routes.ts
apps/api/src/modules/analytics/aggregation.job.ts
apps/api/src/modules/admin/admin.middleware.ts
apps/api/src/modules/admin/abuse.repository.ts
apps/api/src/modules/admin/admin.service.ts
apps/api/src/modules/admin/admin.controller.ts
apps/api/src/modules/admin/admin.routes.ts
apps/api/test/analytics.test.ts
apps/api/test/admin.test.ts
apps/web/src/features/analytics/AnalyticsPage.tsx
apps/web/src/features/analytics/ScanSummary.tsx
apps/web/src/features/analytics/ScanSeriesChart.tsx
apps/web/src/features/analytics/DeviceBreakdown.tsx
apps/web/src/features/analytics/AnalyticsFilters.tsx
apps/web/src/features/analytics/analytics-api.client.ts
apps/web/src/features/admin/AdminDashboard.tsx
apps/web/src/features/admin/AbuseReportList.tsx
apps/web/src/features/admin/BlockQrDialog.tsx
apps/web/src/features/admin/UserStatusControl.tsx
apps/web/src/features/admin/admin-api.client.ts
docs/execution/PHASE-08-PLAN.md   (este archivo)
docs/execution/PHASE-08-REPORT.md (al cerrar)
docs/adr/ADR-008-analytics-privacy.md      (pendiente de decisión)
docs/adr/ADR-009-admin-roles.md            (pendiente de decisión)
```

## Archivos por modificar

```text
packages/config/src/api-config.ts        ANALYTICS_* (+ ADMIN_EMAILS si se decide) + tests
packages/config/test/api-config.test.ts
packages/contracts/src/error-codes.ts    códigos ANL_* / ADM_* / ABUSE_*
packages/contracts/src/index.ts          exportar analytics.schema y admin.schema
apps/api/src/app.ts                      montar /api/v1/dynamic-qrs/{id}/analytics y /api/v1/admin (solo con DB)
apps/api/src/modules/redirect/redirect.service.ts   hook no-bloqueante de scan-event (inyectable para tests)
apps/api/src/modules/redirect/redirect.routes.ts    wiring del hook
apps/web/src/app/routes.tsx              ruta /dashboard/:id/analytics y /admin
apps/web/src/app/App.tsx                 nav de admin condicional (rol)
apps/web/src/shared/lib/messages.ts      textos analítica/admin
apps/web/src/features/dashboard/QrList.tsx / QrDetailPage.tsx   enlace "Analítica"
.env.example y apps/api/.env.example     ANALYTICS_*
docs/05-API-CONTRACTS.md                 §12 analítica (contrato real) + §14 códigos
docs/06-DATA-MODEL.md                    tablas 0007-0010
docs/12-ENVIRONMENT-CONFIG.md            sección analítica/admin (vars ya anticipadas en §8)
docs/13-DECISIONS-AND-RISKS.md           matriz: privacidad de analítica, inflación de bots
docs/phases/PHASE-08-ANALYTICS-ADMIN.md  checklist de la puerta de salida ✅
```

## Orden de tareas

1. Decisiones del usuario (bootstrap admin, reporte público, países, ADRs).
2. Contracts y códigos `ANL_*`/`ADM_*`/`ABUSE_*` (+tests).
3. Config `ANALYTICS_*` (+tests).
4. Migraciones 0007–0010.
5. Módulo analytics: `visitor-hash` (rotación diaria), `bot-policy`, repositorio,
   servicio (escritura fire-and-forget), controlador, rutas, job de agregación
   (idempotente, reprocessing, purga por retención).
6. Hook no-bloqueante en el redirect (inyectable; test: fallo de analítica no
   rompe el 302).
7. Módulo admin: middleware de rol, reporte de abuso, block/unblock con `reason`,
   auditoría en `audit_events`.
8. Wiring (`app.ts`), contratos y docs de API.
9. Tests API (analytics, admin, redirect con analítica, aislamiento owner,
   retención).
10. Web: AnalyticsPage (totales/series/dispositivos + disclaimer), AdminDashboard,
    rutas y nav.
11. CI/env examples/docs + ADRs (si se deciden).
12. Gates: biome, typecheck, tests, build, revisión + reporte.

## Pruebas

- **Contracts**: esquemas de analytics (rango, granularidad, timezone de
  presentación) y admin (reporte de abuso, block/unblock, reason requerido).
- **Config**: defaults de `ANALYTICS_*`, secreto HMAC requerido si
  `ANALYTICS_ENABLED=true`, retención válida.
- **API (Postgres real)**: fallo de analítica no degrada el redirect (302 igual);
  hash rota a diario (mismo visitante → hashes distintos entre días); bots
  separados de humanos; evento duplicado no infla agregados (upsert idempotente);
  agregación reproducible; rango/granularidad validados; **owner only** (A no ve
  analítica de B); admin role (no-admin → 403); acciones de admin auditadas;
  QR bloqueado deja de redirigir (y el reporte queda con estado resuelto).
- **Web**: unit tests de `analytics-api.client` y `admin-api.client`.
- **Rendimiento (puerta de salida)**: latencia de redirect con analítica
  habilitada vs sin ella (objetivo: degradación < 5 % en local; evento
  asíncrono sin await en el camino crítico).

## Riesgos

- Analítica bloqueando el redirect → mitigado por diseño (fire-and-forget, sin
  espera en el camino crítico; test dedicado).
- Privacidad (IP/UA persistidos) → hash diario + rotación + retención; nunca IP
  completa ni UA crudo en crudo; revisión de docs/07.
- Inflación de bots → bot-policy + separación de familias.
- Deriva de agregados → job idempotente con upsert y reprocessing.
- Admin mal configurado (sin rol inicial) → decisión 1 (bootstrap) resuelta
  antes de implementar; auditoría de toda acción.
- Crecimiento de `scan_events` → agregación diaria + purga por retención +
  índices por (qr_id, day).

## Criterios de aceptación

- la latencia del redirect no se degrada con analítica habilitada;
- la privacidad está documentada (ADR si aplica) y el hash rota a diario;
- el panel muestra totales, series y dispositivos con disclaimer de únicos;
- las acciones de admin están auditadas con `actor_user_id` y `reason`;
- la retención funciona (job de purga) y los agregados no se duplican;
- puerta de salida: events, aggregation, UI, privacy, admin, load tests, reporte.
