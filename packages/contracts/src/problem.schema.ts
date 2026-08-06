/** Cuerpo de error conforme a RFC 9457 (application/problem+json). */
import { z } from "zod";

export const problemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: z.string(),
  detail: z.string().optional(),
  requestId: z.string().optional(),
});
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
