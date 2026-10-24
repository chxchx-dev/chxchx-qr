# Resultado de ejecución — Fase 01

## Fase

Fase 01 — Fundación del Monorepo.

## Objetivo completado

El repositorio instala, compila, prueba y construye aplicaciones vacías desde una única raíz. Se creó el monorepo npm workspaces con TypeScript estricto, API Express 5 con health y graceful shutdown, web React + Vite + Tailwind 4 con shell accesible, configuración Zod con fallo temprano, Docker multi-stage no-root y CI con gates completos. Sin negocio adelantado.

## Cambios

Archivos creados:

**Raíz**

- `package.json` (workspaces + scripts), `package-lock.json`, `tsconfig.base.json`, `biome.json`, `.editorconfig`, `.gitignore`, `.nvmrc` (Node 24), `.env.example`, `.dockerignore`, `apps/api/Dockerfile`, `apps/web/Dockerfile`, `compose.yaml`, `.github/workflows/ci.yml`.

**apps/api**

- `src/app.ts`, `src/server.ts`, `src/errors.ts`, `src/routes/health.routes.ts`, `test/app.test.ts`, `package.json`, `tsconfig.json`, `tsconfig.test.json`, `.env.example`.

**apps/web**

- `src/app/main.tsx`, `src/app/App.tsx`, `src/app/ErrorBoundary.tsx`, `src/styles/index.css`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `.env.example`.

**packages**

- `contracts` (src/index.ts, package.json, tsconfig.json).
- `config` (src/api-config.ts, src/web-config.ts, src/index.ts, test/*.test.ts, package.json, tsconfig.json, tsconfig.test.json).
- `qr-core` (src/index.ts, package.json, tsconfig.json).
- `test-fixtures` (src/index.ts, package.json, tsconfig.json).

**infra**

- `infra/docker/web/serve.mjs`.

Archivos modificados: ninguno (la documentación maestra no se tocó).

## Decisiones tomadas

- **Límite `QR_MAX_TEXT_LENGTH` = 500** (decisión MVP de la Fase 00) prevalece sobre el valor ilustrativo 2000 del doc 12.
- **Nombre del producto `acore-qr`** en env públicos (`VITE_APP_NAME`) y PRODID de calendario.
- **Dist-based packages**: los paquetes se compilan a `dist` y se consumen vía exports; los tests de `config` y `api` construyen primero (determinista, sin depender de resolución de extensiones de Vitest).
- **Dockerfile sin stage `deps` separado**: npm coloca deps de workspaces en `node_modules` anidados (zod en `packages/config/node_modules`); copiar directorios encima los pisaba. `npm ci` y copia de código viven en el mismo stage.

## Pruebas

| Comando | Resultado |
|---|---|
| `npm run format:check` | ✅ 35 archivos, sin correcciones |
| `npm run lint` (biome check) | ✅ 35 archivos, sin errores |
| `npm run typecheck` | ✅ todos los workspaces (TS estricto) |
| `npm run test` | ✅ 16 tests (6 API + 10 config) |
| `npm run build` | ✅ API (tsc) y web (vite 7.3.6, bundle 195 kB / 61 kB gzip) |
| `docker compose build` | ✅ `acore-qr-api` y `acore-qr-web` construidas |
| `docker compose up` + smoke | ✅ ambos healthy; `/health/live` y `/health/ready` 200; web sirve HTML |
| `docker compose stop api` | ✅ log `[qr-api] señal SIGTERM recibida; apagado graceful` |
| JSON malformado en Docker | ✅ `400` con Problem Details (`BAD_REQUEST`) |

Casos cubiertos por tests: config válida, config inválida falla (NODE_ENV, PORT, boolean, URL), health live 200, ready 200 con `qrEngine: ok`, request ID en toda respuesta, 404 Problem Details, JSON malformado → 400, shutdown limpio.

## Puerta de salida

- [x] estructura completa del monorepo
- [x] CI definido (calidad + docker + secretos)
- [x] config validada (Zod, fallo temprano, 16 tests)
- [x] Docker no root (`USER node`) con healthcheck
- [x] health probado (live/ready 200 en local y en contenedor)
- [x] reporte de fase

## Evidencia

- Gates ejecutados con Node v24.14.1 (vía nvm).
- `npm install`: 237 paquetes, **0 vulnerabilidades**.
- Smoke: `{"status":"ok","service":"qr-api","version":"0.1.0"}` y `{"status":"ready","checks":{"qrEngine":"ok"}}`.
- Web: CSS generado con `color-scheme:dark` + tokens y override light; HTML referencia assets; shell en bundle.

## Riesgos o deuda

Aceptada (documentada, no bloqueante):

1. `WEB_ORIGIN` y `LOG_LEVEL` se parsean en config pero aún no se consumen (CORS en Fase 02, logs en Fase 09).
2. `QR_*` y `RATE_LIMIT_*` se parsean pero solo aplican desde Fase 02.
3. La imagen API instala también las dependencias prod de `apps/web` (react/react-dom) vía `npm ci --omit=dev` con todos los workspaces: bloat menor, no es riesgo de seguridad. Optimizable con filtro de workspace.
4. Los scripts `typecheck` de `config`/`api` re-ejecutan `tsc --noEmit` sobre `src` tras el `build` (redundante pero inofensivo).
5. El agente de verificación visual de navegador no devolvió resultados en este entorno; el render se validó por artefacto (CSS dark, bundle, HTML servido) y smoke en contenedor.
6. No se realizó `git init`: el repo aún no es un repositorio git (convención de ramas del orquestador pendiente).

## Instrucciones de rollback

No hay migraciones ni datos. Rollback = eliminar el código creado:

```bash
rm -rf apps packages infra .github
rm package.json package-lock.json tsconfig.base.json biome.json .editorconfig .gitignore .nvmrc .env.example .dockerignore apps/api/Dockerfile apps/web/Dockerfile compose.yaml docs/execution/PHASE-01-PLAN.md docs/execution/PHASE-01-REPORT.md
```

## Estado final

**DONE.** Fase 01 cerrada con puerta de salida completa.

## Próximo paso permitido

Fase 02 — Motor QR (`docs/phases/PHASE-02-QR-CORE.md`).
