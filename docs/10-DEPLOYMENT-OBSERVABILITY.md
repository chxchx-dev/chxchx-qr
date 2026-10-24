# 10 — Ejecución y despliegue

## Desarrollo

Desde la raíz, `npm run dev` compila los paquetes compartidos e inicia Vite y Express. La API permite el origen definido en `WEB_ORIGIN`.

## Producción

- Compilar desde la raíz con `npm run build`.
- Publicar `apps/web/dist` como sitio estático.
- Ejecutar `apps/api` con Node.js usando `npm run start -w apps/api`.
- Configurar `WEB_ORIGIN`, `PORT` y las variables de límite según el entorno.
- Usar HTTPS y terminar TLS en la plataforma o proxy del despliegue.
- Enviar `SIGTERM` para un apagado ordenado.

No se necesita PostgreSQL, Redis, storage, una API QR externa ni Docker. PNG depende del paquete nativo `sharp`; el entorno de Node debe ser compatible con la versión fijada en el lockfile.

## Salud

- `/health/live`: confirma que el proceso responde.
- `/health/ready`: confirma que el motor QR está disponible.

No se registran cuerpos de solicitud. Los despliegues deben mantener esa regla en proxy y telemetría.
