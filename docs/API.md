# API

La base es `/api/v1`. Los errores usan `application/problem+json`. Las respuestas incluyen `X-Request-Id`; las descargas no se guardan en caché.

## Contenido y opciones

`content` identifica el tipo de QR: `text`, `url`, `email`, `phone`, `sms`, `wifi`, `vcard`, `calendar` o `geo`. Los campos aceptados están definidos en [`packages/contracts/src/qr-content.schema.ts`](../packages/contracts/src/qr-content.schema.ts).

Las opciones predeterminadas son SVG, corrección media, tamaño 1024, margen de 4 módulos, primer plano negro y fondo blanco. También se admiten PNG y GIF; corrección `low`, `medium`, `quartile` o `high`; tamaño de 128 a 4096; margen de 0 a 16 módulos; y colores `#RGB` o `#RRGGBB`.

## Salud

- `GET /health/live`: confirma que el proceso responde.
- `GET /health/ready`: confirma que el motor QR está disponible.

## Validar

`POST /api/v1/qr/validate`

```json
{
  "content": { "type": "url", "url": "https://example.com" },
  "options": { "ecc": "medium", "size": 512 }
}
```

Devuelve la validez, el contenido QR normalizado, la densidad, advertencias y recomendaciones.

## Generar

`POST /api/v1/qr/render` recibe el mismo cuerpo y devuelve el archivo solicitado como adjunto (`image/svg+xml`, `image/png` o `image/gif`). PNG se rasteriza en el servidor y se comprueba que pueda leerse con el contenido esperado.

## Errores

La API puede responder `400` por contenido inválido, `415` por formato no admitido, `422` por capacidad o contraste insuficientes, `422` si el PNG no se puede leer y `429` al superar el límite por IP. La configuración de límites está en [Despliegue](DEPLOYMENT.md).
