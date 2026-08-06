import { apiConfig } from "@acore/config";
import { createApp } from "./app.js";
import { createFileStorage } from "./infrastructure/storage/storage-factory.js";
import { startFileCleanupJob } from "./modules/files/file-cleanup.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const config = apiConfig(process.env);
const app = createApp(config);

// Cleanup periódico de archivos (expirados, huérfanos y temporales).
const fileCleanupJob = startFileCleanupJob({
  storage: createFileStorage(config),
  uploadsDir: `${config.FILE_TEMP_DIR}/uploads`,
  intervalMs: config.FILE_CLEANUP_INTERVAL_MINUTES * 60_000,
});

const server = app.listen(config.PORT, () => {
  console.log(
    `[qr-api] escuchando en :${config.PORT} (env=${config.NODE_ENV}, v${config.APP_VERSION})`,
  );
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log(`[qr-api] señal ${signal} recibida; apagado graceful`);
  fileCleanupJob.stop();

  const forceExit = setTimeout(() => {
    console.error("[qr-api] apagado graceful agotado; forzando salida");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((error) => {
    if (error) {
      console.error("[qr-api] error al cerrar el servidor", error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
