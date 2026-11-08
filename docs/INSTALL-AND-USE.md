# Instalar, ejecutar y reutilizar chxchx-qr

Esta guía explica el proyecto paso a paso. Si ya tienes Node.js y el repositorio en tu equipo, empieza en [Instalar dependencias](#2-instalar-dependencias).

En palabras simples: la **web** es la pantalla que usas; la **API** es el servicio que valida la información y dibuja el QR. Puedes ejecutar ambas localmente o instalar el motor QR en otro proyecto para hacer pruebas.

## 1. Qué necesitas

- **Node.js 24** es la versión recomendada por este repositorio. El archivo `.nvmrc` la indica.
- **npm** viene incluido al instalar Node.js; no se instala por separado.
- **Git** sirve para descargar el código. Instálalo desde [git-scm.com](https://git-scm.com/) y comprueba la instalación con `git --version`. También puedes bajar el repositorio como ZIP y saltarte Git.
- Para probar E2E localmente necesitas Chromium de Playwright; se instala en el paso de pruebas.

Descarga Node.js desde [nodejs.org](https://nodejs.org/). Después abre una terminal nueva y confirma que ambos comandos muestran una versión:

```bash
node --version
npm --version
```

El proyecto no necesita Docker, base de datos, Redis ni una cuenta de QR externa.

## 2. Descargar el proyecto

Con Git, reemplaza `<URL_DEL_REPOSITORIO>` por la dirección del repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
cd chxchx-qr
```

Si descargaste un ZIP, descomprímelo y abre una terminal dentro de la carpeta `chxchx-qr`.

**Importante:** ejecuta los comandos desde la carpeta principal, donde están `package.json` y `package-lock.json`. El repositorio contiene varias aplicaciones que comparten dependencias.

## 3. Instalar dependencias

```bash
npm ci
```

Esto descarga las versiones guardadas en `package-lock.json`. Puede tardar unos minutos la primera vez. Si termina sin errores, no necesitas instalar paquetes por separado para la web, la API o el motor QR.

## 4. Preparar la configuración local (opcional)

Los valores de ejemplo sirven para empezar. Si quieres guardar una configuración local, copia estos dos archivos de ejemplo.

macOS o Linux:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Windows PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Los archivos `.env` son para tu computadora y no se suben al repositorio. Los ejemplos no contienen contraseñas ni claves. La lista de variables está en [`apps/api/.env.example`](../apps/api/.env.example) y [`apps/web/.env.example`](../apps/web/.env.example).

## 5. Ejecutar la aplicación

Desde la carpeta principal:

```bash
npm run dev
```

Este comando prepara los paquetes compartidos y enciende dos procesos: la página web y la API.

- Abre la web en <http://localhost:5173>.
- La API está en <http://localhost:4000>.
- <http://localhost:4000/health/live> confirma que la API responde.
- <http://localhost:4000/health/ready> confirma que el motor QR está disponible.

Para detenerlos, vuelve a la terminal y presiona `Ctrl+C`.

La web le pide a la API que valide los datos y genere el QR. Puedes usar texto, URL, correo, teléfono, SMS, WiFi, contacto, evento o ubicación, y descargar el resultado en SVG, PNG o GIF.

### Cómo usar el generador

1. **Elige el tipo de información** que quieres poner en el QR.
2. **Completa los campos.** Por ejemplo, una URL necesita una dirección web; WiFi necesita el nombre de la red y, si tiene seguridad, su contraseña.
3. **Revisa las opciones.** Puedes cambiar corrección de errores, tamaño, margen y colores. La corrección alta agrega protección contra daños, pero también hace el dibujo más denso. Conserva buen contraste entre el color del QR y el fondo.
4. **Mira la vista previa.** Los errores explican qué campo corregir; las advertencias dan recomendaciones. Puedes ampliar la vista previa con los botones de zoom.
5. **Elige el formato**, escribe el nombre del archivo y descarga. SVG se adapta bien a distintos tamaños; PNG y GIF son imágenes de tamaño fijo. También puedes copiar el contenido del QR.
6. **Prueba el archivo antes de imprimirlo o compartirlo.** Escanéalo con un teléfono y confirma que abre el contenido esperado.

Un QR estático guarda la información dentro de la imagen: después de descargarla no se puede editar ni medir cuántas veces se escaneó. No incluyas datos que no quieras compartir. En particular, un QR de WiFi puede dar a quien lo escanee acceso a esa red. Los colores personalizados se aplican al SVG; GIF usa los colores predeterminados.

### Instalar el motor en otro proyecto local

Si quieres reutilizar el motor en un proyecto de prueba separado, crea dos paquetes instalables desde este repositorio. No se publican en internet: se guardan como archivos en tu disco.

Desde la carpeta principal de chxchx-qr:

```bash
npm run pack:local
```

Se crean archivos `.tgz` dentro de `artifacts/local/`: uno contiene el contrato que necesita el motor y el otro contiene `@chxchx/qr-core`. En la terminal de tu proyecto de prueba, instala los dos con las rutas donde los guardaste:

macOS o Linux:

```bash
npm install "/ruta/a/chxchx-qr/artifacts/local/chxchx-contracts-0.1.0.tgz" "/ruta/a/chxchx-qr/artifacts/local/chxchx-qr-core-0.1.0.tgz"
```

Windows PowerShell:

```powershell
npm install "C:\ruta\a\chxchx-qr\artifacts\local\chxchx-contracts-0.1.0.tgz" "C:\ruta\a\chxchx-qr\artifacts\local\chxchx-qr-core-0.1.0.tgz"
```

Reemplaza las rutas y, si cambian las versiones, usa los nombres impresos por `npm run pack:local`. Cuando cambies el motor, vuelve a generarlos y corre otra vez `npm install` desde el proyecto de prueba para actualizar su copia.

Después importa el paquete así:

Ejemplo de uso para generar un SVG desde Node.js:

```ts
import { writeFile } from "node:fs/promises";
import { DEFAULT_QR_OPTIONS, renderQr } from "@chxchx/qr-core";
import type { QrContent } from "@chxchx/qr-core";

const content: QrContent = {
  type: "url",
  url: "https://example.com",
};

const result = renderQr({
  content,
  options: { ...DEFAULT_QR_OPTIONS, format: "svg" },
});

await writeFile(result.filename, result.body);
```

`renderQr` genera SVG o GIF. El PNG usa `renderPng` con un rasterizador que se entrega desde fuera; la API conecta ese paso con `sharp`. Consulta el [README del paquete](../packages/qr-core/README.md) para los límites y las funciones disponibles. La instalación del motor es local: no sube tu código ni publica nada en npm, y no requiere alojarlo en un servidor. npm sí descargará las dependencias públicas del motor la primera vez que lo instales.

## 6. Ejecutar las pruebas E2E

Una prueba E2E recorre la aplicación como lo haría una persona: abre la página, llena formularios y comprueba que la API responda y que la interfaz muestre el resultado.

La primera vez, instala el navegador que usa Playwright:

```bash
npx playwright install chromium
```

En Linux, si faltan librerías del sistema, puedes instalar también esas dependencias:

```bash
npx playwright install --with-deps chromium
```

Luego, desde la carpeta principal:

```bash
npm run test:e2e
```

No tienes que encender la API ni la web a mano. Playwright compila los paquetes compartidos, inicia los dos procesos, espera a que respondan, ejecuta las pruebas y los cierra al terminar. El comando funciona en Windows, macOS y Linux; no requiere Bash ni `curl`.

La suite recorre los nueve tipos de contenido, comprueba la vista previa y validación, descarga SVG/PNG/GIF y revisa el diseño móvil. Las pruebas de interfaz usan Chromium. Para repetir una prueba desde cero, cierra los servidores de desarrollo que estén usando los puertos `4000` y `5173` antes de ejecutar E2E.

## 7. Otros comandos útiles

Ejecuta estos comandos desde la carpeta principal:

| Comando | Para qué sirve |
| --- | --- |
| `npm test` | Ejecuta las pruebas unitarias e integración. |
| `npm run test:e2e` | Recorre la web y la API en un navegador. |
| `npm run typecheck` | Busca errores de tipos en TypeScript. |
| `npm run lint` | Revisa reglas de código con Biome. |
| `npm run format:check` | Comprueba el formato sin cambiar archivos. |
| `npm run build` | Comprueba que API y web se puedan compilar para producción. |

En GitHub Actions, el archivo [CI](../.github/workflows/ci.yml) ejecuta estos controles, instala Chromium para E2E y revisa dependencias y secretos.

## 8. Problemas comunes

- **`node` o `npm` no aparecen:** instala Node.js, cierra la terminal y abre otra.
- **La web abre pero no genera:** confirma que la API responde en `/health/live` y que en desarrollo se abrió `http://localhost:5173`.
- **E2E dice que falta Chromium:** ejecuta `npx playwright install chromium` y repite el comando.
- **Un puerto ya está ocupado:** cierra los procesos anteriores que usan `4000` o `5173`, y vuelve a ejecutar.
- **La web abre pero no genera en un VPS:** revisa que `WEB_ORIGIN` sea el origen exacto de la web y que `VITE_API_BASE_URL` apunte a la URL de la API.
- **PNG falla:** comprueba que la instalación de `sharp` terminó bien en el entorno Node.

## Qué incluye el producto

chxchx-qr crea QR estáticos: el texto queda dentro del código y no se puede editar ni rastrear después de descargarlo. No incluye cuentas, historial, analítica, QR dinámicos ni almacenamiento de datos.
