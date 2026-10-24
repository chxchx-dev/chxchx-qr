# 05 — Contratos de API

La especificación vigente de las rutas está en [`api/QR-ENDPOINTS.md`](./api/QR-ENDPOINTS.md). La API usa `/api/v1`, JSON y errores `application/problem+json`.

## Endpoints

- `GET /health/live`: proceso activo.
- `GET /health/ready`: motor QR disponible.
- `POST /api/v1/qr/validate`: valida contenido y opciones; responde con payload canónico, densidad, avisos y recomendaciones.
- `POST /api/v1/qr/render`: genera el formato pedido y lo entrega como archivo adjunto.

Todos los endpoints aplican request ID y `X-Content-Type-Options: nosniff`. La API no expone rutas de cuentas, archivos, QR dinámicos o analítica.
