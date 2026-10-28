/** Validación local del draft con el esquema compartido (contrato). */
import { type QrContent, qrContentSchema } from "@chxchx/contracts";
import type { ZodError } from "zod";
import type { ContentDraft, QrContentType } from "../generator.types";
import { buildContentDto, hasAnyInput } from "./build-dto";

export interface DraftValidation {
  /** DTO validado listo para preview/API, o undefined si el draft no pasa. */
  dto: QrContent | undefined;
  errors: Record<string, string>;
  hasInput: boolean;
}

/** Convierte un mensaje de zod en texto amigable para el usuario. */
function friendlyMessage(message: string): string {
  if (message === "Required" || message.startsWith("Too small") || message === "Invalid input") {
    return "Este campo es obligatorio";
  }
  if (/expected number|received nan|invalid input/i.test(message)) {
    return "Escribe un número válido";
  }
  return message;
}

export function validateDraft(type: QrContentType, draft: ContentDraft): DraftValidation {
  const hasInput = hasAnyInput(draft);
  const dto = buildContentDto(type, draft);
  const result = qrContentSchema.safeParse(dto);
  if (result.success) {
    return { dto: result.data, errors: {}, hasInput };
  }
  return { dto: undefined, errors: toFieldErrors(result.error), hasInput };
}

export function toFieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field === undefined || typeof field !== "string") {
      continue;
    }
    if (errors[field] === undefined) {
      errors[field] = friendlyMessage(issue.message);
    }
  }
  return errors;
}
