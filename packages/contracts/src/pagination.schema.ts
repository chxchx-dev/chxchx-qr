/**
 * Paginación y filtros de listados (Fase 06). Los query params llegan como
 * strings; z.coerce parsea números y el safeParse del controlador decide 400.
 */
import { z } from "zod";
import { dynamicQrStatusSchema } from "./dynamic-qr.schema.js";

export const PAGINATION_LIMITS = {
  pageMin: 1,
  pageSizeMin: 1,
  pageSizeMax: 100,
  pageSizeDefault: 20,
} as const;

export const pageParam = z.coerce.number().int().min(PAGINATION_LIMITS.pageMin).default(1);
export const pageSizeParam = z.coerce
  .number()
  .int()
  .min(PAGINATION_LIMITS.pageSizeMin)
  .max(PAGINATION_LIMITS.pageSizeMax)
  .default(PAGINATION_LIMITS.pageSizeDefault);

/** Filtros del listado de QR dinámicos. */
export const listDynamicQrsQuerySchema = z.object({
  page: pageParam,
  pageSize: pageSizeParam,
  search: z.string().trim().max(120).optional(),
  status: dynamicQrStatusSchema.optional(),
});

export type ListDynamicQrsQuery = z.infer<typeof listDynamicQrsQuerySchema>;
