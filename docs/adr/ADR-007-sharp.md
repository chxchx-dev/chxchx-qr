# ADR-007 — `sharp` para exportación PNG

## Estado

Aceptado. Alcance actualizado por ADR-009.

## Contexto

El encoder crea SVG, GIF y matrices QR. PNG requiere rasterizar el SVG. La API debe producir también esa salida sin depender de Canvas o DOM.

## Decisión

Usar `sharp` únicamente en `apps/api` para rasterizar SVG a PNG y obtener píxeles para verificar la imagen. `packages/qr-core` recibe un rasterizador por interfaz y no importa `sharp`.

## Consecuencias

- La web no empaqueta binarios nativos.
- El PNG final se decodifica con `jsqr`; si el payload no coincide, el render falla con `QR_RENDER_UNSCANNABLE`.
- El entorno de despliegue debe soportar el binario de `sharp` fijado en el lockfile.
- No se usan logos ni procesamiento de archivos subidos en el alcance actual.
