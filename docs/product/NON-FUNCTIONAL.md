# NON-FUNCTIONAL — Requisitos no funcionales del MVP (acore-qr)

## 1. Rendimiento

| Requisito | Meta |
|---|---|
| Vista previa | generación local inmediata (debounce corto); sin regenerar PNG en cada tecla |
| Exportación | tiempo medio de exportación bajo; cancelar request anterior |
| API render | respuesta del renderizado dentro de presupuesto definido en Fase 01 |
| PNG | límites de tamaño + rate limit + cache (CPU) |
| Percepción | skeleton solo cuando aporta; evitar spinners infinitos; progreso real en uploads futuros |

## 2. Seguridad

- Validación de entrada **en servidor** (el cliente nunca es autoridad).
- URL: solo `https:`/`http:`; bloqueados `javascript:`, `data:`, `file:`, `vbscript:`; sin credenciales embebidas.
- WiFi: contraseñas no en logs, no persistidas.
- Escapado correcto de vCard, WiFi e iCalendar.
- API: JSON UTF-8, errores `application/problem+json`, request ID, límite de body, timeouts explícitos, CORS por allowlist, rate limit por ruta.
- Sin secretos en código, Dockerfile ni frontend.
- SVG subido por usuarios: rechazado por defecto; nunca se sirve sin sanitización (no aplica al MVP, aplica desde Fase 05).
- No se ejecuta contenido subido. No se rastrea un QR estático como si fuera dinámico.

## 3. Disponibilidad y operación

- API stateless (Fases 01–05): despliegue simple, sin base de datos.
- Health endpoints: `live` y `ready` (200).
- Graceful shutdown.
- No stack traces en producción.
- Observabilidad básica: request ID, logs estructurados, métricas (Fase 09 profundiza).

## 4. Escaneabilidad (requisito de producto)

- ECC por defecto `medium`; margen por defecto 4 módulos.
- Contraste objetivo ≥ 4.5:1; fondo sólido; sin transparencia por defecto.
- No forzar versión QR salvo prueba.
- Las exportaciones personalizadas deben decodificarse de vuelta (round-trip).
- Preview y exportación usan el **mismo motor** (`qr-core`): misma normalización, mismos valores por defecto, mismos niveles ECC.

## 5. Accesibilidad (WCAG 2.2 AA)

- Navegación completa por teclado; focus visible; orden lógico.
- Target táctil mínimo; contraste.
- `aria-live` para validación; textos alternativos; no depender del color.
- Respetar `prefers-reduced-motion`.
- QR acompañado por descripción; descarga anunciada.
- Mensajes de error junto al campo, legibles ("El contenido es demasiado grande..." en vez de "Error 422").

## 6. Privacidad

- Sin base de datos en el MVP: no se persisten contenidos.
- WiFi: mensaje "no se guarda"; no autocompletar salvo decisión.
- QR estáticos: sin analítica (declarado en la UI).
- Analítica dinámica (Fase 08): registra lo mínimo necesario; hashes rotativos; sin IP completa persistida.

## 7. Portabilidad y entorno

Confirmaciones técnicas de la Fase 00 (tarea 5):

- Node.js 24 LTS (`.nvmrc`).
- TypeScript estricto; ESM.
- API con **Express 5** (capa HTTP mínima).
- Motor QR: `qr` (Paul Miller) encapsulado en `qr-core` (ADR-002).
- Estrategia PNG: adaptador de rasterizado en servidor (ADR-007 se formaliza en Fase 02; la decisión de activar PNG queda aprobada en esta fase).
- Workspace: monorepo npm workspaces (ADR-001).
- **CI:** una sola cadena sobre la raíz con `npm ci` + format + lint + typecheck + test + build + audit (gates de la Fase 01).
- Contenedores reproducibles (Docker multi-stage, no root).
- Configuración validada con Zod; fallo temprano ante env inválido.

## 8. Verificación de requisitos (checklist de la fase)

- [ ] cada requisito tiene meta o control;
- [ ] rendimiento y percepción cubiertos;
- [ ] seguridad cubre validación, secretos y esquemas peligrosos;
- [ ] disponibilidad cubre health y shutdown;
- [ ] escaneabilidad garantiza round-trip y motor único;
- [ ] accesibilidad apunta a WCAG 2.2 AA;
- [ ] privacidad declara la ausencia de analítica estática.
