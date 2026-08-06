# Plan de Fase 01 — Fundación del Monorepo

## Objetivo

Crear una base reproducible, estricta y verificable: el repositorio instala, compila, prueba y construye aplicaciones vacías desde una única raíz, sin implementar todavía el producto.

## Alcance

- monorepo npm workspaces (`apps/*`, `packages/*`);
- TypeScript estricto compartido;
- API Express 5 con health, request ID, error handler y graceful shutdown;
- web React + Vite + Tailwind 4 con shell accesible y error boundary;
- paquete de configuración Zod (api y web) con fallo temprano;
- Docker multi-stage no-root y Compose local;
- CI con gates completos.

## Fuera de alcance

- generación QR funcional (Fase 02);
- base de datos (Fase 06);
- archivos (Fase 05);
- autenticación (Fase 07);
- analítica (Fase 08);
- componentes definitivos del generador (Fase 03);
- cualquier endpoint de negocio (`/api/v1/qr/*` es Fase 02).

## Confirmaciones técnicas (desde Fase 00 y docs maestros)

- Node.js 24 LTS (`.nvmrc`); compatible con Node >= 20.19 (local).
- Express 5; React 19 + Vite 7; Tailwind CSS 4; Zod 4; Biome 2; Vitest.
- Motor `qr` NO se instala todavía: `qr-core` queda con export vacío controlado.
- Límite de producto `QR_MAX_TEXT_LENGTH=500` (decisión MVP) prevalece sobre el valor ilustrativo 2000 del doc 12 (la regla "los límites de producto deben ser menores o iguales a la capacidad técnica" lo respalda).
- Nombre del producto: `acore-qr` (reemplaza "QR Studio" en env públicos).

## Archivos por crear

### Raíz

| Ruta | Responsabilidad |
|---|---|
| `package.json` | workspaces y scripts raíz |
| `package-lock.json` | lockfile único (generado) |
| `tsconfig.base.json` | strict mode compartido |
| `biome.json` | formato y lint |
| `.editorconfig` | estilo base del editor |
| `.gitignore` | exclusiones |
| `.nvmrc` | versión Node (24) |
| `.env.example` | catálogo no secreto |
| `.dockerignore` | contexto de imágenes |
| `Dockerfile.api` | imagen API multi-stage |
| `Dockerfile.web` | imagen web multi-stage |
| `compose.yaml` | ejecución local |
| `.github/workflows/ci.yml` | gates CI |

### apps/api

| Ruta | Responsabilidad |
|---|---|
| `apps/api/src/app.ts` | construir Express sin escuchar |
| `apps/api/src/server.ts` | lifecycle HTTP y shutdown |
| `apps/api/src/errors.ts` | 404 y error handler (Problem Details) |
| `apps/api/src/routes/health.routes.ts` | live/ready |
| `apps/api/test/app.test.ts` | health, request ID, 404, shutdown |
| `apps/api/package.json` / `tsconfig.json` | metadata y compilación |

### apps/web

| Ruta | Responsabilidad |
|---|---|
| `apps/web/src/app/main.tsx` | montaje React |
| `apps/web/src/app/App.tsx` | shell accesible |
| `apps/web/src/app/ErrorBoundary.tsx` | límite de errores |
| `apps/web/src/styles/index.css` | Tailwind 4 + tokens dark-first |
| `apps/web/index.html` | documento base |
| `apps/web/package.json` / `tsconfig.json` / `vite.config.ts` | metadata, TS, build |
| `apps/web/.env.example` | vars públicas |

### packages

| Ruta | Responsabilidad |
|---|---|
| `packages/config/src/api-config.ts` | validación env API (Zod) |
| `packages/config/src/web-config.ts` | validación env pública |
| `packages/config/test/*.test.ts` | config válida/inválida |
| `packages/contracts/src/index.ts` | export vacío controlado |
| `packages/qr-core/src/index.ts` | export vacío controlado (motor en Fase 02) |
| `packages/test-fixtures/src/index.ts` | export vacío controlado (vectores en Fase 02) |
| `infra/docker/web/serve.mjs` | servidor estático no-root para la imagen web |

Cada paquete incluye `package.json` y `tsconfig.json`.

## Archivos por modificar

Ninguno (la documentación maestra no se toca en esta fase).

## Orden de tareas

1. Escribir el plan de fase.
2. Configuración raíz y `.nvmrc`.
3. Paquetes compartidos (config con tests primero).
4. API con health y pruebas.
5. Web con shell y error boundary.
6. Docker y Compose.
7. CI.
8. Instalación y verificación de gates.
9. Smoke de Docker/Compose.
10. Revisión y reporte de cierre.

## Pruebas

| Comando | Cubre |
|---|---|
| `npm run format:check` | formato Biome |
| `npm run lint` | lint Biome |
| `npm run typecheck` | TS estricto en todo el monorepo |
| `npm run test` | config válida; config inválida falla; health live 200; ready 200; 404; request ID; shutdown |
| `npm run build` | build web y build API |
| `docker build` | imágenes API y web |
| `docker compose up` | compose inicia y health responde |

## Riesgos

| Riesgo | Control |
|---|---|
| Versiones incompatibles de stack | rangos caret conocidos + lockfile + verificación con Node 24 |
| Imports entre workspaces acoplados | exports explícitos por paquete, build ordenado (packages → apps) |
| Biome 2 cambia esquema de config | generar config con `biome init` y ajustar |
| Node local 20 vs objetivo 24 | gates con nvm 24; engines >= 20.19 para máquinas de desarrollo |
| Docker no disponible o daemon apagado | smoke condicional; el resto de gates no dependen de Docker |

## Criterios de aceptación

- [ ] `npm ci` funciona desde una raíz limpia;
- [ ] no hay warnings críticos;
- [ ] todos los scripts raíz funcionan;
- [ ] `docker build` de API y web funciona;
- [ ] `compose` inicia y `/health/live` responde;
- [ ] no hay negocio adelantado (sin endpoints QR, sin DB).
