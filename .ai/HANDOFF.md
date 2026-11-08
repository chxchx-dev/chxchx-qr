

> Historial anterior: `.ai/history/HANDOFF.md` (no se lee al iniciar un chat).

## 2026-11-08 — Paquete local para proyectos de prueba

1. El objetivo vigente es generar e instalar `@chxchx/qr-core` localmente en otros proyectos; no publicar el paquete ni desplegar la aplicación.
2. Desde la raíz de chxchx-qr, `npm run pack:local` construye `artifacts/local/chxchx-contracts-0.1.0.tgz` y `artifacts/local/chxchx-qr-core-0.1.0.tgz`. Instalar ambos con `npm install <ruta-al-contrato.tgz> <ruta-al-motor.tgz>` desde el proyecto consumidor.
3. Pasaron el empaquetado, lint, format check y `git diff --check`. No se probó la instalación dentro de un repositorio consumidor.
4. Render/VPS no es requisito ni pendiente de trabajo actual.

## 2026-11-08 — Alcance local

1. Rate limit endurecido; completado.
2. E2E multiplataforma integrado a CI; 14 casos pasan localmente.
3. Instalación, uso de interfaz y uso del paquete interno documentados. Render queda como único paso opcional pendiente si la persona usuaria decide publicar.
4. `@acore/qr-core` sigue privado e interno al monorepo; publicación npm externa no forma parte del alcance local actual.

## 2026-11-08 — Guía y E2E terminados

1. Rate limit y límites de proxy; completado y verificado.
2. E2E multiplataforma y añadido a CI; 14 casos pasan localmente.
3. Render Blueprint, configuración y rollback están documentados. La persona usuaria pidió dejar el despliegue explicado y no ejecutar la creación real de servicios; esperar nuevas instrucciones para provisionar.

## 2026-11-08 — Publicación Render

1. Rate limit endurecido y validado; completado.
2. E2E integrado a CI y validado localmente; completado.
3. Render elegido y configurado en `render.yaml`; completar desde el dashboard: vincular repositorio, crear Blueprint, ingresar las URL reales en `WEB_ORIGIN` y `VITE_API_BASE_URL`, comprobar health/CORS/IP cliente sobre HTTPS y practicar rollback. Mantener una instancia API mientras el rate limit sea local.

## 2026-11-08 — Continuación

1. Rate limit endurecido y validado; completado.
2. E2E añadido a CI con instalación de Chromium; validado localmente (14 pruebas); completado.
3. Siguiente: elegir plataforma de publicación y concretar URL, entorno, HTTPS, health checks y rollback; completar checklist.

## 2026-11-08 — Siguiente prioridad

1. Rate limit endurecido y verificado; completado.
2. Integrar `npm run test:e2e` a CI e instalar el navegador de Playwright requerido. Continuar ahora con esta prioridad.
3. Elegir plataforma y fijar URL pública, variables de producción, HTTPS, health checks y rollback; actualizar la checklist de publicación.

## 2026-11-08 — Continuación de revisión

1. Cerrar el rate limit: resolver la IP desde la configuración de proxy real; `req.ip` no basta con `TRUST_PROXY=true` si cualquier salto queda confiado. Evitar el crecimiento indefinido del `Map` y cubrir ambos casos con pruebas.
2. Integrar `npm run test:e2e` a CI e instalar el navegador de Playwright requerido.
3. Elegir plataforma y fijar URL pública, variables de producción, HTTPS, health checks y rollback; actualizar la checklist de publicación.
4. Ejecutar format, lint, typecheck, unit tests, build y E2E al implementar estos cambios.
