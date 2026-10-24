# Documentación vigente de acore-qr

acore-qr vuelve a su objetivo inicial: generar QR estáticos localmente, sin llamar a un servicio externo de códigos QR. La API es la autoridad para validar, generar y exportar; la web solo recoge datos, presenta el SVG generado por la API y descarga el formato elegido.

## Alcance vigente

- Contenido: texto, URL, correo, teléfono, SMS, WiFi, vCard, calendario y geo.
- Salida: SVG, PNG y GIF.
- Runtime: Node.js y npm workspaces; no Docker, base de datos, almacenamiento ni servicios externos.
- La generación no guarda contenido. Un QR estático no se puede editar ni medir después de descargarlo.

## Documentos de referencia

1. [Visión y alcance](./01-VISION-SCOPE.md)
2. [Arquitectura](./02-ARCHITECTURE.md)
3. [Reglas globales](./03-GLOBAL-RULES.md)
4. [Tipos de contenido](./04-DOMAIN-CONTENT-TYPES.md)
5. [Contrato de API](./api/QR-ENDPOINTS.md)
6. [Seguridad y privacidad](./07-SECURITY-FILE-POLICY.md)
7. [Pruebas y calidad](./09-TESTING-QUALITY.md)
8. [Despliegue](./10-DEPLOYMENT-OBSERVABILITY.md)
9. [Dependencias](./11-DEPENDENCY-POLICY.md)
10. [Variables de entorno](./12-ENVIRONMENT-CONFIG.md)
11. [Decisiones y riesgos](./13-DECISIONS-AND-RISKS.md)
12. [Brief del producto](./product/PRODUCT-BRIEF.md)

## Historial

`execution/`, `phases/` y los ADR anteriores conservan decisiones e informes del desarrollo que produjo la aplicación más amplia. Esos archivos son antecedentes, no una lista de funciones vigentes ni una hoja de ruta. ADR-009 redefine el alcance actual.

## Comandos rápidos

```bash
npm ci
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm run dev
```
