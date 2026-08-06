/**
 * Estado de la subida de archivos (Fase 05): idle → uploading → done | error.
 * La URL resultante vive en el draft del generador; este hook solo gestiona el
 * progreso transitorio, la cancelación y el resultado listo para el draft.
 */
import { ErrorCodes, type FileUploadResponse } from "@acore/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { ui } from "../../shared/lib/messages";
import {
  clientSideFileError,
  FileApiError,
  type UploadProgress,
  uploadFileRequest,
} from "./file-api.client";

export type FileUploadStatus = "idle" | "uploading" | "done" | "error";

export interface FileUploadState {
  status: FileUploadStatus;
  /** Progreso 0-100 de la subida en curso. */
  percent: number;
  /** Respuesta de la API cuando la subida terminó (null en otro estado). */
  result: FileUploadResponse | undefined;
  /** Mensaje visible para el usuario (error o nota). */
  message: string | undefined;
}

export interface FileUploadController {
  state: FileUploadState;
  /** Valida en cliente y sube; devuelve el resultado para el draft (si procede). */
  upload: (file: File) => Promise<FileUploadResponse | undefined>;
  /** Cancela la subida en curso y limpia el estado. */
  clear: () => void;
}

const initialState: FileUploadState = {
  status: "idle",
  percent: 0,
  result: undefined,
  message: undefined,
};

export function useFileUpload(): FileUploadController {
  const [state, setState] = useState<FileUploadState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const upload = useCallback(async (file: File): Promise<FileUploadResponse | undefined> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Comprobación rápida en cliente; el servidor sigue siendo el árbitro.
    const clientError = clientSideFileError(file);
    if (clientError !== undefined) {
      const message =
        clientError === ErrorCodes.FILE_TOO_LARGE ? ui.files.tooLarge : ui.files.typeNotAllowed;
      setState({ status: "error", percent: 0, result: undefined, message });
      return undefined;
    }

    setState({ status: "uploading", percent: 0, result: undefined, message: undefined });
    try {
      const result = await uploadFileRequest(
        file,
        (progress: UploadProgress) => {
          setState((prev) =>
            prev.status === "uploading" ? { ...prev, percent: progress.percent } : prev,
          );
        },
        controller.signal,
      );
      setState({ status: "done", percent: 100, result, message: undefined });
      return result;
    } catch (error) {
      // Solo el controller activo puede tocar el estado: un abort de una subida
      // vieja (por ejemplo al iniciar otra) no debe pisar el estado de la nueva.
      if (abortRef.current !== controller) {
        return undefined;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        setState(initialState);
        return undefined;
      }
      const detail =
        error instanceof FileApiError && error.detail !== undefined ? error.detail : ui.files.error;
      setState({ status: "error", percent: 0, result: undefined, message: detail });
      return undefined;
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setState(initialState);
  }, []);

  // Si el componente desaparece con una subida en curso, se cancela.
  useEffect(() => () => abortRef.current?.abort(), []);

  return { state, upload, clear };
}
