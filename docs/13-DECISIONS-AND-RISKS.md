# 13 — Decisiones y riesgos vigentes

## Decisiones

- [ADR-001](./adr/ADR-001-monorepo.md): monorepo npm workspaces.
- [ADR-002](./adr/ADR-002-single-qr-engine.md): encoder único encapsulado en `packages/qr-core`.
- [ADR-007](./adr/ADR-007-sharp.md): rasterización PNG con `sharp`.
- [ADR-008](./adr/ADR-008-no-docker.md): ejecución Node/npm sin Docker.
- [ADR-009](./adr/ADR-009-static-generator-scope.md): alcance actual de QR estáticos y API como generadora única.

Las decisiones sobre archivos, logos, cuentas, base de datos, dinámicos y analítica describen una etapa anterior y no representan funciones disponibles.

## Riesgos

| Riesgo | Control actual |
|---|---|
| QR demasiado denso o grande | capacidad del encoder, estados de densidad y rechazo de overflow |
| Contraste insuficiente | cálculo de contraste antes de render |
| Payload de URL peligroso | solo HTTP/HTTPS, sin credenciales; nunca se consulta la URL |
| Abuso de CPU | límites de tamaño, límites por IP y cuota menor para PNG |
| Dato sensible en registros | no registrar cuerpos de petición; no persistencia |
| Dependencia del encoder | encoder único encapsulado, lockfile y CI |
| Rate limit no compartido | cuota por proceso; escalar réplicas requiere una decisión aparte |
| Hosting incompatible con PNG nativo | comprobar soporte de `sharp` en el runtime de producción |

## Criterio para ampliar alcance

Una nueva capacidad debe resolver una necesidad concreta del generador, conservar una web ligera y documentar cómo afecta a privacidad, dependencias, operación y mantenimiento.
