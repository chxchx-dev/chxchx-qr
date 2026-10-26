# acore-qr

Aplicación web para crear códigos QR estáticos. Incluye una interfaz React y una API Node.js que valida el contenido y genera archivos SVG, PNG y GIF. La generación se ejecuta localmente en la API; las solicitudes no se guardan ni se envían a un servicio QR externo.

## Funciones

- QR para texto, URL, correo, teléfono, SMS, WiFi, contacto vCard, evento y ubicación.
- Vista previa y descarga en SVG, PNG o GIF.
- Ajustes de tamaño, margen, corrección de errores y colores.

## Requisitos

- Node.js 24 (se admite `>=20.19.0`).
- npm.

## Instalar y ejecutar

```bash
npm ci
npm run dev
```

Abre la web en `http://localhost:5173`; la API queda en `http://localhost:4000`. La configuración predeterminada basta para desarrollo. Consulta [`apps/api/.env.example`](apps/api/.env.example) y [`apps/web/.env.example`](apps/web/.env.example) para personalizarla.

## Comandos

```bash
npm run build         # compila la API y la web
npm run typecheck     # verifica los tipos
npm run lint          # revisa el formato y el código
npm test              # ejecuta las pruebas
npm run test:coverage # muestra la cobertura por paquete
npm run test:e2e      # ejecuta las pruebas de navegador
```

## Despliegue

Es una aplicación alojable, no un paquete npm independiente. Para producción, ejecuta `npm ci` y `npm run build`; publica `apps/web/dist` como sitio estático y ejecuta la API con `npm run start -w apps/api`. Configura `VITE_API_BASE_URL` durante el build de la web y `WEB_ORIGIN` en la API. Los valores para un mismo dominio o dominios separados están en [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

La API ofrece `GET /health/live` y `GET /health/ready`. El detalle de validación y generación está en [`docs/API.md`](docs/API.md).

## Licencia

[MIT](LICENSE).
