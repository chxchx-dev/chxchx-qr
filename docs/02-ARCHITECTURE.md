# 02 — Arquitectura Técnica

## 1. Decisión principal

Se usará un **monorepo TypeScript** con aplicaciones separadas y paquetes compartidos.

```text
qr-studio/
├─ apps/
│  ├─ api/
│  └─ web/
├─ packages/
│  ├─ contracts/
│  ├─ qr-core/
│  ├─ config/
│  └─ test-fixtures/
├─ docs/
├─ infra/
├─ package.json
├─ package-lock.json
└─ tsconfig.base.json
```

## 2. Stack aprobado

| Capa | Tecnología | Decisión |
|---|---|---|
| Runtime | Node.js 24 LTS | Base estable y soportada |
| Lenguaje | TypeScript estricto | Contratos y mantenibilidad |
| API | Express 5 | Capa HTTP mínima |
| Motor QR | `qr` de Paul Miller | Generación auditable y sin dependencias propias |
| Web | React + Vite | Interfaz rápida |
| Estilos | Tailwind CSS 4 | Productividad con salida compilada |
| Validación | Zod | Un contrato de runtime compartido |
| Archivos | Multer 2 o superior | Solo cuando se habilite multipart |
| PNG y logos | `sharp` opcional | Única dependencia pesada justificada |
| Datos dinámicos | PostgreSQL + `pg` | Introducido en fase 06 |
| Formato/lint | Biome | Unifica formateo y análisis |
| Pruebas | Node test/Vitest/Playwright | Según capa |
| Contenedores | Docker + Compose | Entornos reproducibles |

## 3. Fuente única del motor

`packages/qr-core` encapsula a `qr`.

Ninguna aplicación importa `qr` directamente.

```text
apps/web  ─┐
           ├──> packages/qr-core
apps/api  ─┘
```

Esto permite:

- mismos valores por defecto;
- mismos niveles ECC;
- misma normalización;
- mismas restricciones;
- mismos casos de prueba.

## 4. Componentes

### `apps/web`

Responsable de:

- formularios;
- vista previa;
- accesibilidad;
- descarga;
- comunicación con API;
- autenticación futura;
- historial y analítica futura.

No decide reglas de negocio sensibles.

### `apps/api`

Responsable de:

- validar entradas;
- generar exportaciones canónicas;
- manejar archivos;
- crear QR dinámicos;
- redirigir;
- persistir;
- aplicar límites;
- registrar auditoría.

### `packages/contracts`

Contiene:

- esquemas Zod;
- DTO;
- tipos compartidos;
- códigos de error;
- enumeraciones;
- versión del contrato.

No contiene lógica de UI ni acceso a datos.

### `packages/qr-core`

Contiene:

- builders por tipo;
- normalización;
- validación de capacidad;
- reglas de diseño;
- generación de matriz;
- renderizado SVG/GIF;
- adaptador PNG;
- validación round-trip.

### `packages/config`

Contiene:

- lectura de variables;
- validación;
- configuración por ambiente;
- valores por defecto no secretos.

### `packages/test-fixtures`

Contiene vectores estables:

- URLs;
- WiFi;
- vCard;
- Unicode;
- payloads límite;
- archivos de logo válidos e inválidos.

## 5. Flujos

### 5.1 QR estático

```text
Formulario
  -> contrato compartido
  -> payload canónico
  -> vista previa
  -> POST /api/v1/qr/render
  -> validación
  -> qr-core
  -> archivo binario
  -> descarga
```

### 5.2 Archivo

```text
Archivo
  -> validación cliente orientativa
  -> multipart
  -> límite de tamaño
  -> validación de firma real
  -> re-encode si es imagen
  -> almacenamiento
  -> URL HTTPS
  -> payload URL
  -> generación QR
```

### 5.3 QR dinámico

```text
Destino
  -> validación
  -> crear slug
  -> guardar destino
  -> QR con https://dominio/r/{slug}

Escaneo
  -> GET /r/{slug}
  -> validar estado
  -> registrar evento mínimo
  -> 302/307 al destino
```

## 6. Estrategia de renderizado

### SVG

Formato canónico para:

- vista previa;
- impresión;
- escalado;
- descarga liviana.

### GIF

Generado directamente por `qr` para compatibilidad simple.

### PNG

Dos modos:

1. **Cliente:** rasterizar SVG con Canvas para descarga local.
2. **Servidor:** usar adaptador `sharp` cuando se requiera consistencia, logo o procesamiento.

No se añade Canvas nativo ni otra librería gráfica duplicada.

## 7. Reglas de personalización

El motor no dibuja módulos arbitrarios en la primera versión.

Permitido:

- color de fondo;
- color principal;
- tamaño;
- margen;
- ECC;
- logo central con excavación controlada;
- etiqueta externa al QR.

No permitido inicialmente:

- módulos redondos;
- ojos personalizados;
- gradientes dentro de la matriz;
- imágenes de fondo;
- deformación;
- IA artística.

## 8. API sin estado en fases tempranas

Fases 01 a 05:

- API stateless;
- no base de datos;
- archivos temporales o storage adapter;
- rate limit local en desarrollo;
- despliegue simple.

Fase 06:

- PostgreSQL;
- migraciones;
- redirect service;
- persistencia.

## 9. Escalabilidad

No se anticipa complejidad antes de necesitarla.

### Escala 1

- web estática;
- una API;
- PostgreSQL;
- almacenamiento S3 compatible.

### Escala 2

- múltiples réplicas API;
- rate limit compartido;
- CDN;
- pool de conexión;
- cola opcional para analítica.

### Escala 3

- servicio de redirección separado únicamente si la latencia o volumen lo exige.

## 10. Convenciones internas

Capas de API:

```text
route -> controller -> service -> domain/adapter
```

Reglas:

- rutas no contienen negocio;
- controladores traducen HTTP;
- servicios coordinan casos de uso;
- adapters integran librerías, DB y storage;
- el dominio no importa Express.

## 11. Errores

Se adopta `application/problem+json`.

Ejemplo:

```json
{
  "type": "https://docs.example.com/problems/qr-payload-too-large",
  "title": "El contenido excede la capacidad permitida",
  "status": 422,
  "code": "QR_PAYLOAD_TOO_LARGE",
  "detail": "Reduce el contenido o utiliza un enlace.",
  "requestId": "req_01..."
}
```

## 12. Decisiones que no se toman aún

- microservicios;
- GraphQL;
- WebSockets;
- Redis;
- Kafka/RabbitMQ;
- Kubernetes;
- serverless;
- multi-región.

Se abren solo con métricas reales.
