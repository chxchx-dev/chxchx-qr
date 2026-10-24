# ADR-004 — PostgreSQL para QR dinámicos
> **Registro histórico:** la función de este ADR está fuera del alcance vigente desde ADR-009. Se conserva como antecedente, no como guía de implementación actual.

## Contexto

El generador estático no persiste nada (ADR de Fase 02: sin DB). Los QR dinámicos
requieren estado: slug → destino editable, pausa, expiración, idempotencia y
auditoría. Sin persistencia no hay "cambiar el destino sin regenerar el QR".

## Fuerzas

- mínimo coste operativo en la fase actual;
- migraciones reproducibles y reversibles;
- concurrencia y consistencia (versión/ETag, idempotencia);
- el equipo ya conoce SQL; no añadir magia.

## Opciones

- **PostgreSQL**: SQL estándar, transacciones, `ON CONFLICT`, `FOR UPDATE`,
  migraciones auditables, servicio local y en CI ya disponible.
- **SQLite**: sin servidor, ideal para prototipos, pero concurrencia limitada y
  divergencia con el objetivo de producción.
- **Base de datos como servicio** (mongo, document DB): coste y superficie extra
  sin beneficio para un modelo relacional simple.

## Decisión

Usar **PostgreSQL** con `pg` y SQL explícito. Se acepta desde la Fase 06
(QR dinámicos) y queda bloqueado para el generador estático.

## Consecuencias

- el server arranca con `DATABASE_URL` y aplica migraciones (advisory lock);
- `/health/ready` reporta el estado de la DB cuando está habilitada;
- los tests usan una DB dedicada (`acore_qr_test`) migrada por el propio runner;
- la DB entra solo si `DYNAMIC_QR_ENABLED=true`; el resto del sistema sigue sin
  depender de ella.

## Plan de migración

- 0001: `dynamic_qrs` (slug único, versión, estado, expiración);
- 0002: `idempotency_keys` (replay de mutaciones);
- 0003: `audit_events` (rastro no bloqueante de mutaciones).

## Fecha y estado

2026-08-06 · accepted
