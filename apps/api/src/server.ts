import { apiConfig } from "@acore/config";
import { createApp } from "./app.js";
import { migrateDatabase } from "./infrastructure/database/migration-runner.js";
import { createDatabase, type Database } from "./infrastructure/database/pool.js";
import { createFileStorage } from "./infrastructure/storage/storage-factory.js";
import { startFileCleanupJob } from "./modules/files/file-cleanup.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const config = apiConfig(process.env);

// QR dinámicos (Fase 06): solo con DB. Las migraciones se aplican antes de
// aceptar tráfico (advisory lock + transacción; reproducibles y reversibles).
const database: Database | undefined = config.DYNAMIC_QR_ENABLED
  ? createDatabase(config)
  : undefined;
if (database !== undefined) {
  const applied = await migrateDatabase(database);
  if (applied.length > 0) {
    console.log(`[db] migraciones aplicadas: ${applied.join(", ")}`);
  } else {
    console.log("[db] migraciones al día");
  }
}

const app = createApp(config, database !== undefined ? { database } : {});

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

  const finish = (error?: Error): void => {
    if (error !== undefined) {
      console.error("[qr-api] error al apagar", error);
      process.exit(1);
    }
    process.exit(0);
  };

  server.close((error) => {
    if (database !== undefined) {
      database.close().then(
        () => finish(error),
        (closeError: Error) => finish(closeError),
      );
      return;
    }
    finish(error);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
