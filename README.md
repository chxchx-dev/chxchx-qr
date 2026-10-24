# acore-qr

Generador de **QR estáticos**. La API valida el contenido y genera la imagen en el servidor; la web es una interfaz pequeña para completar el formulario, ver el resultado y descargarlo. La generación no llama a servicios QR externos y no necesita cuentas, base de datos ni Docker.

## Qué incluye

- Nueve tipos de contenido: texto, URL, correo, teléfono, SMS, WiFi, contacto vCard, evento y ubicación.
- Opciones de corrección de errores, tamaño, margen y colores con contraste validado.
- Salidas SVG, PNG y GIF.
- Vista previa y descarga generadas por la misma API.
- Contratos y motor QR locales al monorepo; no se persisten los datos enviados.

El generador usa el paquete local `qr` desde `packages/qr-core`. Ese paquete crea las matrices y formatos QR sin consultar una API remota. PNG se rasteriza en la API con `sharp` y se verifica con `jsqr`.

## Estructura

- `apps/web`: formulario React y presentación de la vista previa.
- `apps/api`: validación, generación, renderizado y descargas.
- `packages/qr-core`: builders de contenido y motor QR.
- `packages/contracts`: esquemas compartidos para contenido y opciones.
- `packages/config`: validación de variables de entorno.
- `docs`: alcance vigente, contratos y decisiones. Los informes de fases antiguas quedan como archivo histórico.

## Requisitos

- Node.js 24 (el `package.json` acepta `>=20.19.0`).
- npm.

## Desarrollo local

```bash
npm ci
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run dev
```

La web abre en `http://localhost:5173` y la API en `http://localhost:4000`. La configuración de ejemplo es suficiente para empezar; no hacen falta servicios adicionales.

## Comandos

```bash
npm run dev          # inicia web y API
npm run build        # compila paquetes, API y web
npm run typecheck    # comprueba los tipos
npm run lint         # Biome
npm test             # pruebas de paquetes y aplicaciones
npm run test:e2e     # flujo web completo con Playwright
```

## Alcance

Este proyecto genera códigos estáticos: cada QR contiene directamente el contenido indicado y no es editable ni rastreable después de descargarlo. No incluye QR dinámicos, archivos alojados, cuentas, historial ni analítica. El alcance y las siguientes decisiones están en [`docs/README.md`](docs/README.md).

## Licencia

Proyecto privado. La distribución del proyecto se rige por la decisión de su propietario; las licencias de las dependencias se detallan en [`docs/11-DEPENDENCY-POLICY.md`](docs/11-DEPENDENCY-POLICY.md).
