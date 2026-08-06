# ADR-007 — `sharp` como único procesador gráfico

## Estado

`accepted`

## Fecha

2026-08-05

## Contexto

La Fase 04 habilita exportación PNG y logos seguros (docs/phases/PHASE-04). El motor `qr` genera SVG, GIF y matriz, pero no PNG; rasterizar requiere un entorno gráfico. Además, los logos exigen decodificación, re-encode, eliminación de metadata y redimensionado. `docs/11-DEPENDENCY-POLICY.md` §4 ya aprueba `sharp` como única librería gráfica (prohibido además añadir Canvas, Jimp u otra).

## Fuerzas

- un único procesador de imagen auditable;
- rasterizar SVG → PNG en servidor (sin DOM ni Canvas);
- sanitizar logos: decodificar, re-encodear PNG, quitar metadata, redimensionar;
- límites de CPU/memoria configurables (línea de defensa frente a PNG costosos);
- el navegador no debe incluir binarios nativos: `sharp` vive SOLO en la API.

## Opciones

### Opción A — `sharp` en la API, con rasterizador inyectado en `qr-core`

`packages/qr-core` define el pipeline PNG (matriz → SVG excavado → logo) y recibe el rasterizador por inyección; la API implementa el rasterizador con `sharp` (SVG→PNG, PNG→RGB para decode final, composite de píxeles). `qr-core` sigue siendo puro y compatible con navegador (la web lo usa para la vista previa).

Ventajas: motor único, preview/export paridad, `qr-core` sin binarios nativos, pipeline testeable en TS puro.
Desventajas: la capa de rasterizado real solo se prueba de extremo a extremo en la API.

### Opción B — `sharp` dentro de `qr-core`

Ventajas: un solo paquete contiene todo.
Desventajas: `qr-core` entra en el bundle de la web (Vite), donde `sharp` no puede ejecutarse; obliga a excluir módulos del bundle y rompe la simplicidad. Rechazada.

### Opción C — PNG de cliente con Canvas y servidor con `sharp`

Desventajas: dos motores de rasterizado; contradice ADR-002 y el criterio "la exportación debe decodificar". Rechazada.

## Decisión

**Opción A.** `sharp` se instala únicamente en `apps/api`. `packages/qr-core` expone:

- `renderers/png.renderer.ts`: pipeline PNG con rasterizador inyectado (`PngRasterizer`);
- `renderers/composite-logo.ts`: SVG con excavación + logo (usado por web y API);
- `customization/*`: política de logos, colocación y escaneabilidad;
- `validation/rendered-roundtrip.ts`: verificación round-trip a nivel de matriz y decode de imagen RGB.

La API aporta `png.rasterizer.ts` (sharp: SVG→PNG, PNG→RGB, composite) y `logo.service.ts` (re-encode de logos).

## Consecuencias positivas

- preview y exportación usan el mismo motor y la misma política de logo;
- la web no empaqueta binarios nativos;
- el decode final del PNG real verifica escaneabilidad (criterio "la exportación falla si no decodifica").

## Consecuencias negativas

- `sharp` es nativo: requiere verificar el build Docker (alpine/musl usa prebuilt `@img/sharp-linuxmusl-x64`);
- el re-encode del logo ocurre en cada petición de render (estado stateless), coste acotado por límites de entrada (2 MB, 1024×1024).

## Riesgos y controles

- PNG consume CPU/memoria → `qr-render-limits.ts`: límites de entrada, `sharp.limitInputPixels`, concurrency acotada y rate limit por ruta (docs/07 §11);
- SVG de usuario → el servidor solo acepta PNG/JPEG/WebP por firma mágica y nunca rasteriza SVG subido;
- decode final falla → 422 controlado `QR_RENDER_UNSCANNABLE` (fallo controlado, no archivo corrupto).

## Plan de implementación

1. Fase 04: contratos (logo en options, códigos de error), config (rate limits, límites de logo).
2. `qr-core`: policy/placement/composite/pipeline/round-trip + tests unitarios.
3. API: middleware de upload, re-encode, rasterizador, límites + rate limit; tests.
4. Web: controles de logo, selector de formato, guía de impresión, badge de escaneabilidad; E2E.
5. Docker: verificar prebuilt de sharp en alpine; smoke compose.

## Plan de salida

Sustituir `sharp` exigiría ADR nuevo y revalidar los vectores de PNG/logo. No se permite un segundo procesador gráfico en paralelo.

## Referencias

- `docs/11-DEPENDENCY-POLICY.md` §4.
- `docs/13-DECISIONS-AND-RISKS.md` ADR-007.
- `docs/07-SECURITY-FILE-POLICY.md` §10 (logos).
- `docs/02-ARCHITECTURE.md`.
