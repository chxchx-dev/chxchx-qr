import { z } from "zod";

const envBoolean = z
  .union([z.literal("true"), z.literal("false")])
  .transform((value) => value === "true");

const envInteger = z.coerce.number().int();

/** Ajustes mínimos del servidor que genera y valida los QR estáticos. */
export const apiConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: envInteger
    .refine((port) => port >= 0 && port <= 65535, {
      message: "debe estar entre 0 y 65535",
    })
    .default(4000),
  APP_VERSION: z.string().min(1).default("0.1.0"),
  WEB_ORIGIN: z.url().default("http://localhost:5173"),
  TRUST_PROXY: envBoolean.default(false),
  REQUEST_BODY_LIMIT: z.string().min(1).default("32kb"),
  RATE_LIMIT_VALIDATE_PER_MINUTE: envInteger.default(120),
  RATE_LIMIT_RENDER_PER_MINUTE: envInteger.default(60),
  RATE_LIMIT_PNG_PER_MINUTE: envInteger.default(20),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;

/** Parsea y valida el entorno del API. Lanza si falta o es inválido. */
export function apiConfig(env: Record<string, string | undefined> = process.env): ApiConfig {
  const result = apiConfigSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuración de API inválida: ${issues}`);
  }
  return result.data;
}
