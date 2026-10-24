# 12 — Configuración

La API valida su entorno al iniciar. La web expone únicamente variables `VITE_*` no secretas.

## API (`apps/api/.env`)

```dotenv
NODE_ENV=development
PORT=4000
APP_VERSION=0.1.0
WEB_ORIGIN=http://localhost:5173
TRUST_PROXY=false
REQUEST_BODY_LIMIT=32kb
RATE_LIMIT_VALIDATE_PER_MINUTE=120
RATE_LIMIT_RENDER_PER_MINUTE=60
RATE_LIMIT_PNG_PER_MINUTE=20
```

- `WEB_ORIGIN`: origen exacto autorizado por CORS.
- `TRUST_PROXY`: habilitar solo detrás de un proxy confiable; afecta la IP usada para rate limit.
- `REQUEST_BODY_LIMIT`: máximo del cuerpo JSON.
- `RATE_LIMIT_*`: límites en memoria por IP y minuto. Reinician con el proceso y no se comparten entre réplicas.

## Web (`apps/web/.env`)

```dotenv
VITE_API_BASE_URL=/api/v1
VITE_APP_NAME=acore-qr
```

En desarrollo Vite proxya `/api` a `127.0.0.1:4000`; usar la ruta relativa mantiene las llamadas en el mismo origen y evita CORS. En producción, conserva `/api/v1` cuando un proxy publique la API bajo el mismo dominio o configura la URL absoluta del API y `WEB_ORIGIN` cuando web y API tengan orígenes distintos.

No se requieren variables de base de datos, sesión, almacenamiento, analítica o proveedor QR.
