/**
 * Fábrica de storage (docs/07 §3): el driver se elige por FILE_STORAGE_DRIVER.
 * Solo `local` está implementado en esta fase; `s3` falla con un mensaje claro
 * (requiere ADR de proveedor, credenciales y no debe usarse en producción sin
 * contrato previo).
 */
import path from "node:path";
import type { ApiConfig } from "@acore/config";
import type { FileStorage } from "./file-storage.js";
import { LocalFileStorage } from "./local-file-storage.js";

export function createFileStorage(
  config: Pick<ApiConfig, "FILE_STORAGE_DRIVER" | "FILE_TEMP_DIR">,
): FileStorage {
  switch (config.FILE_STORAGE_DRIVER) {
    case "local":
      return new LocalFileStorage(path.join(config.FILE_TEMP_DIR, "storage"));
    case "s3":
      throw new Error(
        "FILE_STORAGE_DRIVER=s3 no está implementado: requiere ADR de proveedor y credenciales (Fase 05 solo soporta 'local').",
      );
  }
}
