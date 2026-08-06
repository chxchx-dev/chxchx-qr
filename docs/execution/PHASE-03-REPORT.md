# PHASE-03-REPORT — Web MVP (cerrada)

> Estado: **DONE** · Fecha: 2026-08-05 · Fuente: `docs/phases/PHASE-03-WEB-MVP.md` · Plan: `PHASE-03-PLAN.md`

## Resumen

El generador web (`apps/web`, React 19 + Vite 7 + Tailwind 4) expone un formulario tipado para los **9 tipos** de contenido, vista previa local con el **mismo motor** (`@acore/qr-core`) que la API, personalización (ECC, tamaño, margen, colores), validación contra la API con debounce y abort, y descarga SVG/GIF real. Resuelve además la deuda de Fase 01: **CORS mínimo** (solo `WEB_ORIGIN`) y el **rate limit** de Fase 02 se documenta como pendiente de Fase 04.

## Puerta de salida

| Criterio | Estado |
|---|---|
| Formulario tipado para los 9 tipos (docs 08: contraste, labels, estados) | ✅ selector radiogroup con roving tabindex + 9 formularios |
| Vista previa local con `qr-core` (paridad con la API) | ✅ `useQrPreview`: `buildCanonicalPayload` + `encodeMatrix` + `renderSvg` |
| Personalización y descarga SVG/GIF | ✅ `QrOptionsPanel` + `DownloadActions` (blob → ObjectURL → `<a download>`) |
| Validación contra la API | ✅ `useQrValidation` (local con contrato + API con debounce 300 ms y abort) |
| WiFi nunca persiste (ni localStorage) | ✅ drafts solo en memoria (`useReducer`); aviso de privacidad visible |
| E2E con navegador real | ✅ Playwright 5/5 (URL, WiFi, vCard, móvil ×2) |
| Reporte | ✅ este archivo |

## Evidencia verificable

| Gate | Resultado |
|---|---|
| lint / format / typecheck | ✅ 126 archivos limpios (Biome 2.5.7, TS estricto) |
| tests | ✅ **111/111** (21 API + 24 web + 10 config + 12 contracts + 44 qr-core) |
| E2E | ✅ **5/5** Chromium + móvil: preview local, validación API, descarga SVG, WiFi sin persistencia, vCard, apilado móvil |
| build | ✅ packages + API + web (Vite) |
| Docker build + compose | ✅ ambos **healthy** |
| Smoke contenedor | ✅ web :8080 sirve título · validate 200 · CORS `Access-Control-Allow-Origin: http://localhost:8080` |
| Auditoría | ✅ 0 vulnerabilidades |

## Decisiones clave (con evidencia empírica)

- **Paridad preview/descarga**: la preview usa `qr-core` en el cliente; la descarga usa la API. La paridad se garantiza porque ambos pasan por el **mismo contrato** (`buildContentDto` → `validateDraft` local y DTO de la API) y el mismo `renderSvg`.
- **Drafts solo en memoria**: `useReducer` sin persistencia; WiFi con `autoComplete="off"`, y al elegir red abierta el campo de contraseña desaparece (nunca se envía). E2E verifica que no persiste al cambiar de tipo.
- **Validación en dos niveles**: esquema compartido local (errores de campo al instante) + API con debounce de 300 ms y `AbortController` (los requests viejos se cancelan). Overflow y contraste llegan como mensaje de la API (422).
- **Accesibilidad**: radiogroup con navegación por flechas/Home/End (patrón ARIA, docs/08), `aria-live` en validación y estado de descarga, `role="alert"` en errores de campo, labels + `useId` en todos los campos, foco visible, `color-scheme` del sistema.
- **Seguridad**: SVG de preview con `dangerouslySetInnerHTML` solo para el SVG generado por `qr-core` (rect+path, sin scripts/enlaces; colores validados por contrato); filename saneado (`sanitizeFilename`); CORS restringido a `WEB_ORIGIN` (sin credenciales).
- **Proxy de desarrollo**: Vite proxya `/api` → `:4000` (dev). El build estático usa `VITE_API_BASE_URL` (default `http://localhost:4000/api/v1`) + CORS desde `WEB_ORIGIN` (compose). Evidencia: smoke contenedor con header CORS correcto.
- **`biome.json`**: `useSemanticElements` desactivado con justificación (el patrón radiogroup con roving tabindex requiere `role="radio"` sobre botones; inputs nativos no permiten el layout tarjeta). El resto de reglas a11y/security se mantienen.

## Hallazgos del revisor aplicados

- 🟡 **MEDIA — hook sin usar**: `useDebouncedValue` era código muerto (la validación ya debouncea con su propio timer). Eliminado.
- 🟡 **MEDIA — residuo de depuración**: `debug-e2e.mjs` y `test-results/` (artefactos de Playwright) fuera de control de versiones; `.gitignore` ampliado (`apps/web/test-results/`, `playwright-report/`, `blob-report/`).
- 🟢 **BAJA — aserción móvil débil**: el test móvil ahora verifica el apilado real por coordenadas (solo bajo el breakpoint `lg`; en escritorio la preview vive en la columna lateral).

## Deuda aceptada (documentada)

| Deuda | Condición de resolución |
|---|---|
| Rate limit real (`RATE_LIMIT_*` de docs/12) | Fase 04 (hoy mitigado por tope de escala GIF de Fase 02) |
| PNG de cliente (vista previa/descarga) | Fase 04 (adaptador PNG/logo) |
| i18n es/en | Fase posterior; hoy todo el texto vive centralizado en `shared/lib/messages.ts` |
| Tema claro/oscuro a elección del usuario | Fase posterior (hoy: oscuro por defecto, `color-scheme` del sistema) |
| `useQrDownload` sin test unitario (blob/URL/anchor) | Cubierto por E2E de descarga; unitario opcional |

## Archivos (≈ 45 nuevos)

- **`apps/web/src/shared`**: `components/Field.tsx` (TextField, TextArea, Select, Color, Toggle, Password, DateTime con labels/errores/contadores), `lib/{messages,sanitize-filename}.ts`.
- **`apps/web/src/features/generator`**: `generator.types.ts`, `state/generator.reducer.ts`, `lib/{build-dto,validate-draft}.ts`, `services/qr-api.client.ts`, `hooks/{useQrPreview,useQrValidation,useQrDownload}.ts`, `components/` (ContentTypeSelector, GeneratorForm, GeneratorScreen, PreviewPanel, QrSvgPreview, QrOptionsPanel, ValidationSummary, DownloadActions), `forms/` (9 formularios).
- **`apps/web/src/app`**: `App.tsx`, `providers.tsx` (ErrorBoundary), `routes.tsx`; `styles/{tokens,index}.css`; `index.html` (SEO/OG).
- **Tests**: `test/{reducer,build-dto,sanitize-filename}.test.ts` (24 unit) + `test/e2e/{helpers,url,wifi,vcard,mobile}.spec.ts` + `playwright.config.ts` + `scripts/e2e.sh` + `vitest.config.ts`.
- **API/raíz**: `apps/api/src/cors.ts` + `app.ts` (CORS), `compose.yaml` (`WEB_ORIGIN`), `vite.config.ts` (host/proxy/robots), `biome.json`, `.gitignore`, `docs/execution/PHASE-03-PLAN.md`.

## Próximo paso permitido

**Fase 04 — Personalización y Exportación** (`docs/phases/PHASE-04-CUSTOMIZATION-EXPORT.md`): PNG, logo/colores avanzados y el rate limit real que cierra el ciclo de producción del generador. 🚀
