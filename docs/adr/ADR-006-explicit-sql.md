# ADR-006 — SQL explícito con `pg`

## Contexto

La Fase 06 introduce PostgreSQL. Hay que decidir cómo se accede a los datos.

## Fuerzas

- política de dependencias: mínimas, con propósito;
- consultas visibles y auditable, sin "magia";
- control fino de concurrencia (`version`, `ON CONFLICT`, `FOR UPDATE`);
- migraciones SQL versionadas, no generadas por una herramienta.

## Opciones

- **`pg` + SQL explícito**: consultas parameterizadas visibles en el repo.
- **ORM** (Prisma, Drizzle, Knex): generación de tipos y query builder, pero
  superficie extra, migraciones propias y abstracciones que ocultan SQL.

## Decisión

Usar **`pg` con SQL explícito** y migraciones `.sql` propias. Sin ORM.

## Consecuencias

- cada consulta vive en `dynamic-qr.sql.ts` con parámetros `$1, $2…` (no se
  concatena entrada del usuario: sin inyección);
- el runner de migraciones es propio y pequeño (`migrate.ts`);
- si el dominio crece y el coste supera el beneficio, se evalúa ORM con ADR.

## Fecha y estado

2026-08-06 · accepted
