# Fase 01 — Fundación del Monorepo

> Registro histórico: la ejecución con Docker que describe esta fase fue
> retirada por [ADR-008](../adr/ADR-008-no-docker.md). Las instrucciones de
> ejecución vigentes están en el README y en `docs/10-DEPLOYMENT-OBSERVABILITY.md`.

## Objetivo

Crear una base reproducible, estricta y verificable sin implementar todavía el producto.

## Resultado

El repositorio instala, compila, prueba y construye aplicaciones vacías desde una única raíz.

## Fuera de alcance

- generación QR funcional;
- DB;
- archivos;
- auth;
- analítica;
- componentes definitivos.

## Estructura

```text
qr-studio/
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ app.ts
│  │  │  ├─ server.ts
│  │  │  └─ routes/health.routes.ts
│  │  ├─ test/
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ web/
│     ├─ src/
│     │  ├─ app/App.tsx
│     │  ├─ app/main.tsx
│     │  └─ styles/index.css
│     ├─ index.html
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ vite.config.ts
├─ packages/
│  ├─ config/
│  ├─ contracts/
│  ├─ qr-core/
│  └─ test-fixtures/
├─ infra/docker/
├─ docs/execution/
├─ package.json
├─ package-lock.json
├─ tsconfig.base.json
├─ biome.json
├─ .editorconfig
├─ .gitignore
├─ .nvmrc
├─ .env.example
├─ apps/api/Dockerfile
├─ apps/web/Dockerfile
└─ compose.yaml
```

## Archivos y responsabilidades

| Ruta | Responsabilidad |
|---|---|
| `package.json` | workspaces y scripts raíz |
| `tsconfig.base.json` | strict mode compartido |
| `biome.json` | formato y lint |
| `.nvmrc` | versión Node |
| `.env.example` | catálogo no secreto |
| `apps/api/src/app.ts` | construir Express sin escuchar |
| `apps/api/src/server.ts` | lifecycle HTTP |
| `apps/api/src/routes/health.routes.ts` | live/ready |
| `apps/web/src/app/App.tsx` | shell |
| `packages/config/src/api-config.ts` | validación env API |
| `packages/config/src/web-config.ts` | validación env pública |
| `packages/contracts/src/index.ts` | export vacío controlado |
| `packages/qr-core/src/index.ts` | export vacío controlado |
| `compose.yaml` | orquestación local |
| `.github/workflows/ci.yml` | gates |

## Scripts raíz

```json
{
  "scripts": {
    "dev": "...",
    "dev:web": "...",
    "dev:api": "...",
    "build": "...",
    "typecheck": "...",
    "lint": "...",
    "format": "...",
    "format:check": "...",
    "test": "...",
    "test:e2e": "..."
  }
}
```

## Tareas

### 1. Workspaces

- configurar `apps/*` y `packages/*`;
- prohibir imports relativos entre workspaces;
- usar exports explícitos;
- un solo lockfile.

### 2. TypeScript

Activar:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "useUnknownInCatchVariables": true,
  "noImplicitOverride": true,
  "verbatimModuleSyntax": true
}
```

### 3. API

- Express 5;
- JSON limit;
- request ID;
- graceful shutdown;
- health;
- error handler base;
- no stack en producción.

### 4. Web

- React;
- Vite;
- Tailwind 4;
- CSS tokens;
- shell accesible;
- error boundary.

### 5. Config

- Zod;
- parseo de entorno;
- fallo temprano;
- flags.

### 6. Docker

- multi-stage;
- no root;
- health;
- `.dockerignore`;
- cache.

### 7. CI

- install limpio;
- format;
- lint;
- typecheck;
- test;
- build;
- audit.

## Pruebas

- config válida;
- config inválida falla;
- health live 200;
- ready 200;
- shutdown;
- build web;
- build API.

## Criterios de aceptación

- `npm ci` funciona;
- no warnings críticos;
- todos los scripts raíz funcionan;
- Docker build funciona;
- compose inicia;
- health responde;
- no hay negocio adelantado.

## Puerta de salida

- [ ] estructura completa
- [ ] CI verde
- [ ] config validada
- [ ] Docker no root
- [ ] health probado
- [ ] reporte de fase
