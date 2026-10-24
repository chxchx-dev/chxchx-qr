# 02 — Arquitectura

## Vista general

```text
React + Vite
    │ JSON: validar / renderizar
    ▼
Express API ──> @acore/qr-core ──> paquete local `qr`
    │                                  │
    └── PNG: SVG ──> sharp ──> jsqr ──┘
```

La API genera todos los artefactos. La web no importa `qr-core` ni genera matrices QR en el navegador. Ninguna petición de contenido se envía a un proveedor QR externo.

## Paquetes

- `apps/web`: formulario ligero, vista previa servida por la API y descarga del archivo final.
- `apps/api`: rutas HTTP, esquemas, límites por IP, generación y renderizado.
- `packages/qr-core`: builders y lógica pura del QR; `qr` se importa en un único adaptador.
- `packages/contracts`: esquemas Zod para contenido, opciones y respuestas.
- `packages/config`: configuración mínima validada al iniciar.

## Flujo estático

```text
Formulario -> contrato -> POST /qr/validate -> payload canónico
                                      └──────> POST /qr/render -> archivo
```

La web puede revisar la forma de los campos para orientar al usuario, pero la API vuelve a validar el contenido y las opciones antes de cada resultado. La vista previa pide SVG al endpoint de render; la descarga pide el formato escogido.

## Formatos

- SVG se dibuja desde la matriz QR, sin scripts ni referencias externas.
- GIF se genera mediante el adaptador del encoder.
- PNG rasteriza el SVG en el servidor con `sharp`; el PNG final se decodifica con `jsqr` y se compara con el payload canónico.

## Estado y datos

La aplicación no tiene modelo persistente. Las peticiones se procesan en memoria y la respuesta no se conserva. No se inicia conexión a base de datos ni a almacenamiento de archivos.

## Ejecución

`npm run dev` compila los paquetes compartidos y arranca web y API. Producción publica `apps/web/dist` como contenido estático y ejecuta la API sobre Node.js. No se mantiene una imagen o configuración de contenedores en el repositorio.
