# `@chxchx/qr-core`

Motor QR del proyecto chxchx-qr. Construye el contenido QR canónico, valida capacidad y contraste, y genera SVG o GIF. La API usa este paquete para ofrecer también PNG.

## Estado del paquete

Este paquete es privado y no está publicado en npm. Puedes crear una copia instalable en tu equipo y usarla desde otro proyecto local. Como el motor comparte contratos internos, instala los dos tarballs locales: `@chxchx/contracts` y `@chxchx/qr-core`.

## Crear los paquetes locales

Desde la carpeta principal de chxchx-qr, compila y crea los paquetes:

```bash
npm ci                 # solo hace falta la primera vez
npm run pack:local
```

El comando deja los archivos `.tgz` en `artifacts/local/`. Esa carpeta se genera localmente y no se sube al repositorio.

## Instalar en un proyecto de prueba

En la terminal de tu proyecto de prueba, instala ambos archivos. Cambia la ruta por la carpeta donde guardaste chxchx-qr y conserva las comillas si tiene espacios.

macOS o Linux:

```bash
npm install "/ruta/a/chxchx-qr/artifacts/local/chxchx-contracts-0.1.0.tgz" "/ruta/a/chxchx-qr/artifacts/local/chxchx-qr-core-0.1.0.tgz"
```

Windows PowerShell:

```powershell
npm install "C:\ruta\a\chxchx-qr\artifacts\local\chxchx-contracts-0.1.0.tgz" "C:\ruta\a\chxchx-qr\artifacts\local\chxchx-qr-core-0.1.0.tgz"
```

Los nombres llevan la versión definida en los `package.json`; si la versión cambia, usa los nombres que muestre `npm run pack:local`. Al cambiar el código de chxchx-qr, vuelve a crear los paquetes y ejecuta otra vez el comando de instalación en el proyecto de prueba para actualizar la copia.

La instalación de estos paquetes es local: no sube tu código a internet, no publica los paquetes y no despliega el generador. npm sí descarga las dependencias públicas del motor la primera vez que las instales.

## Ejemplo: generar un SVG

Desde el proyecto que instaló los tarballs:

```ts
import { writeFile } from "node:fs/promises";
import { DEFAULT_QR_OPTIONS, renderQr, validateQr } from "@chxchx/qr-core";
import type { QrContent } from "@chxchx/qr-core";

const content: QrContent = { type: "text", text: "Hola desde chxchx-qr" };
const options = { ...DEFAULT_QR_OPTIONS, format: "svg" as const };

const validation = validateQr({ content, options });
console.log("Densidad:", validation.density);
console.log("Advertencias:", validation.warnings);

const image = renderQr({ content, options });
await writeFile(image.filename, image.body);
```

La salida queda en `qr-code.svg`. `validateQr` y `renderQr` reciben un objeto con `content` y `options`. `QrContent` describe los nueve tipos admitidos; `DEFAULT_QR_OPTIONS` trae valores seguros para empezar.

## Formatos

- `renderQr` genera SVG y GIF de forma síncrona.
- `renderPng` genera PNG de forma asíncrona y recibe una función rasterizadora. La API pasa una implementación basada en `sharp`.
- Los colores personalizados se usan en SVG y PNG. GIF usa sus colores predeterminados.

## Exports principales

- `buildCanonicalPayload(content)`: convierte el tipo de contenido en el texto que se guarda dentro del QR y devuelve advertencias.
- `validateQr({ content, options })`: comprueba capacidad, contraste y densidad.
- `renderQr({ content, options })`: crea SVG o GIF.
- `renderPng({ content, options }, rasterize)`: crea PNG usando el rasterizador proporcionado.
- `DEFAULT_QR_OPTIONS`: opciones predeterminadas.
- `QrContent` y `QrRenderOptions`: tipos para TypeScript.

El paquete confía en que `content` ya tenga la forma de `QrContent`. Para validar datos que vienen de usuarios o de JavaScript sin tipos, usa primero los esquemas de `@chxchx/contracts` o utiliza la API de la aplicación, que valida la entrada antes de generar la imagen.

## Límites

- El paquete funciona en proyectos Node.js con módulos ES (`type: "module"`).
- `renderQr` genera SVG o GIF. PNG requiere llamar a `renderPng` y pasarle un rasterizador; la aplicación chxchx-qr usa `sharp` para ese paso.
- Los paquetes siguen siendo privados y no están publicados en npm. Para compartirlos con otra computadora, copia ambos `.tgz` de forma privada y vuelve a instalarlos desde esa ruta.
