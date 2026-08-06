# Plan de Fase 00 — Descubrimiento y Cierre de Alcance

## Objetivo

Cerrar las 12 decisiones obligatorias de la fase y congelar el contrato del MVP antes de crear código.

## Decisiones tomadas (2026-08-05)

| # | Decisión | Valor |
|---|---|---|
| 1 | Nombre del producto | **acore-qr** |
| 2 | Dominio principal | Generación de códigos QR (estáticos primero, dinámicos después) |
| 3 | MVP anónimo | Sí — generar y descargar sin crear cuenta |
| 4 | Tipos de contenido iniciales | texto, URL, correo, teléfono, SMS, WiFi, vCard, calendario, ubicación |
| 5 | Formatos iniciales | SVG (canónico), GIF, PNG (servidor vía adaptador) |
| 6 | Tamaño máximo de texto | **500 caracteres** |
| 7 | PNG servidor | **Activado** (aprobado en esta fase); el detalle técnico del adaptador se formaliza como ADR-007 en la Fase 02 |
| 8 | Archivos en el primer release | No — entran en Fase 05 |
| 9 | Política de expiración de archivos | Fuera del MVP (se define en Fase 05) |
| 10 | Países/idiomas iniciales | **es + en** (i18n desde el inicio) |
| 11 | Diseño visual | **Dark-first** (oscuro por defecto, modo claro disponible) |
| 12 | Licencia del código | **MIT** |

## Alcance

- documentos de producto (`docs/product/`);
- 3 ADR iniciales (`docs/adr/`);
- plan y reporte de ejecución (`docs/execution/`).

## Fuera de alcance

- código de producción;
- base de datos;
- autenticación;
- carga real de archivos;
- analítica;
- cualquier implementación de fases 01–09.

## Archivos por crear

| Ruta | Responsabilidad |
|---|---|
| `docs/execution/PHASE-00-PLAN.md` | este plan |
| `docs/product/PRODUCT-BRIEF.md` | problema, usuario, propuesta |
| `docs/product/MVP-SCOPE.md` | incluido y excluido |
| `docs/product/USER-FLOWS.md` | flujos principales |
| `docs/product/CONTENT-MATRIX.md` | tipos y campos |
| `docs/product/NON-FUNCTIONAL.md` | rendimiento, seguridad, disponibilidad |
| `docs/adr/ADR-001-monorepo.md` | monorepo |
| `docs/adr/ADR-002-single-qr-engine.md` | motor único |
| `docs/adr/ADR-003-file-as-url.md` | archivos mediante URL |
| `docs/execution/PHASE-00-REPORT.md` | cierre |

## Archivos por modificar

Ninguno. Los documentos maestros existentes son fuente de verdad y no se alteran en esta fase.

## Orden de tareas

1. Redactar el plan de fase.
2. Redactar `PRODUCT-BRIEF.md`.
3. Redactar `MVP-SCOPE.md`.
4. Redactar `CONTENT-MATRIX.md`.
5. Redactar `USER-FLOWS.md`.
6. Redactar `NON-FUNCTIONAL.md`.
7. Aprobar `ADR-001`, `ADR-002` y `ADR-003`.
8. Ejecutar revisión documental cruzada.
9. Crear el reporte de cierre.

## Pruebas

No hay pruebas de código en esta fase. Se ejecuta una revisión documental cruzada:

- cada requerimiento está en alcance o fuera de alcance;
- cada pantalla responde a un flujo;
- cada tipo de contenido tiene payload canónico;
- cada riesgo tiene control asignado.

## Riesgos

| Riesgo | Control |
|---|---|
| Alcance se expande durante la fase | Lista cerrada de decisión 4 y 8 del MVP |
| i18n temprana añade coste | Solo es/en en el primer release; claves externas |
| Dark-first afecta contraste del QR | Las reglas visuales del QR (04-DOMAIN) prevalecen sobre el tema |
| Nombre provisional genera confusión | `acore-qr` es el nombre oficial a partir de esta fase |

## Criterios de aceptación

- no quedan decisiones técnicas críticas sin dueño;
- el MVP cabe en una lista cerrada;
- existe una tabla de tipos de contenido;
- se declara que los archivos usan URL;
- se declara que los QR estáticos no tienen analítica;
- los 3 ADR quedan aprobados;
- la Fase 01 no necesita adivinar decisiones.
