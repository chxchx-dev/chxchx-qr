/** Contrato común de los formularios por tipo de contenido. */
import type { ContentDraft, DraftValue } from "../generator.types";

export interface FieldsProps {
  draft: ContentDraft;
  errors: Record<string, string>;
  onChange: (field: string, value: DraftValue) => void;
}
