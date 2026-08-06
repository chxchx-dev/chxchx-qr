# PHASE-04-REPORT — Personalización y Exportación (cerrada)

> Estado: **DONE** · Fecha: 2026-08-06 · Fuente: `docs/phases/PHASE-04-CUSTOMIZATION-EXPORT.md` · Plan: `PHASE-04-PLAN.md` · ADR: `ADR-007-sharp.md`

## Resumen

El generador ahora exporta **PNG** además de SVG/GIF, permite añadir un **logo seguro** (re-encodado, sin metadata, con excavación y verificación round-trip) y la UI explica los límites de impresión y escaneabilidad. Se implementa el **rate limit real** (`RATE_LIMIT_*`), deuda documentada de Fase 03. El pipeline PNG vive en la API con `sharp` (ADR-007) mientras `qr-core` sigue siendo navegable mediante un rasterizador inyectado.

## Puerta de salida

| Criterio | Estado |
|---|---|
| ADR sharp (prebuilt musl verificado en alpine) | ✅ `docs/adr/ADR-007-sharp.md` + build Docker real |
| PNG coincide con SVG (misma matriz/opciones) | ✅ `png.rasterizer.ts` rasteriza el mismo SVG excavado; smoke 256×256 y firma `\x89PNG` |
| Logo seguro (re-encode, sin metadata, límites) | ✅ `logo.service.ts`: firma mágica, PNG/JPEG/WebP, ≤2 MB y ≤1024×1024, `rotate()+resize(inside)+png()` sin metadata |
| Round-trip (exportación falla si no decodifica) | ✅ decode final del PNG real (jsQR) → 422 `QR_RENDER_UNSCANNABLE` si falla |
| No hay SVG de usuario | ✅ el servidor solo recibe data URI PNG re-encodado por la API; nunca rasteriza SVG de cliente |
| Memoria estable bajo carga | ✅ `sharp.limitInputPixels`, concurrency acotada, body limit 2 MB, rate limit por IP |
| UI explica límites | ✅ `LogoControl` (formato/tamaño/ECC), `ExportFormatSelector`, `PrintSizeGuide`, `ScannabilityBadge` |
| Reporte | ✅ este archivo |

## Evidencia verificable

| Gate | Resultado |
|---|---|
| lint / format / typecheck | ✅ Biome limpio en todo el repo; TS estricto por workspace (qr-core, contracts, config, API, web) |
| tests | ✅ **154/154** (38 API + 27 web + 11 config + 12 contracts + 66 qr-core) |
| E2E | ✅ **7/7** Chromium + móvil, incluye **2 tests de logo** (upload fixture → preview → descarga PNG verificada) |
| build | ✅ packages + API + web (Vite) |
| Docker build + compose | ✅ imágenes construidas (sharp prebuilt musl en alpine) y **smoke en contenedor**: upload logo 200, render PNG con logo 200 (256×256 real), CORS correcto |
| Auditoría | ✅ 0 vulnerabilidades (sharp actualizado a 0.35.3: CVE-2026-33327/28/90/91 de libvips resueltas) |

## Decisiones clave (con evidencia empírica)

- **`sharp` solo en la API**: `qr-core` recibe un `PngRasterizer` inyectado; la API lo implementa con `sharp` (ADR-007). La web nunca empaqueta binarios nativos. El **adapter `qr`** sigue siendo el encoder único (ADR-002 intacto).
- **jsQR como decodificador de verificación**: el decoder `qr/decode.js` tiene un punto ciego real con la **versión 5** (ECC high) — "invalid format pattern" reproducible con URL típicos. Como los URL con logo son exactamente v5+high, se adopta **jsQR** (Apache-2.0, sin dependencias) para el round-trip y el decode final. Evidencia: script de matriz → jsQR decodifica todo lo que `qr/decode.js` no puede.
- **Colocación adaptativa del logo**: la caja del 20% de área destruye demasiado código contiguo en versiones pequeñas y no decodifica. `computeLogoPlacement` parte del 20% y **reduce la caja hasta que el round-trip decodifique** (el verificador decide el tamaño seguro; el logo se pinta centrado a escala).
- **Logo stateless**: `POST /api/v1/qr/logo` (multipart, multer ≥2) valida por firma mágica, re-encodea a PNG y devuelve `dataUri`. La web lo guarda solo en memoria y lo envía en `options.logo` (campo opcional del contrato, compatible §15). El servidor **re-valida la data URI en cada render**.
- **ECC alto obligatorio con logo**: validate recomienda `high` y render responde `422 QR_LOGO_REQUIRES_HIGH_ECC` si `ecc !== high`. La UI sube ECC automáticamente al añadir logo. GIF + logo → `422 QR_LOGO_UNSUPPORTED_FORMAT`; la UI deshabilita GIF con logo.
- **Rate limit real**: token bucket en memoria por IP (validate/min, render/min, png/min, upload/hora) con envs `RATE_LIMIT_*`; `429 QR_RATE_LIMITED`. Limitación por proceso (documentada en `docs/12`).
- **Límites CPU/memoria**: `sharp.limitInputPixels` anti-bomba de descompresión, tamaño máx. 4096 px, logo ≤2 MB y ≤1024×1024, body JSON 2 MB (data URI), concurrency acotada por el pool de sharp.

## Hallazgos del revisor aplicados

- 🟡 **MEDIA — vulnerabilidad sharp**: `npm audit` detectó CVE-2026-33327/28/90/91 en libvips (sharp < 0.35). Subido a **0.35.3**; el breaking change de tipos (namespace `sharp.*` → named exports `Sharp`/`Metadata`) se corrigió en `logo.service.ts`. API y smoke Docker revalidados tras el upgrade.
- 🟡 **MEDIA — data URI no validado en render**: un `options.logo` falso daba 500; ahora se re-valida firma + límites → `400 QR_LOGO_INVALID` controlado.
- 🟡 **MEDIA — brecha upload→render por body limit**: un logo aceptado en upload (JPEG foto 1024×1024 ≈ 1.5 MB) podía re-encodearse a un PNG incompresible cuyo data URI superaría el body limit de 2 MB → 413 genérico en render/validate. `processLogo` ahora rechaza el re-encode con `413 QR_LOGO_TOO_LARGE` (el upload es el árbitro).
- 🟡 **MEDIA — sin evidencia de carga**: se añadió test de **concurrencia** (8 renders PNG con logo en paralelo → todos 200 con firma válida) cubriendo el criterio "memoria estable bajo carga" del plan.
- 🟢 **BAJA — aserción de excavación**: el test contaba área, no módulos oscuros perdidos; umbral corregido y estabilizado.
- 🟢 **BAJA — `.env.example` del workspace API**: actualizado con `REQUEST_BODY_LIMIT=2mb`, `QR_ENABLE_LOGO`, `LOGO_MAX_*` y `RATE_LIMIT_*` (estaba con valores de Fase 02).

Verificados sin cambio: `removeUpload` ya limpia el archivo temporal de multer en `finally`; el bucle adaptativo de `findSafeLogoPlacement` termina con floor `MIN_BOX=2` y fall-through controlado a `QR_RENDER_UNSCANNABLE`; `sharp ^0.35.0` queda acotado a la línea 0.35.x validada y el lockfile gobierna CI/Docker.

## Deuda aceptada (documentada)

| Deuda | Condición de resolución |
|---|---|
| Rate limit por proceso (token bucket en memoria) | Fase de multi-proceso / Redis (documentado en `docs/12`) |
| Cache persistente de renders | Fase posterior (hoy todo `no-store`; solo cachear con política explícita y payload no sensible) |
| Logo + GIF | Bloqueado 422 (el encoder `qr` no soporta logo en GIF); desbloquear requiere otro encoder |
| i18n es/en | Fase posterior; texto centralizado en `shared/lib/messages.ts` |

## Archivos clave

- **qr-core**: `customization/{logo-policy,logo-placement,scannability-policy}.ts`, `renderers/{composite-logo,png.renderer,svg.renderer,qr-encoder.adapter}.ts`, `validation/rendered-roundtrip.ts`, `domain/{qr-errors,qr-result}.ts` + 5 suites de tests (66 total).
- **API**: `modules/qr/{logo-upload.middleware,logo.service,png.rasterizer,qr-render-limits,qr.service,qr.controller,qr.routes,qr.http-errors}.ts` + tests (`qr-png`, `qr-logo`, `rate-limit`, `helpers`).
- **Contratos/config**: `qr-options.schema.ts` (`logo?`), `error-codes.ts` (6 códigos nuevos), `api-config.ts` (`QR_ENABLE_LOGO`, `LOGO_MAX_*`, `RATE_LIMIT_*`, `REQUEST_BODY_LIMIT=2mb`).
- **Web**: `components/{ExportFormatSelector,LogoControl,PrintSizeGuide,ScannabilityBadge,DownloadActions,GeneratorScreen}.tsx`, `hooks/{useLogoPreview,useQrPreview}.ts`, `services/qr-api.client.ts` (upload), `shared/lib/messages.ts` + E2E `logo.spec.ts` con fixture.

## Próximo paso permitido

**Fase 05** (por definir en `docs/00-ORCHESTRATOR.md` / `docs/01-VISION-SCOPE.md`): con el generador completo (SVG/GIF/PNG + logo + validación de escaneabilidad + rate limit), las fases siguientes apuntan a archivos, QR dinámicos, cuentas y analítica.
