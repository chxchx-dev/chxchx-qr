# ADR-001 — Monorepo TypeScript con npm workspaces

## Estado

`accepted`

## Fecha

2026-08-05

## Contexto

El proyecto necesita compartir contratos (Zod), motor QR, configuración y fixtures entre dos aplicaciones (web y API) sin publicar paquetes a un registro. La decisión debe tomarse ahora porque define la estructura del repositorio desde la Fase 01.

## Fuerzas

- simplicidad: un solo lockfile, un solo `npm ci`;
- mantenimiento: contratos en un único lugar, sin duplicación web/API;
- compatibilidad: TypeScript estricto y ESM en todo el monorepo;
- costo: cero infraestructura de registro privado;
- equipo: un repositorio, revisión y CI únicos.

## Opciones

### Opción A — Monorepo con npm workspaces

Ventajas: un lockfile; `apps/*` y `packages/*` en una raíz; exports explícitos; CI único; el motor QR se comparte sin publicación.
Desventajas: requiere disciplina para no usar imports relativos entre workspaces; el build debe ordenar dependencias.
Riesgos: acoplamiento accidental entre paquetes — mitigado con exports explícitos y prohibición de imports relativos entre workspaces.

### Opción B — Multi-repositorio con paquetes publicados

Ventajas: versionado independiente por paquete.
Desventajas: publicación al registro, más CI, más fricción para cambios transversales; contradice el objetivo de bajo coste y pocas dependencias.
Riesgos: divergencia entre versiones de contrato web/API — alto, y precisamente lo que se quiere evitar.

### Opción C — Repositorio único sin workspaces (todo en una raíz plana)

Ventajas: estructura simple inicial.
Desventajas: sin fronteras de paquete; los contratos tienden a duplicarse; imposible impedir que la web importe el servidor.
Riesgos: deuda de arquitectura temprana; migración costosa después.

## Decisión

**Opción A.** Monorepo TypeScript con npm workspaces: `apps/web`, `apps/api` y `packages/contracts`, `packages/qr-core`, `packages/config`, `packages/test-fixtures`. Imports entre workspaces solo vía exports explícitos; prohibidos los imports relativos entre workspaces.

## Consecuencias positivas

- un solo lockfile y una sola cadena de CI;
- contratos compartidos con Zod sin duplicación web/API;
- el motor `qr-core` es la única vía de generación QR;
- releases atómicos de contrato + código.

## Consecuencias negativas

- requiere disciplina de límites entre paquetes;
- el build necesita orden de dependencias correcto;
- cualquier paquete nuevo debe justificarse (no fragmentar por fragmentar).

## Riesgos y controles

- acoplamiento accidental → exports explícitos + regla global 02 (prohibir imports relativos entre workspaces);
- duplicación de DTO → paquete `contracts` como única fuente;
- dependencia circular entre paquetes → revisión en CI.

## Plan de implementación

1. Fase 01: crear estructura `apps/`, `packages/`, `tsconfig.base.json`, `package.json` raíz con workspaces.
2. Crear `packages/contracts` con esquemas Zod y tipos compartidos.
3. Configurar CI para `npm ci` + gates sobre la raíz.

## Plan de salida

Si el monorepo dejara de aportar (p. ej., se necesitara publicar contratos a consumidores externos), se extraerían paquetes con versión propia manteniendo los límites actuales. Se requiere ADR nuevo.

## Referencias

- `docs/02-ARCHITECTURE.md` §1 y §4.
- `docs/13-DECISIONS-AND-RISKS.md` ADR-001.
- `docs/phases/PHASE-01-FOUNDATION.md`.
