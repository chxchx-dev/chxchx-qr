# PHASE-02-PLAN — Motor QR y API Estática

> Fuente de verdad: `docs/phases/PHASE-02-QR-CORE.md`. Estado: **EN EJECUCIÓN** (2026-08-05).

## Objetivo

Construir `packages/qr-core` (payload canónico + matriz + SVG/GIF) con un único adaptador sobre `qr` (ADR-002), y exponer `POST /api/v1/qr/validate` y `POST /api/v1/qr/render` con Problem Details y binario real (nunca base64).

## Fuera de alcance (confirmado)

UI, logos, PNG servidor (415), archivos, DB, dinámicos, rate limit real (pendiente Fase 03), módulos redondeados/gradientes.

## Decisiones de diseño (con evidencia empírica)

| Decisión | Detalle |
|---|---|
| Encoder único | `packages/qr-core/src/renderers/qr-encoder.adapter.ts` es el **único** archivo que importa `qr` (`encodeQR` default + `decodeQR` de `qr/decode.js`). |
| Matriz | `encodeQR(payload, "raw", { ecc, border: 1 })` → se recorta el anillo de borde → módulos puros `boolean[][]`. `version = (moduleCount - 17) / 4`. |
| Overflow | El encoder lanza `Error("Capacity overflow")`; el adaptador lo traduce a `QrPayloadTooLargeError`. Pre-guard: `payload.length > 7089` (cota teórica absoluta) se rechaza antes de codificar. |
| Round-trip | `decodeMatrix(matrix)`: matriz pura + zona silenciosa de 4 módulos + escala 8 → imagen RGB → `decodeQR`. Verificado con ASCII, acentos, emoji, WiFi con `;\,"\`, vCard CRLF y URLs con query. |
| SVG | Render propio desde la matriz (un `<path>` por módulo oscuro + `<rect>` de fondo): colores validados, **sin** scripts/enlaces/foreignObject. `SvgQrOpts` de `qr` no soporta colores, por eso se genera interno. |
| GIF | `encodeQR(payload, "gif", { ecc, border, scale })` (GIF87a, directo de `qr`). Sin colores personalizados: si se piden, `validate` devuelve warning y el reporte lo documenta. |
| Contraste | Luminancia relativa WCAG; ratio mínimo **4.5:1**; foreground debe ser más oscuro que el fondo (invertido bloqueado). Errores `QR_CONTRAST_TOO_LOW` / `QR_INVERTED_COLORS` (422). |
| Densidad | `safe` (v1-9), `dense` (v10-19), `critical` (v20-40), `overflow` (rechazo 422). |
| Discriminante WiFi | Los docs maestros usan `type` tanto para el discriminante de la unión como para el tipo de red WiFi (`WPA/WEP/nopass`) — colisión real. **Decisión:** el campo interno pasa a llamarse `networkType`; el discriminante sigue siendo `type: "wifi"`. Se documenta en el reporte y en `QR-ENDPOINTS.md`. |
| Normalización | Esquemas Zod: `transform(NFC).pipe(trim().min().max())`; transformaciones solo transparentes. `z.email()`, `z.url()` de Zod 4. |
| Contrato HTTP | `400 QR_SCHEMA_INVALID`, `415 QR_UNSUPPORTED_FORMAT` (png), `422 QR_PAYLOAD_TOO_LARGE`/`QR_CONTRAST_TOO_LOW`/`QR_INVERTED_COLORS`. `X-Content-Type-Options: nosniff` global. |

## Tareas

1. Contratos: `qr-content.schema.ts`, `qr-options.schema.ts`, `qr-response.schema.ts`, `problem.schema.ts`, `error-codes.ts` + zod dep + tests.
2. qr-core domain: `qr-content.ts`, `qr-options.ts`, `qr-errors.ts`, `qr-result.ts`.
3. Builders (text, url, email, phone, sms, wifi, vcard, calendar, geo) + escaping + fixtures.
4. Validación: `capacity.ts`, `contrast.ts`, `schemes.ts`.
5. Renderers: `qr-encoder.adapter.ts` (único import de `qr`), `svg.renderer.ts`, `gif.renderer.ts`, `raw.renderer.ts`.
6. Servicios: `build-canonical-payload.ts`, `validate-qr.ts`, `render-qr.ts` + exports públicos.
7. Tests qr-core: builders/escaping, contraste, capacidad, round-trip (todos los fixtures), fuzz Unicode determinista (200 cadenas).
8. API: `modules/qr/{qr.routes,qr.controller,qr.service,qr.http-errors}.ts`, montaje en `app.ts`, helper Problem Details compartido.
9. Tests API: 200 SVG, 200 GIF, 422 overflow, 400 schema, 415 png, 422 contraste, headers y seguridad del SVG.
10. Gates: lint, format, typecheck, test, build; Docker build + smoke.
11. Documentación de endpoints + revisión.
12. Reporte de cierre.

## Criterios de aceptación (de la fase)

- [ ] un payload tiene una sola forma canónica (tests por builder);
- [ ] el resultado se decodifica (round-trip por fixture);
- [ ] frontend y API pueden importar `@acore/qr-core`;
- [ ] ningún import directo de `qr` fuera del adapter (se verifica con búsqueda);
- [ ] SVG seguro (sin scripts/enlaces/foreignObject, colores validados);
- [ ] errores estables (códigos en `@acore/contracts`).

## Puerta de salida

- [ ] contratos publicados internamente;
- [ ] todos los tipos iniciales (9);
- [ ] round-trip verde;
- [ ] endpoints documentados (`docs/api/QR-ENDPOINTS.md`);
- [ ] coverage objetivo reportado;
- [ ] reporte (`PHASE-02-REPORT.md`).
