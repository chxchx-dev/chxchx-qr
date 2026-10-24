# ADR-008 — Ejecutar sin Docker

## Estado

Aceptado.

## Contexto

El generador se ejecuta con Node.js y npm workspaces; la web se publica como contenido estático y la API como proceso Node. Mantener Dockerfiles, Compose y un servidor web auxiliar duplicaría los comandos disponibles y no aporta una dependencia necesaria al alcance actual.

## Decisión

El desarrollo y despliegue del repositorio usan npm y Node.js. Se eliminaron Dockerfiles, Compose, `.dockerignore` y el servidor estático de apoyo. La CI no requiere servicios de contenedor.

## Consecuencias

- Desarrollo: `npm run dev` desde la raíz.
- Producción: publicar `apps/web/dist` y ejecutar la API con Node.js.
- No se necesita PostgreSQL, storage persistente ni Docker.
- Cada entorno proporciona una versión compatible de Node y sus variables.
