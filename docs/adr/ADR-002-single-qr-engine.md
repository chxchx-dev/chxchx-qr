# ADR-002 — Un único motor QR encapsulado en `qr-core`

## Estado

`accepted`

## Fecha

2026-08-05

## Contexto

La vista previa (navegador) y la descarga (servidor) deben producir exactamente el mismo QR: mismo margen, mismo ECC, mismos colores, misma normalización. Si cada lado usara una librería o configuración distinta, los QR se verían bien en la vista previa pero fallarían al escanear la descarga.

## Fuerzas

- consistencia: preview y exportación idénticas;
- seguridad: una única superficie de validación y escape;
- mantenimiento: un lugar donde corregir bugs de generación;
- compatibilidad: Node sin DOM ni Canvas para el servidor;
- dependencias: un solo encoder auditable.

## Opciones

### Opción A — Encapsular `qr` (Paul Miller) en `packages/qr-core`

Ventajas: un único motor compartido por web y API; generación SVG/GIF/matriz cruda desde npm `qr`; adaptador PNG explícito (sin asumir DOM); mismas reglas y valores por defecto en ambos lados; mismos vectores de prueba.
Desventajas: exige adaptador propio para PNG en servidor (Fase 02).
Riesgos: bajo; mitigado con round-trip y vectores estables en `test-fixtures`.

### Opción B — Motor distinto en web (Canvas) y servidor (librería X)

Ventajas: ninguno real para el producto.
Desventajas: divergencia garantizada de márgenes, ECC o colores; dos conjuntos de bugs; dos librerías que mantener; contradice el criterio "la exportación debe decodificar".
Riesgos: crítico para el producto (QR que no escanea).

### Opción C — Solo frontend con librería Canvas

Ventajas: implementación inicial simple.
Desventajas: sin API de renderizado oficial; el backend no puede generar el resultado canónico; imposible el flujo de archivos y dinámicos posterior.
Riesgos: bloquea Fases 05 y 06.

## Decisión

**Opción A.** `packages/qr-core` encapsula a `qr`. Ninguna aplicación importa `qr` directamente. El adaptador PNG se define explícitamente (opcionalmente `sharp`, ADR-007) sin depender de DOM/Canvas en el servidor. La vista previa en el navegador puede rasterizar para previsualización local, pero la descarga oficial proviene del backend.

## Consecuencias positivas

- preview y descarga idénticas por construcción;
- una sola normalización, validación y escapado;
- los tests de `qr-core` valen para ambos lados;
- `qr` es auditable, sin dependencias propias.

## Consecuencias negativas

- la web no puede decidir reglas de negocio sensibles del QR (debe llamar a la API para exportar);
- coste de adaptador PNG en servidor.

## Riesgos y controles

- divergencia de comportamiento → vectores estables en `packages/test-fixtures` y round-trip obligatorio;
- dependencia pesada no justificada → solo `qr` (y `sharp` cuando aplique, ADR-007);
- cambio de librería → requiere ADR (cambio mayor) y migración con vectores.

## Plan de implementación

1. Fase 01: crear `packages/qr-core` con export vacío controlado.
2. Fase 02: builders por tipo, normalización, validación de capacidad, render SVG/GIF y adaptador PNG; pruebas round-trip.
3. Fase 02: exponer por API `POST /api/v1/qr/render` usando solo `qr-core`.

## Plan de salida

Sustituir el encoder exigiría: ADR nuevo, migrar builders y vectores, y ejecutar round-trip completo antes de cerrar la fase. No se permite un segundo motor activo en paralelo.

## Referencias

- `docs/02-ARCHITECTURE.md` §3 y §6.
- `docs/13-DECISIONS-AND-RISKS.md` ADR-002 y ADR-007.
- `docs/04-DOMAIN-CONTENT-TYPES.md`.
