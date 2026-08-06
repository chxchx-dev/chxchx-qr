# PHASE-03-PLAN — Generador Web MVP

> Fuente de verdad: `docs/phases/PHASE-03-WEB-MVP.md`. Estado: **EN EJECUCIÓN** (2026-08-05).

## Objetivo

Experiencia mobile-first para generar QR estáticos sin cuenta: elegir tipo → datos → personalizar → validar → descargar SVG/GIF. Preview local con `qr-core` (mismo motor), descarga final por la API, validación local + API.

## Fuera de alcance (confirmado)

Logo, PNG (el botón aparece deshabilitado: la API devuelve 415 hasta Fase 04), upload, cuenta, dinámicos, analítica.

## Decisiones de diseño

| Decisión | Detalle |
|---|---|
| CORS | Middleware pequeño propio en la API (sin dependencia) usando `WEB_ORIGIN` (config ya existente). Resuelve la deuda aceptada de Fase 01. `compose.yaml` pasa `WEB_ORIGIN=http://localhost:8080` para que el demo compose web→API funcione. |
| Estado | Reducer puro (`generator.reducer.ts`): `drafts` por tipo **solo en memoria** (sesión), opciones, tipo activo. WiFi nunca se persiste. |
| Validación | Reutiliza `qrContentSchema`/`qrOptionsSchema` de `@acore/contracts` (una sola fuente). Se añaden mensajes zod en español (mejoran también el detalle 400 de la API). Estados: `idle/validando/válido/advertencia/inválido/error`. |
| Preview | Local con `buildCanonicalPayload` + `encodeMatrix` + `renderSvg` de `@acore/qr-core` con **las mismas opciones** que la descarga (paridad preview/export). Debounce corto + abort de requests viejos. SVG interno = seguro para `dangerouslySetInnerHTML`. |
| Descarga | `POST /api/v1/qr/render` → Blob → ObjectURL → `<a download>` → `revokeObjectURL`. Nombre saneado. Solo se regenera al pulsar (nunca por tecla). PNG deshabilitado. |
| E2E | Playwright con **Chrome del sistema** (`channel: "chrome"`, sin descargar navegadores). webServer: API (`node apps/api/dist/server.js`, puerto 4000) + web (`vite preview` 5173, mismo `WEB_ORIGIN`). `npm run test:e2e` = `npm run build && playwright test`. |
| i18n | UI en español con strings centralizadas en `shared/lib/messages.ts` (lista para es/en; el switch i18n se documenta como pendiente). |
| Formularios | Sin react-hook-form (opcional en la política): componentes controlados + esquemas zod compartidos. |
| Calendario | `datetime-local` nativo → conversión a ISO UTC (`Z`) en el DTO. |
| SEO | title/description/OG/canonical en `index.html`; robots según ambiente con pequeño plugin de Vite (dev = noindex, build = index,follow). |

## Tareas

1. API: middleware CORS + `WEB_ORIGIN` en compose + mensajes zod en español en contracts.
2. Web deps (`@acore/contracts`, `@acore/qr-core`) + scripts `test`/`typecheck` con tsconfig de test.
3. `shared`: `messages.ts`, `useDebouncedValue`, `sanitize-filename`, primitivas de campo accesibles (TextField, TextArea, Select, ColorField, Toggle, PasswordField, DateField, contador, ayuda, error).
4. `features/generator`: tipos, reducer, `build-dto` (9 tipos), `qr-api.client` (AbortController).
5. Hooks: `useQrPreview`, `useQrValidation` (local + API, abort), `useQrDownload` (blob + revoke + anuncio).
6. Componentes: selector de tipo (radiogroup con teclado), formulario por tipo, panel de opciones (ECC explicado, tamaño, margen, colores, restaurar), preview + zoom + placeholder accesible, resumen de validación (`aria-live`), acciones de descarga.
7. App: `App.tsx` (header + generador + footer), `providers`, `routes`, `tokens.css`, SEO.
8. Tests unitarios web: reducer, build-dto (los 9 tipos pasan el esquema con drafts válidos), sanitize-filename.
9. E2E Playwright: URL (preview + descarga SVG), WiFi (toggle password + no persiste en localStorage), vCard (descarga GIF), viewport móvil sin scroll horizontal.
10. Gates completos + Docker smoke con CORS.
11. Revisión de código + reporte.

## Criterios de aceptación (de la fase)

- [ ] flujo completo en móvil (una mano, sin zoom);
- [ ] sin scroll horizontal;
- [ ] preview coincide con descarga (mismas opciones);
- [ ] exportación bloqueada si inválido o en validación;
- [ ] todos los tipos (9) disponibles;
- [ ] responsive;
- [ ] a11y (radiogroup con teclado, focus visible, aria-live, target táctil, reduced-motion);
- [ ] E2E verde.

## Puerta de salida

- [ ] todos los tipos
- [ ] responsive
- [ ] a11y
- [ ] E2E
- [ ] preview/export parity
- [ ] reporte
