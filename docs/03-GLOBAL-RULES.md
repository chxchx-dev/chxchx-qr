# 03 — Reglas Globales

## 1. Reglas absolutas

1. TypeScript usa `strict: true`.
2. No se acepta `any` salvo adaptación documentada de una librería.
3. No se silencia un error con `try/catch` vacío.
4. No se confía en validación del cliente.
5. No se guarda un archivo usando su nombre original como ruta.
6. No se incrustan secretos en código, Dockerfile o frontend.
7. No se codifican archivos grandes dentro del QR.
8. No se ejecuta contenido subido.
9. No se rastrea un QR estático como si fuera dinámico.
10. No se añade una dependencia sin registrar motivo.
11. No se cierra una fase con pruebas fallidas.
12. No se deja una ruta de administración sin autorización.
13. No se almacena contraseña, sesión o token en texto plano.
14. No se permite `javascript:`, `data:` ni esquemas peligrosos en destinos.
15. No se sirve SVG subido por usuarios sin sanitización; por defecto se rechaza.

## 2. Código

### TypeScript

- `noUncheckedIndexedAccess: true`.
- `exactOptionalPropertyTypes: true`.
- `useUnknownInCatchVariables: true`.
- `noImplicitOverride: true`.
- imports con alias aprobados;
- módulos ESM;
- funciones públicas con tipos explícitos;
- errores de dominio tipados.

### Tamaño y responsabilidad

- archivo orientativo: menos de 300 líneas;
- función orientativa: menos de 40 líneas;
- componente React: una responsabilidad;
- una ruta no contiene acceso directo a DB;
- una vista no construye payload manualmente.

No se fragmenta por cumplir números; se fragmenta por responsabilidad.

## 3. Nombres

```text
PascalCase       componentes y clases
camelCase        funciones y variables
UPPER_SNAKE_CASE constantes de configuración
kebab-case       rutas y nombres de archivos no componentes
snake_case       columnas PostgreSQL
```

Códigos de error:

```text
QR_INVALID_URL
QR_PAYLOAD_TOO_LARGE
FILE_TYPE_NOT_ALLOWED
FILE_SIZE_EXCEEDED
DYNAMIC_QR_DISABLED
```

## 4. API

- prefijo `/api/v1`;
- JSON UTF-8;
- errores Problem Details;
- request ID en cada respuesta;
- no devolver stack traces;
- timeouts explícitos;
- límite de body;
- CORS por allowlist;
- endpoints idempotentes documentados;
- contratos compartidos con Zod.

## 5. Seguridad

- validar tipo, longitud y estructura;
- normalizar antes de generar;
- escapar correctamente vCard, WiFi e iCalendar;
- aplicar rate limit por ruta;
- responder archivos con `Content-Disposition`;
- configurar CSP;
- revisar dependencias en CI;
- usar versiones parcheadas;
- rotar secretos;
- eliminar temporales en éxito y error.

## 6. QR

- margen por defecto: 4 módulos;
- ECC por defecto: `medium`;
- logo exige `high`;
- contraste mínimo evaluado;
- fondo sólido;
- no transparencia por defecto;
- prueba de lectura para exportaciones personalizadas;
- no forzar versión QR salvo prueba o requisito.

## 7. Frontend

- mobile-first;
- estados loading, empty, error y success;
- navegación por teclado;
- etiquetas accesibles;
- mensajes de error junto al campo;
- no bloquear la interfaz durante generación;
- no almacenar datos sensibles en localStorage;
- vista previa no sustituye exportación oficial.

## 8. Datos

- migraciones versionadas;
- UTC en persistencia;
- timestamps ISO 8601;
- IDs no secuenciales expuestos;
- soft delete solo cuando tenga sentido;
- retención definida;
- índices basados en consultas;
- ninguna migración destructiva sin respaldo.

## 9. Dependencias

Antes de añadir una:

- confirmar que la plataforma no resuelve el problema;
- revisar mantenimiento;
- revisar licencia;
- revisar vulnerabilidades;
- revisar tamaño;
- revisar compatibilidad ESM/TypeScript;
- registrar justificación.

## 10. Pruebas

- cada bug corregido añade una prueba de regresión;
- los builders tienen pruebas por formato;
- cada exportador tiene pruebas;
- la API tiene pruebas de límites;
- E2E cubre el camino principal;
- QR personalizados se decodifican de vuelta;
- snapshots no son la única evidencia.

## 11. Git

- commits atómicos;
- no subir `.env`;
- no subir archivos temporales;
- lockfile obligatorio;
- PR con checklist;
- migración y código compatible en el mismo release;
- no reescribir historia de ramas compartidas.

## 12. Documentación

Todo comportamiento público debe aparecer en:

- contrato;
- README de paquete;
- OpenAPI o equivalente;
- fase;
- changelog si cambia.

## 13. Prohibiciones de arquitectura

No crear:

- repositorio genérico que oculte SQL;
- `utils.ts` como vertedero;
- servicio “God object”;
- DTO duplicado en web y API;
- lógica de QR dentro de componentes;
- middleware global que capture y convierta todo sin tipos;
- abstracción de storage antes de existir dos implementaciones necesarias;
- microservicio sin métrica que lo justifique.
