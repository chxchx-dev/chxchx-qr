/**
 * Esquemas de QR dinámicos (Fase 06): creación, actualización con versión,
 * estados y respuestas. El destino usa la misma política de URL segura que el
 * contenido URL del generador (SAFE_URL_SCHEMA).
 */
import { z } from "zod";
import { SAFE_URL_SCHEMA } from "./qr-content.schema.js";

export const DYNAMIC_QR_LIMITS = {
  nameMaxLength: 120,
  /** Límites del slug generado (nunca elegido por el usuario en MVP). */
  slugMinLength: 6,
  slugMaxLength: 24,
} as const;

export const dynamicQrStatusSchema = z.enum(["active", "paused", "expired", "blocked", "deleted"]);

export type DynamicQrStatus = z.infer<typeof dynamicQrStatusSchema>;

/** Fecha ISO 8601 UTC (Z) o nula (sin expiración). `optional()` sin transform: el
 * servicio distingue "ausente" (no tocar) de null (quitar expiración). */
const utcDateTimeOrNull = z.string().datetime().nullable();

export const createDynamicQrSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .max(DYNAMIC_QR_LIMITS.nameMaxLength, `Máximo ${DYNAMIC_QR_LIMITS.nameMaxLength} caracteres`),
  destinationUrl: SAFE_URL_SCHEMA,
  /** Si false, se crea en estado paused (no redirige hasta activarse). */
  active: z.boolean().optional(),
  expiresAt: utcDateTimeOrNull.optional(),
});

export type CreateDynamicQrInput = z.infer<typeof createDynamicQrSchema>;

/** Al menos un campo; expiresAt acepta null para quitar la expiración. */
export const patchDynamicQrSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Este campo es obligatorio")
      .max(DYNAMIC_QR_LIMITS.nameMaxLength, `Máximo ${DYNAMIC_QR_LIMITS.nameMaxLength} caracteres`)
      .optional(),
    destinationUrl: SAFE_URL_SCHEMA.optional(),
    active: z.boolean().optional(),
    expiresAt: utcDateTimeOrNull.optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "Envía al menos un campo para actualizar",
  });

export type PatchDynamicQrInput = z.infer<typeof patchDynamicQrSchema>;

export const dynamicQrResponseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(DYNAMIC_QR_LIMITS.slugMinLength),
  shortUrl: z.url(),
  name: z.string().min(1),
  destinationUrl: z.url(),
  status: dynamicQrStatusSchema,
  version: z.number().int().positive(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DynamicQrResponse = z.infer<typeof dynamicQrResponseSchema>;

export const listDynamicQrsResponseSchema = z.object({
  items: z.array(dynamicQrResponseSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export type ListDynamicQrsResponse = z.infer<typeof listDynamicQrsResponseSchema>;
