# ADR-009 — Volver al generador de QR estáticos

## Estado

Aceptado.

## Contexto

El proyecto se había expandido a cuentas, QR dinámicos, archivos, logos, analítica y administración. Esas capacidades añadieron persistencia, procesos auxiliares y una interfaz de plataforma alrededor del objetivo original: generar QR estáticos de forma local. El objetivo actual requiere que la web sea delgada y que la API haga el trabajo de validación y generación.

## Decisión

- Acotar el producto a QR estáticos para texto, URL, correo, teléfono, SMS, WiFi, vCard, calendario y geo.
- Mantener la API como única autoridad de validación, generación, vista previa y exportación.
- Mantener SVG, PNG y GIF con motor QR ejecutado dentro de la API.
- Eliminar módulos y dependencias de archivos, logos, dinámicos, usuarios, sesiones, analítica, administración, base de datos y almacenamiento.
- No usar servicios remotos de generación QR ni añadir microservicios.
- Mantener Node.js/npm workspaces y el despliegue sin Docker.

## Consecuencias

- La web ya no importa el motor QR; solicita a la API la vista previa y la descarga.
- Las entradas no se persisten y no hay seguimiento de escaneos.
- El encoder `qr` permanece como dependencia local, encapsulada en `packages/qr-core`; PNG usa `sharp` y verificación con `jsqr`.
- Las fases antiguas y sus ADR siguen como registro histórico; no representan alcance vigente.
