# ADR-001 — Monorepo TypeScript con npm workspaces

## Estado

Aceptado.

## Decisión

Mantener `apps/web`, `apps/api` y los paquetes compartidos `packages/contracts`, `packages/qr-core` y `packages/config` en un monorepo TypeScript con npm workspaces.

## Motivo

Un lockfile y una sola instalación permiten compartir esquemas sin duplicarlos ni publicar paquetes a un registro. Las aplicaciones consumen paquetes por sus exports públicos.

## Consecuencias

- La raíz controla instalación, CI y scripts de calidad.
- El build compila primero contratos y paquetes compartidos.
- Los paquetes nuevos se justifican por una frontera real; no se crean paquetes vacíos.
