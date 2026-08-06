import { z } from "zod";

const envBoolean = z
  .union([z.literal("true"), z.literal("false")])
  .transform((value) => value === "true");

const envInteger = z.coerce.number().int();

export const apiConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: envInteger
    .refine((port) => port >= 0 && port <= 65535, { message: "debe estar entre 0 y 65535" })
    .default(4000),
  APP_VERSION: z.string().min(1).default("0.1.0"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  PUBLIC_API_URL: z.url().default("http://localhost:4000"),
  WEB_ORIGIN: z.url().default("http://localhost:5173"),
  TRUST_PROXY: envBoolean.default(false),
  // 2 MB: permite el data URI del logo en validate/render (logo re-encodado ≤1024×1024).
  REQUEST_BODY_LIMIT: z.string().min(1).default("2mb"),
  QR_DEFAULT_ECC: z.enum(["low", "medium", "quartile", "high"]).default("medium"),
  QR_DEFAULT_SIZE: envInteger
    .refine((size) => size >= 128 && size <= 4096, { message: "debe estar entre 128 y 4096" })
    .default(1024),
  QR_MIN_SIZE: envInteger.default(128),
  QR_MAX_SIZE: envInteger.default(4096),
  QR_DEFAULT_MARGIN: envInteger.default(4),
  QR_MAX_TEXT_LENGTH: envInteger.default(500),
  QR_ENABLE_SERVER_PNG: envBoolean.default(true),
  QR_ENABLE_LOGO: envBoolean.default(true),
  LOGO_MAX_BYTES: envInteger
    .refine((bytes) => bytes > 0 && bytes <= 10 * 1024 * 1024, {
      message: "debe estar entre 1 y 10485760",
    })
    .default(2 * 1024 * 1024),
  LOGO_MAX_DIMENSION: envInteger
    .refine((dimension) => dimension > 0 && dimension <= 4096, {
      message: "debe estar entre 1 y 4096",
    })
    .default(1024),
  RATE_LIMIT_VALIDATE_PER_MINUTE: envInteger.default(120),
  RATE_LIMIT_RENDER_PER_MINUTE: envInteger.default(60),
  RATE_LIMIT_PNG_PER_MINUTE: envInteger.default(20),
  RATE_LIMIT_UPLOAD_PER_HOUR: envInteger.default(20),
  // Subida de archivos (Fase 05, docs/07 §5). Activado por defecto; producción
  // puede apagarlo con FILE_UPLOAD_ENABLED=false (p. ej. sin text/plain).
  FILE_UPLOAD_ENABLED: envBoolean.default(true),
  FILE_MAX_BYTES: envInteger
    .refine((bytes) => bytes > 0 && bytes <= 100 * 1024 * 1024, {
      message: "debe estar entre 1 y 104857600",
    })
    .default(10 * 1024 * 1024),
  FILE_ALLOWED_TYPES: z
    .string()
    .min(1)
    .default("image/png,image/jpeg,image/webp,application/pdf,text/plain"),
  FILE_ANONYMOUS_TTL_HOURS: envInteger
    .refine((hours) => hours >= 0 && hours <= 24 * 365, {
      message: "debe estar entre 0 y 8760",
    })
    .default(168),
  FILE_TEMP_DIR: z.string().min(1).default("/tmp/acore-qr"),
  FILE_STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  FILE_PUBLIC_BASE_URL: z.url().default("http://localhost:4000"),
  FILE_RATE_LIMIT_UPLOAD_PER_HOUR: envInteger.default(10),
  FILE_RATE_LIMIT_DOWNLOAD_PER_MINUTE: envInteger.default(120),
  FILE_CLEANUP_INTERVAL_MINUTES: envInteger.default(60),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;

/** Parsea y valida el entorno del API. Lanza si falta o es inválido (fallo temprano). */
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
