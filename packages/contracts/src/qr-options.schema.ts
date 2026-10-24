/** Opciones de renderizado QR compartidas entre web y API. */
import { z } from "zod";

export const QR_SIZE_LIMITS = { min: 128, max: 4096 } as const;
export const QR_MARGIN_LIMITS = { min: 0, max: 16 } as const;

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
});

export type QrRenderOptions = z.infer<typeof qrOptionsSchema>;
