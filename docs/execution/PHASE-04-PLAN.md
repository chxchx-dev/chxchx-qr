# PHASE-04-PLAN — Personalización y Exportación

> Fuente de verdad: `docs/phases/PHASE-04-CUSTOMIZATION-EXPORT.md`. Estado: **DONE** (2026-08-06) · Reporte: `PHASE-04-REPORT.md`.

## Objetivo

Exportar PNG y añadir logos seguros sin comprometer la lectura: pipeline SVG→PNG con `sharp` (ADR-007), política de logos (2 MB, 1024×1024, PNG/JPEG/WebP, re-encode, sin metadata, ≤20% del área, ECC alto obligatorio, excavación, finder patterns intactos), verificación round-trip final, límites de CPU/memoria y rate limit real (deuda de Fase 03). UI: selector de formato, control de logo, guía de impresión y badge de escaneabilidad.

## Fuera de alcance (confirmado)

Archivos generales (fase propia), DB, QR dinámicos, cuentas, cache persistente (todo `no-store`), GIF con logo (el encoder `qr` no admite logo en GIF → bloqueado con 422), SVG subido por el usuario (nunca se rasteriza).

## Decisiones de diseño

| Decisión | Detalle |
|---|---|
| `sharp` solo en API | `qr-core` sigue siendo navegable: pipeline PNG con **rasterizador inyectado**; la API lo implementa con `sharp` (ADR-007). La web nunca empaqueta binarios nativos. |
| Logo stateless | `POST /api/v1/qr/logo` (multipart, multer ≥2) valida por firma mágica, re-encodea a PNG (sin metadata) y devuelve `dataUri`. La web lo guarda solo en memoria y lo envía en `options.logo` de validate/render. Sin storage ni DB. |
| Contrato | `qrOptionsSchema` gana `logo?: string` (data URI `data:image/png;base64,...`) **opcional** (compatibilidad §14). La API re-valida la data URI en cada render: firma mágica + re-encode + límites. |
| ECC alto obligatorio | Con logo y `ecc !== high` → `validate` recomienda alto y `render` responde 422 `QR_LOGO_REQUIRES_HIGH_ECC`. La UI sube ECC a "high" automáticamente al añadir logo. |
| Excavación | `logo-placement.ts`: caja centrada ≤20% del área, sin tocar finder patterns ni separadores (dentro de [8, count-8]); `composite-logo.ts` excluye los módulos excavados del `<path>` y añade el logo. |
| PNG | Mismo SVG excavado → rasteriza sharp → composite de píxeles del logo → **decode final** del PNG real contra el payload canónico (round-trip). Si falla → 422 `QR_RENDER_UNSCANNABLE`. |
| Round-trip local | La web verifica a nivel de matriz (encode → excavar → RGB → decode) para el badge de escaneabilidad; el servidor verifica el PNG real en la exportación. |
| Rate limit | Limiter en memoria por IP (token bucket): validate/min, render/min, png/min, upload/hora (env `RATE_LIMIT_*`). 429 `QR_RATE_LIMITED`. Limitación documentada: por proceso. |
| Límites CPU/memoria | `qr-render-limits.ts`: `sharp.limitInputPixels`, tamaño máx. 4096 px (reutiliza `QR_MAX_SIZE`), logo ≤2 MB y ≤1024×1024, concurrency acotada, body JSON 2 MB (data URI de logo). |
| GIF + logo | Bloqueado: 422 `QR_LOGO_UNSUPPORTED_FORMAT`. La UI deshabilita GIF cuando hay logo. |
| Impresión | `PrintSizeGuide`: margen, tamaño físico (referencia a DPI, sin prometer calidad solo por DPI), contraste, prueba en material final, superficies reflectivas, quiet zone. |

## Archivos por crear

```text
docs/adr/ADR-007-sharp.md ✅
packages/qr-core/src/customization/{logo-policy,logo-placement,scannability-policy}.ts
packages/qr-core/src/renderers/{composite-logo,png.renderer}.ts
packages/qr-core/src/validation/rendered-roundtrip.ts
packages/qr-core/test/{logo-policy,logo-placement,composite-logo,rendered-roundtrip,png.renderer}.test.ts
apps/api/src/modules/qr/{logo-upload.middleware,logo.service,png.rasterizer,qr-render-limits}.ts
apps/api/test/{logo,render-png,rate-limit}.test.ts
apps/web/src/features/generator/components/{ExportFormatSelector,LogoControl,PrintSizeGuide,ScannabilityBadge}.tsx
apps/web/src/features/generator/hooks/useLogoPreview.ts
apps/web/test/e2e/logo.spec.ts + fixtures/logo.png
```

## Archivos por modificar

- `packages/contracts/src/{qr-options.schema,error-codes,index}.ts` (logo opcional + códigos nuevos)
- `packages/config/src/api-config.ts` (RATE_LIMIT_*, QR_ENABLE_LOGO, LOGO_*)
- `packages/qr-core/src/{index.ts, renderers/svg.renderer.ts}` (skip mask en renderSvg)
- `apps/api/package.json` (multer, sharp), `apps/api/src/{app.ts, modules/qr/{qr.routes,qr.controller,qr.service,qr.http-errors}.ts}`
- `apps/api/.env.example`, `.env.example` (raíz), `compose.yaml`
- `apps/web/src/...`: `qr-api.client.ts`, `useQrPreview.ts`, `useQrValidation.ts`, `DownloadActions.tsx`, `GeneratorScreen.tsx`, `shared/lib/messages.ts`
- `apps/api/Dockerfile` (sharp en alpine, verificar prebuilt musl)
- Docs: `05-API-CONTRACTS.md`, `12-ENVIRONMENT-CONFIG.md` (body limit), `PHASE-04-REPORT.md`

## Orden de tareas

1. ADR-007 + contratos + config + plan.
2. `qr-core`: policy/placement/scannability/composite/pipeline/round-trip.
3. Unit tests `qr-core`.
4. API: deps + middleware/service/rasterizer/limits + rutas.
5. Tests API.
6. Web: mensajes, componentes, hooks, integración.
7. Unit tests web + E2E logo.
8. Docker + smoke compose.
9. Gates completos + revisión.
10. Reporte + docs.

## Pruebas

- PNG signature (`\x89PNG\r\n\x1a\n`) y dimensiones IHDR;
- logo válido / corrupto / gigante (>2 MB o >1024 px) / SVG disfrazado;
- ECC forzado (logo + low → 422);
- GIF + logo → 422;
- decode final (render con logo decodifica el payload);
- concurrencia (N renders paralelos sin error de memoria);
- rate limit (429 tras superar cuota);
- round-trip matriz en `qr-core`.

## Criterios de aceptación (de la fase)

- [x] PNG coincide con SVG (misma matriz/opciones);
- [x] logos se re-encodean (PNG salida, sin metadata);
- [x] exportación falla si no decodifica (422 controlado);
- [x] no hay SVG de usuario;
- [x] memoria estable bajo carga (límites + rate limit);
- [x] UI explica límites (tamaño, formato, ECC, impresión);
- [x] ADR sharp + reporte.

## Riesgos

- `sharp` en alpine: prebuilt musl (verificar build Docker);
- data URI grande en JSON: body limit 2 MB solo para el flujo QR;
- decode final de PNG con logo: depende del contenido del logo (el re-encode + excavación + ECC alto lo mitigan; fallo → 422).
