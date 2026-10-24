# 07 — Seguridad y privacidad

## Alcance

El servidor recibe texto de usuario y opciones QR. No recibe archivos subidos, no accede al destino de una URL y no persiste las entradas.

## Validación

- Contrato Zod en la API para contenido y opciones.
- URLs limitadas a `http:` y `https:`, sin credenciales embebidas.
- Tamaño, longitud, colores, margen y formato limitados por esquema.
- Capacidad QR calculada antes de renderizar.
- Rate limit en memoria por IP en rutas de validar y renderizar.

## Respuestas

- `X-Content-Type-Options: nosniff` en todas las respuestas.
- Descargas con `Content-Disposition: attachment` y `Cache-Control: no-store`.
- SVG generado internamente, sin scripts, enlaces ni referencias externas.
- Errores con códigos estables y sin stack traces en producción.

## Privacidad

El contenido se procesa para la petición y no se guarda en base de datos, disco ni analítica. Los despliegues deben evitar registrar cuerpos JSON en proxies y herramientas de observabilidad. Los QR estáticos no son editables ni rastreables una vez descargados.

## Fuera de alcance

La política anterior de archivos, logos, cuentas y redirecciones quedó archivada junto con las fases históricas; esas funciones no existen en el producto actual.
