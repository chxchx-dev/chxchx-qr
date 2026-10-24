# 03 — Reglas globales

1. El contenido se valida en la API antes de generar un QR.
2. La web no implementa un segundo encoder QR.
3. El API no hace fetch de URLs incluidas en el contenido.
4. Solo se aceptan URLs `http:` y `https:`; se rechazan credenciales embebidas y esquemas ejecutables.
5. No se guardan solicitudes, contraseñas WiFi ni archivos generados.
6. No se añade una dependencia sin comprobar mantenimiento, licencia, seguridad y necesidad.
7. Las respuestas de error usan Problem Details y no revelan trazas en producción.
8. Las opciones de tamaño y contenido tienen límites en el contrato.
9. No se reintroducen cuentas, archivos, logos, analítica ni QR dinámicos sin una nueva decisión de alcance.
10. Mantener npm workspaces y el despliegue Node/web estática; no agregar Docker.

## Convenciones

- TypeScript estricto, ESM y nombres explícitos.
- Las rutas se limitan a HTTP; controladores traducen contrato y errores; el motor no importa Express.
- Código de interfaz solo presenta y recoge datos; reglas QR viven en `packages/qr-core` y `apps/api`.
- Los ejemplos de entorno son seguros y no contienen secretos.
