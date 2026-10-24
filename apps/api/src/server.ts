import { existsSync } from "node:fs";
import { apiConfig } from "@acore/config";
import { createApp } from "./app.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

// En desarrollo se carga el .env local; producción inyecta variables del entorno.
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
  if (existsSync(".env")) {
    process.loadEnvFile(".env");
  }
}

const config = apiConfig(process.env);
const app = createApp(config);
const server = app.listen(config.PORT, () => {
  console.log(
    `[qr-api] escuchando en :${config.PORT} (env=${config.NODE_ENV}, v${config.APP_VERSION})`,
  );
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[qr-api] señal ${signal} recibida; apagado graceful`);

  const forceExit = setTimeout(() => {
    console.error("[qr-api] apagado graceful agotado; forzando salida");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((error) => {
    if (error !== undefined) {
      console.error("[qr-api] error al apagar", error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
