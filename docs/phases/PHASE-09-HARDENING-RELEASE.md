# Fase 09 — Hardening y Lanzamiento

## Objetivo

Convertir el sistema en una versión operable, observable y reversible.

## Resultado

Release de producción con seguridad, backups, alertas, documentación y rollback.

## Fuera de alcance

Cualquier feature nueva.

## Archivos

```text
infra/
├─ docker/
├─ nginx/
│  └─ nginx.conf
├─ monitoring/
│  ├─ dashboards/
│  └─ alerts/
└─ scripts/
   ├─ smoke-test.sh
   ├─ backup.sh
   └─ restore-test.sh

docs/operations/
├─ RUNBOOK.md
├─ DEPLOYMENT.md
├─ ROLLBACK.md
├─ BACKUP-RESTORE.md
├─ INCIDENT-RESPONSE.md
├─ ABUSE-HANDLING.md
└─ ONCALL-CHECKLIST.md

docs/security/
├─ THREAT-MODEL.md
├─ DATA-RETENTION.md
├─ SECURITY-HEADERS.md
└─ DEPENDENCY-REVIEW.md
```

## Tareas

### 1. Seguridad

- headers;
- TLS;
- CORS;
- cookies;
- body limits;
- rate limits;
- dependency audit;
- secret scan;
- image scan;
- upload review;
- auth review;
- authorization review.

### 2. Rendimiento

- load generation;
- load redirect;
- PNG;
- DB pool;
- storage;
- mobile bundle;
- caching.

### 3. Observabilidad

- logs;
- metrics;
- dashboards;
- alerts;
- correlation;
- health.

### 4. Datos

- migrations staging;
- backup;
- restore;
- retention;
- cleanup;
- indexes.

### 5. UX

- browser matrix;
- a11y;
- copy;
- errors;
- privacy;
- legal;
- abuse.

### 6. Release

- version;
- changelog;
- SBOM;
- artifacts;
- staging;
- smoke;
- production;
- smoke;
- rollback rehearsal.

## Pruebas obligatorias

- E2E completo;
- load;
- security;
- backup/restore;
- rollback;
- failure injection;
- DB outage;
- storage outage;
- analytics outage;
- disk temp full;
- SIGTERM;
- cert.

## Criterios de aceptación

- cero vulnerabilidades críticas conocidas;
- backup restaurado;
- rollback probado;
- alertas disparan;
- runbook usable;
- SLO medido;
- aprobación de seguridad;
- release checklist completa.

## Puerta de salida

- [ ] seguridad
- [ ] performance
- [ ] observabilidad
- [ ] backup/restore
- [ ] rollback
- [ ] legal/privacidad
- [ ] release tag
- [ ] reporte final
