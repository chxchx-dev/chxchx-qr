# 13 — Decisiones y Riesgos

## 1. ADR iniciales

### ADR-001 — Monorepo TypeScript

**Decisión:** npm workspaces con apps y packages.

**Motivo:** compartir contratos y motor sin publicar paquetes.

### ADR-002 — Un único encoder QR

**Decisión:** encapsular `qr` en `packages/qr-core`.

**Motivo:** evitar divergencia frontend/backend.

### ADR-003 — Archivos mediante URL

**Decisión:** almacenar archivo y codificar URL.

**Motivo:** capacidad QR insuficiente y seguridad.

### ADR-004 — Sin DB para estáticos

**Decisión:** introducir PostgreSQL en QR dinámicos.

**Motivo:** menor complejidad y costo inicial.

### ADR-005 — Sesiones opacas

**Decisión:** cookie HttpOnly y sesión persistida.

**Motivo:** revocación, menor exposición en navegador y control.

### ADR-006 — SQL explícito

**Decisión:** `pg` y migraciones SQL.

**Motivo:** dependencias mínimas y consultas visibles.

### ADR-007 — `sharp` como único procesador gráfico

**Decisión:** usarlo solo para PNG y logos.

**Motivo:** consolidar rasterizado y sanitización.

## 2. Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Control |
|---|---:|---:|---|
| QR personalizado no escanea | Alta | Alta | límites + round-trip |
| Archivos usados para malware | Alta | Crítico | allowlist + re-encode + AV |
| Dominio usado para phishing | Alta | Crítico | abuso + bloqueo + límites |
| Dos motores generan distinto | Media | Alta | motor único |
| Payload supera capacidad | Alta | Media | validación + enlace |
| PNG consume CPU | Media | Alta | límites + cache + rate |
| Redirección cae por analítica | Media | Crítico | analítica no bloqueante |
| Pérdida de destino | Baja | Crítico | backup + DB |
| Fuga de secretos | Media | Crítico | env + secret scan |
| Dependencia vulnerable | Media | Alta | audit + pin + updates |
| Costos de storage | Media | Media | TTL + límites |
| Privacidad excesiva | Media | Alta | hashes rotativos |
| Migración bloquea tabla | Baja | Alta | expand/contract |

## 3. Deuda permitida por fase

Permitida solo si:

- no afecta seguridad;
- no rompe contrato;
- está registrada;
- tiene condición de resolución;
- no se usa para cerrar trabajo incompleto.

No se acepta como deuda:

- test roto;
- validación omitida;
- secreto temporal;
- upload sin cleanup;
- acceso sin autorización;
- TODO crítico.

## 4. Formato ADR

Ruta:

```text
docs/adr/ADR-XXX-title.md
```

Contenido:

```md
# Contexto
# Fuerzas
# Opciones
# Decisión
# Consecuencias
# Plan de migración
# Fecha y estado
```

Estados:

```text
proposed
accepted
superseded
deprecated
rejected
```

## 5. Revisión de riesgos

Se revisa:

- al cerrar fase;
- antes de producción;
- al habilitar upload;
- al habilitar dinámicos;
- después de incidente;
- al añadir una dependencia crítica.
