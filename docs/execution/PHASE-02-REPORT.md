# PHASE-02-REPORT — Motor QR y API Estática (cerrada)

> Estado: **DONE** · Fecha: 2026-08-05 · Fuente: `docs/phases/PHASE-02-QR-CORE.md` · Plan: `PHASE-02-PLAN.md`

## Resumen

El motor QR único (`@acore/qr-core`, ADR-002) convierte contenido tipado en **payload canónico** (una sola forma por entrada) y lo renderiza de forma **verificable** (SVG seguro interno + GIF directo del encoder). La API expone `/api/v1/qr/validate` y `/api/v1/qr/render` con binario real (nunca base64) y errores Problem Details estables.

## Puerta de salida

| Criterio | Estado |
|---|---|
| Contratos publicados internamente (`@acore/contracts`) | ✅ esquemas Zod + códigos de error + límites |
| Todos los tipos iniciales (9) | ✅ text, url, email, phone, sms, wifi, vcard, calendar, geo |
| Round-trip verde | ✅ 16 fixtures: `decode(encode(build(input))) === payload` (ASCII, acentos, emoji, WiFi con `\ ; , : "`, vCard CRLF, URLs, calendario) |
| Endpoints documentados | ✅ `docs/api/QR-ENDPOINTS.md` |
| Coverage objetivo | ✅ qr-core 95% / contracts 100% / api 78% (server.ts de arranque excluible) |
| Reporte | ✅ este archivo |

## Evidencia verificable

| Gate | Resultado |
|---|---|
| lint / format / typecheck | ✅ 80 archivos limpios (Biome 2.5.7, TS estricto) |
| tests | ✅ **87/87** (21 API + 10 config + 12 contracts + 44 qr-core) |
| build | ✅ packages + API + web |
| Cobertura | qr-core **95.1%** stmts · **87.9%** branch · **93.3%** funcs; contracts 100% |
| Docker build + compose | ✅ ambos **healthy** |
| Smoke contenedor | ✅ validate 200 · render SVG (headers exactos sin charset) · GIF87a · png→415 · vcard-js→400 · GIF 4096→875 KB |
| Auditoría | ✅ 0 vulnerabilidades (`qr` 0.6.0 dual Apache-2.0/MIT) |
| Único import de `qr` | ✅ verificado por búsqueda: solo `qr-encoder.adapter.ts` |

## Decisiones clave (con evidencia empírica)

- **Encoder único**: `encodeMatrix` (`raw` con borde 1 recortado → módulos puros, `version = (n-17)/4`), `renderGifBytes` (GIF87a directo), `decodeMatrix` (round-trip: matriz pura + zona silenciosa 4 + escala 8 → `decodeQR` de `qr/decode.js`).
- **Overflow**: el encoder lanza `Error("Capacity overflow")` → `QrPayloadTooLargeError` (422). Pre-guard a 7089 chars (cota teórica absoluta) para rechazar antes de codificar.
- **SVG seguro**: render propio con `<rect>` + un `<path>`; colores validados por esquema; sin scripts/enlaces/foreignObject.
- **Contraste**: luminancia WCAG, mínimo **4.5:1**, foreground obligatoriamente más oscuro (invertidos bloqueados). `QR_CONTRAST_TOO_LOW` / `QR_INVERTED_COLORS` (422).
- **Densidad**: `safe` (v1-9) · `dense` (v10-19) · `critical` (v20-40) · `overflow` (422). Recomendaciones en la respuesta.
- **`networkType` en WiFi**: los docs maestros usaban `type` para el discriminante de la unión **y** para `WPA/WEP/nopass` (colisión real). Decisión de contrato: el campo interno se llama `networkType`; documentado en `QR-ENDPOINTS.md`.
- **Normalización**: NFC + recorte en los esquemas Zod antes de validar (`transform` → `pipe`); `z.email()`, `z.url()` de Zod 4.
- **Problem Details**: RFC 9457 con `Content-Type: application/problem+json` exacto (sin charset) para **todos** los errores (404/400/500 y QR), `X-Content-Type-Options: nosniff` global.

## Hallazgos del revisor aplicados

- 🔴 **ALTA — vCard `url` sin validación de esquema**: ahora reutiliza `safeUrl()` compartido con `urlContentSchema` (rechaza `javascript:`, `data:`, credenciales). Test de regresión.
- 🟡 **MEDIA — asimetría validate/render con GIF + colores**: las reglas de contraste solo aplican al render SVG; `validate` con `format: "gif"` ya no devuelve 422 por colores (avisa con warning). Semántica coherente entre endpoints.
- 🟡 **MEDIA — amplificación GIF**: tope de escala `32` (`MAX_GIF_SCALE`); size 4096 produce ~875 KB en vez de ~16 MB (mitigación hasta el rate limit de Fase 03).
- 🟢 **BAJA — defaults hardcodeados** en `gifColorWarning` → ahora usa `QR_OPTIONS_DEFAULTS` de contracts.

## Deuda aceptada (documentada)

| Deuda | Condición de resolución |
|---|---|
| Rate limit real pendiente (docs/12 define `RATE_LIMIT_*`) | Fase 03 |
| iCalendar sin folding de líneas > 75 octetos (RFC 5545) | Solo si un parser real lo exige; los lectores principales aceptan líneas sin plegar |
| `server.ts` (entrada del proceso) sin test unitario | Se cubre con smoke test; excluible de cobertura |
| `@acore/test-fixtures` sigue vacío; fixtures viven en `qr-core/test/fixtures.ts` | Consolidar cuando una segunda capa los necesite |
| `isAllowedUrlScheme`/`ALLOWED_URL_SCHEMES` exportados sin uso interno aún | Disponibles para Fase 04+ (vista previa) |
| `QR_ENABLE_SERVER_PNG` sin consumir (PNG servidor fuera de alcance) | Fase 04 (adaptador PNG/logo) |

## Riesgos revisados (docs/13)

- QR personalizado no escanea → controlado por round-trip real y umbral de contraste. ✅
- Payload supera capacidad → 422 con sugerencia de enlace. ✅
- Dos motores divergentes → un solo adaptador (ADR-002). ✅
- SVG malicioso → generado internamente, sin scripts/enlaces; colores validados. ✅
- Abuso de CPU/memoria → pre-guard de capacidad + tope de escala GIF (rate limit en Fase 03). ✅

## Archivos (≈ 40)

- **`packages/contracts`**: `qr-content.schema.ts`, `qr-options.schema.ts`, `qr-response.schema.ts`, `problem.schema.ts`, `error-codes.ts`, `index.ts` + tests.
- **`packages/qr-core`**: `domain/*` (content, options, errors, result), `builders/*` (9 + escaping), `validation/*` (capacity, contrast, schemes), `renderers/*` (adapter único, svg, gif, raw), `services/*` (build-canonical-payload, validate-qr, render-qr) + 6 archivos de test (builders, contraste, capacidad, round-trip, fuzz, render).
- **`apps/api`**: `modules/qr/{qr.routes,qr.controller,qr.service,qr.http-errors}.ts`, `errors.ts` (sendProblem RFC 9457), `app.ts` (nosniff + montaje `/api/v1/qr`), `test/qr.test.ts`.
- **Infra/raíz**: dependencia `qr@0.6.0` en qr-core, `zod` en contracts/api, `@vitest/coverage-v8` + script `test:coverage`, `docs/api/QR-ENDPOINTS.md`, `docs/execution/PHASE-02-PLAN.md`.

## Próximo paso permitido

**Fase 03 — Web MVP (`docs/phases/PHASE-03-WEB-MVP.md`)**: formulario tipado, vista previa local con `qr-core`, personalización, descarga SVG/GIF, validación contra la API y rate limit real. 🚀
