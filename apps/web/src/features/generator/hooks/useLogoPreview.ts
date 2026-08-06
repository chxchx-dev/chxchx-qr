/** Estado del logo: subida a la API (re-encode seguro) y data URI en memoria. */
import { useCallback, useRef, useState } from "react";
import { ui } from "../../../shared/lib/messages";
import { QrApiError, type UploadedLogo, uploadLogoRequest } from "../services/qr-api.client";

export type LogoStatus = "idle" | "uploading" | "ready" | "error";

export interface LogoPreviewState {
  status: LogoStatus;
  /** Logo re-encodado por la API (viaja en options.logo). */
  dataUri: string | undefined;
  /** Explicación del error visible para el usuario. */
  message: string | undefined;
}

export interface LogoController {
  state: LogoPreviewState;
  /** Selecciona un archivo, lo sube y devuelve el logo procesado (si procede). */
  select: (file: File) => Promise<UploadedLogo | undefined>;
  clear: () => void;
}

export function useLogoPreview(): LogoController {
  const [state, setState] = useState<LogoPreviewState>({
    status: "idle",
    dataUri: undefined,
    message: undefined,
  });
  const abortRef = useRef<AbortController | null>(null);

  const select = useCallback(async (file: File): Promise<UploadedLogo | undefined> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "uploading", dataUri: undefined, message: undefined });
    try {
      const uploaded = await uploadLogoRequest(file, controller.signal);
      setState({
        status: "ready",
        dataUri: uploaded.dataUri,
        message: ui.logo.ready,
      });
      return uploaded;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return undefined;
      }
      const detail =
        error instanceof QrApiError && error.detail !== undefined ? error.detail : ui.logo.error;
      setState({ status: "error", dataUri: undefined, message: detail });
      return undefined;
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle", dataUri: undefined, message: undefined });
  }, []);

  return { state, select, clear };
}
