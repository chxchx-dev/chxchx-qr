/**
 * Esquemas de administración y reportes de abuso (Fase 08). El reporte es
 * público (con rate limit); el resto de endpoints exigen rol admin.
 */
import { z } from "zod";
import { DYNAMIC_QR_LIMITS } from "./dynamic-qr.schema.js";

export const ABUSE_REPORT_LIMITS = {
  /** Mínimo para evitar ruido automatizado; máximo razonable. */
  reasonMinLength: 10,
  reasonMaxLength: 500,
  /** Motivo de bloqueo/desbloqueo (admin): corto, obligatorio. */
  adminReasonMaxLength: 500,
} as const;

/** Reporte público: slug del QR + motivo. */
export const abuseReportSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(DYNAMIC_QR_LIMITS.slugMinLength, "El slug no es válido")
    .max(DYNAMIC_QR_LIMITS.slugMaxLength, "El slug no es válido"),
  reason: z
    .string()
    .trim()
    .min(
      ABUSE_REPORT_LIMITS.reasonMinLength,
      `Mínimo ${ABUSE_REPORT_LIMITS.reasonMinLength} caracteres`,
    )
    .max(
      ABUSE_REPORT_LIMITS.reasonMaxLength,
      `Máximo ${ABUSE_REPORT_LIMITS.reasonMaxLength} caracteres`,
    ),
});

export type AbuseReportInput = z.infer<typeof abuseReportSchema>;

export const abuseReportStatusSchema = z.enum(["open", "resolved", "dismissed"]);

export type AbuseReportStatus = z.infer<typeof abuseReportStatusSchema>;

export const abuseReportResponseSchema = z.object({
  id: z.string().min(1),
  qrId: z.string().min(1).nullable(),
  slug: z.string().min(1),
  reason: z.string().min(1),
  status: abuseReportStatusSchema,
  createdAt: z.string().datetime(),
});

export type AbuseReportResponse = z.infer<typeof abuseReportResponseSchema>;

export const abuseReportListResponseSchema = z.object({
  items: z.array(abuseReportResponseSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export type AbuseReportListResponse = z.infer<typeof abuseReportListResponseSchema>;

/** Motivo obligatorio para acciones de moderación (block/unblock QR o usuario). */
export const adminActionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "El motivo es obligatorio")
    .max(ABUSE_REPORT_LIMITS.adminReasonMaxLength, "Motivo demasiado largo"),
});

export type AdminActionInput = z.infer<typeof adminActionSchema>;
