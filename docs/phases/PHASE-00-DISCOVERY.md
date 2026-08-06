# Fase 00 — Descubrimiento y Cierre de Alcance

## Objetivo

Eliminar decisiones ambiguas antes de crear código y congelar el contrato del MVP.

## Entradas

- documentación raíz;
- nombre provisional;
- dominio o estrategia de dominios;
- tipos de QR requeridos;
- reglas de archivos;
- diseño de Stitch/Figma cuando exista.

## Decisiones obligatorias

1. Nombre del producto.
2. Dominio principal.
3. Si el MVP será anónimo.
4. Tipos de contenido iniciales.
5. Formatos iniciales.
6. Tamaño máximo de texto.
7. Si PNG servidor se activa.
8. Si archivos entran en el primer release.
9. Política de expiración de archivos.
10. Países/idiomas iniciales.
11. Diseño visual.
12. Licencia del código.

## Fuera de alcance

- código de producción;
- base de datos;
- autenticación;
- carga real de archivos;
- analítica.

## Archivos que deben crearse

| Ruta | Responsabilidad |
|---|---|
| `docs/product/PRODUCT-BRIEF.md` | problema, usuario, propuesta |
| `docs/product/MVP-SCOPE.md` | incluido y excluido |
| `docs/product/USER-FLOWS.md` | flujos principales |
| `docs/product/CONTENT-MATRIX.md` | tipos y campos |
| `docs/product/NON-FUNCTIONAL.md` | rendimiento, seguridad, disponibilidad |
| `docs/adr/ADR-001-monorepo.md` | monorepo |
| `docs/adr/ADR-002-single-qr-engine.md` | motor único |
| `docs/adr/ADR-003-file-as-url.md` | archivos |
| `docs/execution/PHASE-00-REPORT.md` | cierre |

## Tareas

### 1. Producto

- redactar una frase de valor;
- definir usuario principal;
- definir acción principal;
- separar estático de dinámico;
- definir límites del MVP.

### 2. Tipos

Para cada tipo:

- campos;
- obligatorio/opcional;
- payload canónico;
- ejemplo;
- validación;
- datos sensibles;
- compatibilidad.

### 3. Riesgos

- phishing;
- malware;
- QR ilegible;
- privacidad;
- costos;
- dependencia.

### 4. UX

- mapa de pantallas;
- flujo móvil;
- estados;
- contenido de ayuda;
- diseño pendiente.

### 5. Técnica

- confirmar Node LTS;
- confirmar Express 5;
- confirmar `qr`;
- confirmar estrategia PNG;
- confirmar workspace;
- confirmar CI.

## Criterios de aceptación

- no quedan decisiones técnicas críticas sin dueño;
- el MVP cabe en una lista cerrada;
- existe una tabla de tipos;
- se declara que archivos usan URL;
- se declara que estáticos no tienen analítica;
- se aprueban ADR;
- la siguiente fase no necesita adivinar.

## Pruebas

No hay pruebas de código. Se realiza revisión documental cruzada:

- cada requerimiento está en alcance o fuera de alcance;
- cada pantalla responde a un flujo;
- cada tipo tiene payload;
- cada riesgo tiene control.

## Puerta de salida

- [ ] PRODUCT-BRIEF aprobado
- [ ] MVP-SCOPE aprobado
- [ ] contenido inicial cerrado
- [ ] decisiones ADR aceptadas
- [ ] riesgos actualizados
- [ ] reporte creado

## Próximo paso permitido

Fase 01 — Fundación.
