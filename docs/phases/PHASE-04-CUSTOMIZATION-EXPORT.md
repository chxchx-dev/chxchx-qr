# Fase 04 — Personalización y Exportación

## Objetivo

Añadir PNG, logo y controles de impresión sin comprometer lectura.

## Resultado

El usuario exporta SVG, GIF y PNG, puede añadir un logo seguro y recibe validación de escaneabilidad.

## Fuera de alcance

- archivos generales;
- DB;
- dinámicos;
- cuentas.

## Archivos

```text
packages/qr-core/src/
├─ customization/
│  ├─ logo-policy.ts
│  ├─ logo-placement.ts
│  └─ scannability-policy.ts
├─ renderers/
│  ├─ png.renderer.ts
│  └─ composite-logo.ts
└─ validation/
   └─ rendered-roundtrip.ts

apps/api/src/modules/qr/
├─ logo-upload.middleware.ts
└─ qr-render-limits.ts

apps/web/src/features/generator/
├─ components/
│  ├─ LogoControl.tsx
│  ├─ ExportFormatSelector.tsx
│  ├─ PrintSizeGuide.tsx
│  └─ ScannabilityBadge.tsx
└─ hooks/
   └─ useLogoPreview.ts
```

## Dependencia

Se habilita `sharp` mediante ADR aceptado.

## Reglas de logo

- PNG/JPEG/WebP;
- máximo 2 MB de entrada;
- máximo 1024x1024;
- re-encode PNG;
- remover metadata;
- máximo 20% inicial;
- ECC high obligatorio;
- excavación;
- no tocar finder patterns;
- round-trip.

## PNG

- tamaños permitidos;
- no aceptar dimensiones arbitrarias ilimitadas;
- fondo sólido;
- DPI como metadata solo si es correcto;
- no prometer calidad de impresión por DPI únicamente.

## Guía de impresión

La UI recomienda:

- margen;
- tamaño físico;
- contraste;
- prueba en material final;
- evitar superficies reflectivas;
- no recortar quiet zone.

## Caching

Solo cachear si:

- payload no es sensible;
- request hash estable;
- política explícita.

Por defecto `no-store`.

## Tareas

1. adapter `sharp`;
2. pipeline SVG -> PNG;
3. pipeline logo;
4. validación visual y round-trip;
5. límites CPU/memoria;
6. UI;
7. pruebas de tamaños;
8. fallos controlados.

## Pruebas

- PNG signature;
- dimensiones;
- logo válido;
- logo corrupto;
- logo gigante;
- SVG disfrazado;
- ECC forzado;
- contraste;
- decode final;
- concurrencia;
- rate limit.

## Criterios de aceptación

- PNG coincide con SVG;
- logos se re-encodean;
- exportación falla si no decodifica;
- no hay SVG de usuario;
- memoria estable bajo carga;
- UI explica límites.

## Puerta de salida

- [x] ADR sharp (`docs/adr/ADR-007-sharp.md`)
- [x] PNG
- [x] logo seguro
- [x] round-trip
- [x] carga
- [x] reporte (`docs/execution/PHASE-04-REPORT.md`)

> Cerrada el 2026-08-06. Evidencia: 153/153 tests, E2E 7/7, build OK, smoke Docker OK, 0 vulnerabilidades.
