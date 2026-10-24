# ADR-002 — Encoder QR único encapsulado

## Estado

Aceptado. Alcance actualizado por ADR-009.

## Decisión

Encapsular el encoder `qr` en `packages/qr-core`. Solo la API importa ese paquete para validar, generar la vista previa y producir descargas. La web no incluye encoder.

## Motivo

Un motor en el servidor evita diferencias entre la vista previa y el archivo descargado y mantiene validación y escapado en una única implementación.

## Consecuencias

- Los builders, normalización, límites y matriz QR comparten contratos.
- `qr` es una dependencia ejecutada localmente; no consulta una API remota.
- PNG se completa en la API con el rasterizador `sharp` de ADR-007.
- Sustituir el encoder requiere revisar payloads canónicos, formatos, licencia y vectores de lectura.
