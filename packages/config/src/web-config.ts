import { z } from "zod";

export const webConfigSchema = z.object({
  VITE_API_BASE_URL: z.union([z.url(), z.literal("/api/v1")]).default("/api/v1"),
  VITE_APP_NAME: z.string().min(1).default("chxchx-qr"),
});

export type WebConfig = z.infer<typeof webConfigSchema>;

/** Parsea y valida el entorno público de la web. */
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
