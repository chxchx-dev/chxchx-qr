# 10 — Despliegue y Observabilidad

## 1. Ambientes

```text
local
test
staging
production
```

No compartir:

- DB;
- bucket;
- secretos;
- dominio;
- claves de cookie.

## 2. Estrategia de despliegue

### MVP

- frontend estático;
- API Node;
- reverse proxy;
- HTTPS;
- sin DB.

### Producto dinámico

- frontend CDN;
- API;
- PostgreSQL administrado o respaldado;
- storage S3 compatible;
- dominio corto separado.

Ejemplo:

```text
app.example.com
api.example.com
q.example.com
files.example.com
```

## 3. Docker

Imágenes multi-stage.

API:

```text
deps -> build -> runtime
```

Reglas:

- usuario no root;
- solo artefactos necesarios;
- `NODE_ENV=production`;
- healthcheck;
- señal SIGTERM;
- grace period;
- filesystem read-only cuando sea viable;
- directorio temporal explícito.

## 4. Compose local

Servicios futuros:

```text
web
api
postgres
minio
```

No añadir Redis hasta necesitarlo.

## 5. CI

### Pull request

1. install limpio;
2. format;
3. lint;
4. typecheck;
5. unit;
6. integration;
7. build;
8. dependency audit;
9. secret scan.

### Main

1. gates anteriores;
2. crear imágenes;
3. SBOM;
4. escaneo de imagen;
5. deploy staging;
6. smoke tests;
7. aprobación;
8. deploy production;
9. smoke;
10. rollback automático si falla.

## 6. Configuración de producción

- TLS;
- HSTS;
- compresión selectiva;
- body limits;
- proxy trust configurado;
- timeout;
- keep-alive;
- headers;
- CORS;
- cookies seguras;
- logs JSON.

## 7. Logs

Campos:

```json
{
  "timestamp": "...",
  "level": "info",
  "service": "qr-api",
  "environment": "production",
  "requestId": "req_...",
  "route": "/api/v1/qr/render",
  "method": "POST",
  "status": 200,
  "durationMs": 43
}
```

No incluir payload sensible.

## 8. Métricas

### API

- requests;
- errores;
- latencia;
- memoria;
- CPU;
- event loop lag;
- renders por formato;
- rechazos por capacidad;
- rate limits.

### Archivos

- uploads;
- bytes;
- rechazos;
- malware;
- fallos de cleanup;
- storage latency.

### Redirección

- latencia;
- 404;
- 410;
- bloqueos;
- eventos descartados;
- DB errors.

## 9. Alertas

- error rate alto;
- redirect p95 alto;
- DB no disponible;
- storage no disponible;
- disco temporal lleno;
- memoria creciente;
- cola de analítica si existe;
- certificado próximo a vencer;
- backup fallido.

## 10. Salud

`live` no consulta dependencias.

`ready` sí comprueba lo necesario para servir.

La analítica puede degradarse sin detener redirección.

## 11. Backups

PostgreSQL:

- backup diario;
- retención;
- cifrado;
- restore mensual probado.

Storage:

- versionado si aplica;
- lifecycle;
- borrado coordinado;
- inventario.

## 12. Rollback

Cada release debe definir:

- imagen anterior;
- compatibilidad de schema;
- rollback de aplicación;
- feature flag;
- criterio de activación.

Migración expand/contract:

1. añadir;
2. desplegar código compatible;
3. migrar datos;
4. cambiar lectura;
5. eliminar en release posterior.

## 13. SLO inicial

- generación estática: 99.9%;
- redirección dinámica: 99.95%;
- pérdida de eventos de analítica permitida bajo degradación;
- pérdida de destinos: no aceptable;
- RPO y RTO definidos antes de producción dinámica.

## 14. Costos

Registrar por mes:

- API;
- DB;
- storage;
- transferencia;
- CDN;
- observabilidad;
- antivirus;
- dominio.

No usar una arquitectura más costosa para aparentar escala.
