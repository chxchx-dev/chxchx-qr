# acore-qr — guía del proyecto

## Objetivo

Mantener un generador pequeño de QR estáticos. La aplicación acepta datos estructurados, valida que se puedan codificar y deja que la API genere SVG, PNG o GIF. No consulta una API de terceros ni persiste el contenido.

## Límites de producto

Incluido: nueve tipos de contenido, validación, corrección de errores, color, tamaño, margen, vista previa y descarga.

Fuera de alcance vigente: archivos alojados, logos, QR dinámicos, redirecciones, usuarios, historial, analítica, administración, base de datos y microservicios.

## Pila

- Node.js + TypeScript estricto.
- API Express 5.
- Web React + Vite.
- Zod para contratos.
- `qr` encapsulado por `packages/qr-core`; `sharp` para PNG y `jsqr` para verificar el PNG final.
- npm workspaces. Sin Docker.

## Responsabilidades

- `apps/web`: campos, validación inmediata de forma orientativa, llamada a la API, vista previa y descarga.
- `apps/api`: validación autoritativa, generación y entrega de archivos.
- `packages/qr-core`: payload canónico, capacidad, contraste y matriz/código QR.
- `packages/contracts`: esquemas compartidos.
- `packages/config`: lectura tipada del entorno.

## Documentos que mandan

Lee primero `01-VISION-SCOPE.md`, `02-ARCHITECTURE.md`, `api/QR-ENDPOINTS.md` y `11-DEPENDENCY-POLICY.md`. El historial de fases no amplía el alcance vigente.
