import { z } from "zod";

const envBoolean = z
  .union([z.literal("true"), z.literal("false")])
  .transform((value) => value === "true");

export const webConfigSchema = z.object({
  VITE_API_BASE_URL: z.url().default("http://localhost:4000/api/v1"),
  VITE_APP_NAME: z.string().min(1).default("acore-qr"),
  // Coherente con FILE_UPLOAD_ENABLED (API): activo por defecto; producción
  // puede apagarlo para no ofrecer subida de archivos (p. ej. sin text/plain).
  VITE_FILE_UPLOAD_ENABLED: envBoolean.default(true),
  VITE_DYNAMIC_QR_ENABLED: envBoolean.default(false),
});

export type WebConfig = z.infer<typeof webConfigSchema>;

/** Parsea y valida el entorno público del web. Lanza si es inválido (fallo temprano en build). */
export function webConfig(env: Record<string, string | undefined> = process.env): WebConfig {
  const result = webConfigSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuración web inválida: ${issues}`);
  }
  return result.data;
}
