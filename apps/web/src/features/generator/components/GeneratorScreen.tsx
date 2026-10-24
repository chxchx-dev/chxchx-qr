/** Formulario y vista previa de QR estáticos; todo render pasa por la API. */
import { useReducer, useState } from "react";
import type { ContentDraft, DraftValue } from "../generator.types";
import { useQrDownload } from "../hooks/useQrDownload";
import { useQrPreview } from "../hooks/useQrPreview";
import { useQrValidation } from "../hooks/useQrValidation";
import { createInitialState, generatorReducer } from "../state/generator.reducer";
import { ContentTypeSelector } from "./ContentTypeSelector";
import { DownloadActions } from "./DownloadActions";
import { GeneratorForm } from "./GeneratorForm";
import { PreviewPanel } from "./PreviewPanel";
import { PrintSizeGuide } from "./PrintSizeGuide";
import { QrOptionsPanel } from "./QrOptionsPanel";
import { ValidationSummary } from "./ValidationSummary";

const EMPTY_DRAFT: ContentDraft = {};

export function GeneratorScreen() {
  const [state, dispatch] = useReducer(generatorReducer, undefined, createInitialState);
  const draft = state.drafts[state.contentType] ?? EMPTY_DRAFT;
  const validation = useQrValidation({ type: state.contentType, draft, options: state.options });
  const preview = useQrPreview({
    content:
      validation.status === "valid" || validation.status === "warning" ? validation.dto : undefined,
    options: state.options,
  });
  const { state: downloadState, download, copy } = useQrDownload();
  const [filename, setFilename] = useState("qr-code");

  function updateField(field: string, value: DraftValue): void {
    dispatch({ type: "UPDATE_DRAFT", field, value });
  }

  function handleDownload(format: "svg" | "gif" | "png"): void {
    if (validation.dto === undefined) return;
    void download({
      content: validation.dto,
      options: { ...state.options, format },
      filename,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div className="flex flex-col gap-8">
        <ContentTypeSelector
          value={state.contentType}
          onChange={(contentType) => dispatch({ type: "SELECT_TYPE", contentType })}
        />
        <GeneratorForm
          state={state}
          fieldErrors={validation.fieldErrors}
          onUpdateField={updateField}
          onReset={() => dispatch({ type: "RESET_DRAFT" })}
        />
        <QrOptionsPanel
          options={state.options}
          onChange={(options) => dispatch({ type: "UPDATE_OPTIONS", options })}
          onReset={() => dispatch({ type: "RESET_OPTIONS" })}
        />
        <PrintSizeGuide size={state.options.size} />
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
        <PreviewPanel preview={preview} />
        <ValidationSummary validation={validation} />
        <DownloadActions
          validation={validation}
          downloadState={downloadState}
          filename={filename}
          onFilenameChange={setFilename}
          onDownload={handleDownload}
          onCopy={() => {
            if (validation.payload !== undefined) void copy(validation.payload);
          }}
        />
      </div>
    </div>
  );
}
