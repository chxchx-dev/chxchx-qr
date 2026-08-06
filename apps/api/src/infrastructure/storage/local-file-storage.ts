/**
 * Storage local sobre disco (solo desarrollo/MVP, docs/07 §3): cada archivo se
 * guarda como `{token}.bin` con un sidecar JSON `{token}.json` de metadata.
 * Las rutas son opacas (token), el directorio vive fuera del árbol público.
 * Producción usará un driver S3-compatible vía storage-factory (ADR nuevo).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { FileStorage, StoredFile, StoredFileMetadata } from "./file-storage.js";

function binPath(root: string, token: string): string {
  return path.join(root, `${token}.bin`);
}

function metaPath(root: string, token: string): string {
  return path.join(root, `${token}.json`);
}

/** Valida el token antes de usarlo en rutas (solo base64url de longitud fija). */
function assertSafeToken(token: string): void {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(token)) {
    throw new Error("Token de archivo inválido");
  }
}

export class LocalFileStorage implements FileStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = root;
  }

  /** Crea el directorio raíz si no existe (idempotente). */
  async ensureRoot(): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
  }

  async save(token: string, data: Uint8Array, metadata: StoredFileMetadata): Promise<void> {
    assertSafeToken(token);
    await this.ensureRoot();
    // Escritura atómica por par: binario y metadata primero en temporales.
    await fs.writeFile(binPath(this.root, token), data);
    await fs.writeFile(metaPath(this.root, token), JSON.stringify(metadata));
  }

  async read(token: string): Promise<StoredFile | null> {
    assertSafeToken(token);
    try {
      const [data, metaRaw] = await Promise.all([
        fs.readFile(binPath(this.root, token)),
        fs.readFile(metaPath(this.root, token), "utf8"),
      ]);
      const metadata = JSON.parse(metaRaw) as StoredFileMetadata;
      return { data: new Uint8Array(data), metadata };
    } catch {
      // Archivo o metadata ausente, o JSON corrupto: se trata como inexistente.
      return null;
    }
  }

  async delete(token: string): Promise<void> {
    assertSafeToken(token);
    await Promise.all([
      fs.unlink(binPath(this.root, token)).catch(() => {}),
      fs.unlink(metaPath(this.root, token)).catch(() => {}),
    ]);
  }

  async listTokens(): Promise<string[]> {
    await this.ensureRoot();
    const entries = await fs.readdir(this.root, { withFileTypes: true });
    const tokens = new Set<string>();
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }
      if (entry.name.endsWith(".json")) {
        tokens.add(entry.name.slice(0, -".json".length));
      } else if (entry.name.endsWith(".bin")) {
        // Huérfano potencial (binario sin metadata): el cleanup lo resuelve.
        tokens.add(entry.name.slice(0, -".bin".length));
      }
    }
    return [...tokens].filter((token) => /^[A-Za-z0-9_-]{8,128}$/.test(token));
  }
}
