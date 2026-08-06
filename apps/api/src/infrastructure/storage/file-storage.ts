/**
 * Contrato de almacenamiento de archivos (Fase 05, ADR-003). Independiente del
 * driver: la API solo conoce tokens opacos y metadata. El binario se guarda
 * fuera del árbol público y nunca se sirve por su nombre original.
 */

/** Metadata persistida de un archivo almacenado. */
export interface StoredFileMetadata {
  /** MIME validado por firma mágica (nunca el MIME del browser). */
  mimeType: string;
  /** Nombre original sanitizado (solo informativo). */
  originalName: string;
  /** Nombre seguro para Content-Disposition (extensión coherente con mimeType). */
  downloadName: string;
  /** Tamaño final almacenado (tras re-encode de imágenes). */
  sizeBytes: number;
  /** SHA-256 del contenido final almacenado (hex). */
  sha256: string;
  /** Instante ISO 8601 UTC de creación. */
  createdAt: string;
  /** Instante ISO 8601 UTC de expiración. */
  expiresAt: string;
}

export interface StoredFile {
  data: Uint8Array;
  metadata: StoredFileMetadata;
}

export interface FileStorage {
  /** Guarda el archivo bajo un token opaco (sobrescribe si existe). */
  save(token: string, data: Uint8Array, metadata: StoredFileMetadata): Promise<void>;
  /** Lee el archivo y su metadata; null si no existe. */
  read(token: string): Promise<StoredFile | null>;
  /** Elimina el archivo y su metadata. No lanza si no existe. */
  delete(token: string): Promise<void>;
  /** Lista los tokens con metadata (para cleanup). Orden no garantizado. */
  listTokens(): Promise<string[]>;
}
