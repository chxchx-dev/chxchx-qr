# 09 — Pruebas y calidad

## Comandos

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Cobertura relevante

- Builders: texto, URL, email, teléfono, SMS, WiFi, vCard, calendario y geo.
- Contratos: límites, normalización y opciones.
- Motor: matriz, capacidad, contraste, SVG y GIF.
- API: salud, errores, validación, render, descargas y rate limits.
- Aceptación API: decodifica la salida final de los 9 tipos en SVG, PNG y GIF y compara cada payload canónico.
- E2E: valida los 9 formularios, presenta la vista previa y descarga los tres formatos; también cubre el layout móvil.

Las pruebas son locales y no requieren PostgreSQL, storage externo ni contenedores. El script E2E inicia la web y API locales. CI conserva formato, lint, tipos, pruebas, build y auditoría de dependencias.

## Aceptación del generador

- `apps/api/test/qr-acceptance.test.ts` cubre las 27 combinaciones de contenido y formato; rasteriza SVG/GIF para decodificarlos con el mismo verificador independiente usado al validar PNG.
- `apps/web/test/e2e/content-types.spec.ts` recorre cada formulario hasta la validación de la API y la vista previa.
- `apps/web/test/e2e/url.spec.ts` verifica las descargas SVG, PNG y GIF desde la web.
- Comprobación manual: el usuario confirmó que pudo escanear con su celular un QR generado por la aplicación. Esta prueba confirma el flujo en un dispositivo; no implica que cada tipo de contenido y formato se haya probado con una cámara física.
- Las pruebas automatizadas validan la decodificación de imagen y el flujo web, no el comportamiento de cada modelo de cámara.
