/**
 * Cleanup de archivos (docs/phases/PHASE-05-FILE-LINKS.md §7): elimina
 * expirados (según metadata), huérfanos (binario sin metadata o viceversa) y
 * temporales de subida abandonados. Se ejecuta con setInterval desde server.ts
 * y se puede invocar manualmente (tests, mantenimiento).
 */

import type { Dirent } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { FileStorage } from "../../infrastructure/storage/file-storage.js";

const TEMP_MAX_AGE_MS = 60 * 60 * 1000; // temporales abandonados > 1h
const RUN_INTERVAL_MS_DEFAULT = 60 * 60 * 1000;

export interface FileCleanupOptions {
  storage: FileStorage;
  uploadsDir: string;
  /** Límite de edad de temporales de subida abandonados. */
  tempMaxAgeMs?: number;
}

/** Elimina temporales de subida más viejos que tempMaxAgeMs (pending/blocked). */
export async function cleanupTempFiles(
  uploadsDir: string,
  tempMaxAgeMs = TEMP_MAX_AGE_MS,
): Promise<number> {
  let removed = 0;
  let entries: Dirent[];
  try {
    entries = await fs.readdir(uploadsDir, { withFileTypes: true });
  } catch {
    return 0; // directorio aún no creado
  }
  const now = Date.now();
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isFile()) {
        return;
      }
      const full = path.join(uploadsDir, entry.name);
      try {
        const stat = await fs.stat(full);
        if (now - stat.mtimeMs > tempMaxAgeMs) {
          await fs.unlink(full);
          removed += 1;
        }
      } catch {
        // Ya eliminado o sin permisos: se ignora.
      }
    }),
  );
  return removed;
}

/**
 * Pasa de limpieza: borra expirados y huérfanos del storage, y temporales
 * viejos. Devuelve el número total de elementos eliminados.
 */
export async function runFileCleanup(options: FileCleanupOptions): Promise<number> {
  const tokens = await options.storage.listTokens();
  const now = Date.now();
  let removed = 0;
  await Promise.all(
    tokens.map(async (token) => {
      const stored = await options.storage.read(token).catch(() => null);
      if (stored === null) {
        // Huérfano (binario sin metadata o metadata corrupta).
        await options.storage.delete(token).catch(() => {});
        removed += 1;
        return;
      }
      if (new Date(stored.metadata.expiresAt).getTime() <= now) {
        await options.storage.delete(token).catch(() => {});
        removed += 1;
      }
    }),
  );
  removed += await cleanupTempFiles(options.uploadsDir, options.tempMaxAgeMs);
  return removed;
}

export interface FileCleanupJob {
  stop: () => void;
}

/** Arranca el job periódico; devuelve un handle para detenerlo (shutdown). */
export function startFileCleanupJob(
  options: FileCleanupOptions & { intervalMs?: number },
): FileCleanupJob {
  const intervalMs = options.intervalMs ?? RUN_INTERVAL_MS_DEFAULT;
  const timer = setInterval(() => {
    runFileCleanup(options)
      .then((removed) => {
        if (removed > 0) {
          console.log(`[qr-api] cleanup de archivos: ${removed} elemento(s) eliminado(s)`);
        }
      })
      .catch((error: unknown) => {
        console.error("[qr-api] error en el cleanup de archivos", error);
      });
  }, intervalMs);
  timer.unref();
  return {
    stop: () => clearInterval(timer),
  };
}
