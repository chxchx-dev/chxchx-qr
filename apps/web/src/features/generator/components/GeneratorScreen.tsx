/** Pantalla del generador: reducer + hooks + layout responsive (formulario | preview sticky). */
import { webConfig } from "@acore/config";
import { useReducer, useState } from "react";
import { FileUploadField } from "../../files/FileUploadField";
import { useFileUpload } from "../../files/useFileUpload";
import type { DraftValue } from "../generator.types";
import { useLogoPreview } from "../hooks/useLogoPreview";
import { useQrDownload } from "../hooks/useQrDownload";
import { useQrPreview } from "../hooks/useQrPreview";
import { useQrValidation } from "../hooks/useQrValidation";
import { createInitialState, generatorReducer } from "../state/generator.reducer";
import { ContentTypeSelector } from "./ContentTypeSelector";
import { DownloadActions } from "./DownloadActions";
import { GeneratorForm } from "./GeneratorForm";
import { LogoControl } from "./LogoControl";
import { PreviewPanel } from "./PreviewPanel";
import { PrintSizeGuide } from "./PrintSizeGuide";
import { QrOptionsPanel } from "./QrOptionsPanel";
import { ScannabilityBadge } from "./ScannabilityBadge";
import { ValidationSummary } from "./ValidationSummary";

export function GeneratorScreen() {
  const [state, dispatch] = useReducer(generatorReducer, undefined, createInitialState);
  const draft = state.drafts[state.contentType] ?? {};

  const validation = useQrValidation({ type: state.contentType, draft, options: state.options });
  const preview = useQrPreview({ type: state.contentType, draft, options: state.options });
  const { state: downloadState, download, copy } = useQrDownload();
  const logo = useLogoPreview();
  const fileUpload = useFileUpload();
  const [filename, setFilename] = useState("qr-code");

  const hasLogo = state.options.logo !== undefined;
  // "Archivo" solo se ofrece cuando el despliegue lo habilita (Fase 05).
  // Se lee vía web-config para que el default true aplique también en runtime.
  const fileEnabled = webConfig(import.meta.env).VITE_FILE_UPLOAD_ENABLED;

  function updateField(field: string, value: DraftValue): void {
    dispatch({ type: "UPDATE_DRAFT", field, value });
  }

  function handleLogoSelected(file: File): void {
    void logo.select(file).then((uploaded) => {
      if (uploaded !== undefined) {
        // Con logo, la corrección de errores se fija en máxima (política Fase 04).
        dispatch({ type: "UPDATE_OPTIONS", options: { logo: uploaded.dataUri, ecc: "high" } });
      }
    });
  }

  function handleLogoRemoved(): void {
    logo.clear();
    dispatch({ type: "UPDATE_OPTIONS", options: { logo: undefined } });
  }

  function handleFileSelected(file: File): void {
    void fileUpload.upload(file).then((result) => {
      if (result === undefined) {
        return;
      }
      // El draft guarda la URL pública; el QR reutiliza el pipeline de URL.
      dispatch({ type: "UPDATE_DRAFT", field: "url", value: result.url });
      dispatch({ type: "UPDATE_DRAFT", field: "fileName", value: result.fileName });
      dispatch({ type: "UPDATE_DRAFT", field: "expiresAt", value: result.expiresAt });
    });
  }

  function handleFileRemoved(): void {
    fileUpload.clear();
    dispatch({ type: "RESET_DRAFT" });
  }

  function handleDownload(format: "svg" | "gif" | "png"): void {
    if (validation.dto === undefined) {
      return;
    }
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
          fileEnabled={fileEnabled}
        />
        {state.contentType === "file" ? (
          <FileUploadField
            state={fileUpload.state}
            onSelect={handleFileSelected}
            onRemove={handleFileRemoved}
            onCancel={() => fileUpload.clear()}
          />
        ) : (
          <GeneratorForm
            state={state}
            fieldErrors={validation.fieldErrors}
            onUpdateField={updateField}
            onReset={() => dispatch({ type: "RESET_DRAFT" })}
          />
        )}
        <QrOptionsPanel
          options={state.options}
          onChange={(options) => dispatch({ type: "UPDATE_OPTIONS", options })}
          onReset={() => dispatch({ type: "RESET_OPTIONS" })}
        />
        <LogoControl
          state={logo.state}
          onSelect={handleLogoSelected}
          onRemove={handleLogoRemoved}
        />
        <PrintSizeGuide size={state.options.size} />
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
        <PreviewPanel svg={preview.svg} />
        <ScannabilityBadge
          hasLogo={hasLogo}
          roundTrip={preview.roundTrip}
          validation={validation}
        />
        <ValidationSummary validation={validation} />
        <DownloadActions
          validation={validation}
          downloadState={downloadState}
          filename={filename}
          hasLogo={hasLogo}
          onFilenameChange={setFilename}
          onDownload={handleDownload}
          onCopy={() => {
            if (validation.payload !== undefined) {
              void copy(validation.payload);
            }
          }}
        />
      </div>
    </div>
  );
}
