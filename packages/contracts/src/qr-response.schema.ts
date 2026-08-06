/** Esquemas de respuesta del contrato QR. */
import { z } from "zod";

/** Clasificación de densidad del payload (04-DOMAIN-CONTENT-TYPES §15). */
export const qrDensitySchema = z.enum(["safe", "dense", "critical", "overflow"]);
export type QrDensity = z.infer<typeof qrDensitySchema>;

/** Respuesta 200 de POST /api/v1/qr/validate. */
export const qrValidationResponseSchema = z.object({
  valid: z.literal(true),
  canonicalPayload: z.string(),
  density: qrDensitySchema,
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
});
export type QrValidationResponse = z.infer<typeof qrValidationResponseSchema>;
