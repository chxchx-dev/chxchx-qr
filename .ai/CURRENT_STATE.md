

> Historial anterior: `.ai/history/CURRENT_STATE.md` (no se lee al iniciar un chat).

## 2026-11-08 — Motor QR instalable localmente

- Alcance corregido: no desplegar la aplicación ni publicar el paquete en npm; reutilizar `@chxchx/qr-core` en proyectos locales de prueba.
- `npm run pack:local` compila contratos y motor, y crea dos tarballs privados en `artifacts/local/` para instalarlos desde disco en otro proyecto.
- Guías actualizadas con instalación en macOS/Linux y Windows, ejemplo TypeScript y dependencias. El despliegue no es un pendiente.
- Validación ejecutada: empaquetado, lint, format check y `git diff --check`. No se hizo instalación de los tarballs en un repositorio consumidor.

## 2026-11-08 — Uso local documentado; Render opcional

- Se añadió una guía de uso cotidiano de la interfaz y un ejemplo TypeScript para importar `@acore/qr-core` dentro del monorepo.
- Se aclara que los paquetes son privados e internos; no están preparados para instalarse desde npm en otro repositorio. Esto coincide con el alcance privado actual.
- Render queda explícitamente como opción futura, no como requisito para instalar o usar el generador localmente. El ejemplo del paquete se ejecutó correctamente; E2E pasó (14 pruebas), junto con typecheck, formato y lint.

## 2026-11-08 — Guía de uso y E2E multiplataforma

- `docs/INSTALL-AND-USE.md` explica en español sencillo cómo instalar Node/Git/dependencias, configurar entornos locales, ejecutar, probar y adaptar el despliegue. README y docs/README enlazan la guía.
- E2E ya no depende de Bash ni `curl`: Playwright levanta API y web desde `playwright.config.ts`. `npm run test:e2e` pasó (14 pruebas); typecheck, formato y lint también pasaron.
- Los pasos de despliegue Render quedan explicados en documentación; el despliegue real y sus URLs quedan pendientes de la cuenta del usuario.

## 2026-11-08 — Infraestructura de publicación preparada

- Plataforma elegida: Render. `render.yaml` define API Node en Virginia (Starter, 512 MB, 1 instancia) y web estática; autodeploy espera CI, API usa `/health/ready` y ambas URL quedan como valores solicitados al crear el Blueprint.
- Guía de despliegue y checklist actualizadas. YAML válido; `npm run format:check`, `npm run lint` y `git diff --check` pasan.
- Costo publicado hoy: API Starter $7 USD/mes; sitio estático sin costo de cómputo. La creación real, URLs asignadas, smoke test público y ensayo de rollback requieren una cuenta Render conectada.

## 2026-11-08 — Prioridades 1 y 2 completadas

- Rate limit endurecido: `req.ip` de Express, confianza por saltos configurables y buckets purgados/acotados. `npm test` (118), typecheck, formato, lint y build pasaron.
- CI instala Chromium para Playwright y ejecuta E2E. `npm run test:e2e`: 14 pruebas pasaron localmente.
- Siguiente pendiente: elegir plataforma y cerrar configuración real de publicación (prioridad 3). El build conserva dos advertencias no bloqueantes de comentarios en dependencias Zod.

## 2026-11-08 — Rate limit endurecido

- Prioridad 1 completada: el rate limit usa `req.ip` de Express; `TRUST_PROXY_HOPS` limita la confianza a una cantidad fija de saltos; los buckets se purgan por lotes de 100 y cada limitador queda acotado a 10 000 entradas.
- Documentación y pruebas unitarias actualizadas. Pasaron `npm test` (118 pruebas), `npm run typecheck`, `npm run format:check`, `npm run lint` y `npm run build`.
- El build terminó con advertencias no bloqueantes de comentarios en módulos de Zod. No se ejecutó E2E; sigue como prioridad 2.

## 2026-11-08 — Revisión retomada

- El alcance acordado sigue cubierto: generador estático, nueve tipos, tres formatos y flujo web con preview y descargas.
- Antes de publicar quedan dos brechas verificadas en código: rate limit con `X-Forwarded-For` tomado directamente y buckets caducados sin purga; E2E existe, pero CI no lo ejecuta ni instala Chromium.
- No hay plataforma ni configuración de producción elegida. Revisión estática solamente; no se cambió código ni se ejecutaron verificaciones.
