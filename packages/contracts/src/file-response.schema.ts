/**
 * Respuesta de subida de archivo (Fase 05). La URL pública usa un token opaco:
 * `{FILE_PUBLIC_BASE_URL}/f/{token}` (ADR-003). El binario nunca viaja aquí.
 */
import { z } from "zod";

export const fileUploadResponseSchema = z.object({
  /** Token opaco de la URL pública (nunca el storage key ni el nombre original). */
  token: z.string().min(8),
  /** URL pública de descarga: https://.../f/{token}. */
  url: z.url(),
  /** Nombre original sanitizado (solo para mostrar; la descarga usa el seguro). */
  fileName: z.string().min(1).max(255),
  /** Tamaño final almacenado (tras re-encode de imágenes). */
  sizeBytes: z.number().int().nonnegative(),
  /** MIME validado por firma mágica (nunca el MIME del browser). */
  mimeType: z.string().min(1),
  /** Hash SHA-256 del contenido final almacenado (hex). */
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  /** Instante de expiración (ISO 8601 UTC). Tras él, la descarga devuelve 410. */
  expiresAt: z.string().datetime(),
});

export type FileUploadResponse = z.infer<typeof fileUploadResponseSchema>;
