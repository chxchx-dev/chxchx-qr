# 11 — Dependencias

Cada dependencia debe resolver una necesidad concreta y tener licencia y mantenimiento aceptables. El lockfile del monorepo fija las versiones instaladas.

## Ejecución

| Paquete | Uso |
|---|---|
| `express` | rutas HTTP del API |
| `zod` | validación runtime y contratos compartidos |
| `qr` | encoder QR local encapsulado en `packages/qr-core` |
| `jsqr` | decodificar el PNG final y comprobar el contenido |
| `sharp` | rasterizar SVG a PNG dentro del proceso API |
| `react`, `react-dom` | formulario web |

Vite, TypeScript, Biome, Vitest y Playwright se usan para desarrollo, build y calidad.

## Generación QR

La dependencia `qr` es una librería local, no una API alojada: las entradas no salen del proceso API para codificarse. Se importa desde un solo adaptador para que el resto del proyecto dependa de `@acore/qr-core`, no del encoder concreto. Su licencia dual permite MIT o Apache-2.0; la referencia oficial está en [`TECHNICAL-REFERENCES.md`](./references/TECHNICAL-REFERENCES.md).

No mantenemos un segundo encoder en el navegador. Si el proyecto exige que el código fuente del encoder también viva dentro del repositorio y use exclusivamente MIT, evaluar el generador TypeScript de Nayuki como sustitución completa, incluyendo vectores de compatibilidad y revisión de licencia antes de migrar.

## Regla de cambio

Antes de añadir o sustituir una dependencia, verificar problema, alternativas, licencia, estado de mantenimiento, seguridad, tamaño y plan de salida. No añadir SDK de proveedor ni servicio externo QR para el alcance vigente.
