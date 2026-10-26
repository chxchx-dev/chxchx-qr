# Despliegue

El proyecto tiene dos partes: una web estática y una API Node.js. No requiere base de datos, almacenamiento, servicios QR externos ni Docker.

## Compilar

Usa Node.js 24 y ejecuta desde la raíz:

```bash
npm ci
npm run build
```

Publica `apps/web/dist` en un host de sitios estáticos. Ejecuta la API desde el mismo repositorio con `npm run start -w apps/api`; el proceso escucha en `PORT` (4000 por defecto). El entorno debe ser compatible con `sharp`, usado para generar PNG.

## Configuración

Define `VITE_API_BASE_URL` al compilar la web:

- Mismo dominio y proxy hacia la API: `/api/v1` (predeterminado).
- Dominios separados: URL pública completa de la API, por ejemplo `https://api.example.com/api/v1`.

En la API, define `WEB_ORIGIN` con el origen de la web. Si ambos servicios usan el mismo dominio, configura el proxy para enviar `/api` a la API. También puedes ajustar `PORT`, `TRUST_PROXY`, `REQUEST_BODY_LIMIT` y `RATE_LIMIT_*`; sus valores predeterminados están en [`apps/api/.env.example`](../apps/api/.env.example). La web solo debe contener variables `VITE_*` públicas.

La API ofrece `GET /health/live` y `GET /health/ready` para las comprobaciones de salud. Usa HTTPS en producción. Los límites de solicitudes se guardan en memoria por proceso y reinician al reiniciarlo.
