# Fase 08 — Analítica y Administración

## Objetivo

Registrar métricas mínimas de QR dinámicos y controlar abuso.

## Resultado

Panel por QR, agregados, filtros básicos y administración de bloqueos/reportes.

## Fuera de alcance

- fingerprinting;
- venta de datos;
- geolocalización precisa;
- atribución publicitaria;
- billing.

## Archivos

```text
apps/api/src/infrastructure/database/migrations/
├─ 0007_create_scan_events.sql
├─ 0008_create_scan_aggregates.sql
├─ 0009_create_abuse_reports.sql
└─ 0010_create_admin_roles.sql

apps/api/src/modules/analytics/
├─ analytics.service.ts
├─ analytics.repository.ts
├─ analytics.routes.ts
├─ scan-event.ts
├─ visitor-hash.ts
├─ bot-policy.ts
└─ aggregation.job.ts

apps/api/src/modules/admin/
├─ admin.routes.ts
├─ admin.middleware.ts
├─ admin.service.ts
├─ abuse.repository.ts
└─ admin-audit.ts

apps/web/src/features/analytics/
├─ AnalyticsPage.tsx
├─ ScanSummary.tsx
├─ ScanSeriesChart.tsx
├─ DeviceBreakdown.tsx
└─ AnalyticsFilters.tsx

apps/web/src/features/admin/
├─ AdminDashboard.tsx
├─ AbuseReportList.tsx
├─ BlockQrDialog.tsx
└─ UserStatusControl.tsx
```

## Reglas

- redirect primero;
- evento después o no bloqueante;
- si analítica falla, redirect continúa;
- hash diario;
- no IP completa persistente;
- no user-agent bruto indefinido;
- bots separados;
- admin con auditoría.

## Tareas

### 1. Evento

Capturar mínimo:

- QR;
- timestamp;
- hash;
- familias;
- referrer domain;
- bot;
- request ID.

### 2. Aggregation

- job idempotente;
- day buckets;
- reprocessing;
- retention;
- índices.

### 3. API

- rango limitado;
- granularidad;
- timezone del usuario para presentación;
- UTC interno;
- autorización.

### 4. UI

- totales;
- series;
- dispositivos;
- países solo si habilitado;
- disclaimer de únicos estimados.

### 5. Abuse

- report endpoint;
- moderation;
- block;
- unblock;
- audit;
- reason.

## Pruebas

- analytics failure no rompe redirect;
- hash rota;
- bot;
- duplicate event behavior;
- aggregation;
- timezone;
- owner only;
- admin role;
- audit;
- blocked QR.

## Criterios de aceptación

- latencia redirect no se degrada;
- privacidad documentada;
- panel coherente;
- admin actions auditadas;
- retención funciona.

## Puerta de salida

- [ ] events
- [ ] aggregation
- [ ] UI
- [ ] privacy
- [ ] admin
- [ ] load tests
- [ ] reporte
