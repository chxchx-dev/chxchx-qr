/** Opciones de renderizado QR compartidas entre web y API. */
import { z } from "zod";

export const QR_SIZE_LIMITS = { min: 128, max: 4096 } as const;
export const QR_MARGIN_LIMITS = { min: 0, max: 16 } as const;

/** Límites de logo (docs/07 §10): 2 MB de entrada y 1024×1024 máximo. */
export const LOGO_LIMITS = {
  maxBytes: 2 * 1024 * 1024,
  maxDimension: 1024,
  /** Fracción máxima del área QR que puede cubrir el logo (20% inicial). */
  maxAreaFraction: 0.2,
  /** Con logo, la corrección de errores debe ser la máxima. */
  requiredEcc: "high",
} as const;

export const QR_OPTIONS_DEFAULTS = {
  format: "svg",
  ecc: "medium",
  size: 1024,
  marginModules: 4,
  foreground: "#000000",
  background: "#FFFFFF",
} as const;

export const qrOptionsSchema = z.object({
  format: z.enum(["svg", "gif", "png"]).default("svg"),
  ecc: z.enum(["low", "medium", "quartile", "high"]).default("medium"),
  size: z
    .number("Escribe un número válido")
    .int()
    .min(QR_SIZE_LIMITS.min, `Mínimo ${QR_SIZE_LIMITS.min} px`)
    .max(QR_SIZE_LIMITS.max, `Máximo ${QR_SIZE_LIMITS.max} px`)
    .default(QR_OPTIONS_DEFAULTS.size),
  marginModules: z
    .number("Escribe un número válido")
    .int()
    .min(QR_MARGIN_LIMITS.min, `Mínimo ${QR_MARGIN_LIMITS.min}`)
    .max(QR_MARGIN_LIMITS.max, `Máximo ${QR_MARGIN_LIMITS.max}`)
    .default(QR_OPTIONS_DEFAULTS.marginModules),
  foreground: z
    .string()
    .regex(/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/, "Usa un color hexadecimal, por ejemplo #000000")
    .default(QR_OPTIONS_DEFAULTS.foreground),
  background: z
    .string()
    .regex(/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/, "Usa un color hexadecimal, por ejemplo #FFFFFF")
    .default(QR_OPTIONS_DEFAULTS.background),
  /**
   * Logo seguro (Fase 04): data URI `data:image/png;base64,...` del logo ya
   * re-encodado por la API (POST /api/v1/qr/logo). El servidor lo re-valida
   * por firma mágica en cada render; nunca confía en el cliente.
   */
  logo: z
    .string()
    .regex(
      /^data:image\/png;base64,[a-zA-Z0-9+/=]+$/,
      "Logo inválido: usa el logo devuelto por la API",
    )
    .optional(),
});

export type QrRenderOptions = z.infer<typeof qrOptionsSchema>;
