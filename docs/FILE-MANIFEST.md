# Inventario de alto nivel

## Producto vigente

- `apps/web`: interfaz React/Vite del generador.
- `apps/api`: API Express para salud, validación y renderizado QR.
- `packages/qr-core`: builders, encoder adapter, renderizadores y validación QR.
- `packages/contracts`: esquemas de contenido, opciones, errores y respuestas.
- `packages/config`: lectura de configuración de API y web.

## Operación

- npm workspaces y `package-lock.json`.
- CI de calidad y escaneo de secretos.
- `apps/api/.env.example`, `apps/web/.env.example`.
- Sin Docker, base de datos, uploads ni almacenamiento persistente.

## Histórico

`docs/execution/` y `docs/phases/` registran el desarrollo anterior. ADR-009 define qué partes siguen dentro del alcance.
