/**
 * Cliente de la API de archivos (Fase 05, ADR-003): sube un archivo permitido
 * con progreso real vía XMLHttpRequest (fetch no expone upload progress) y
 * devuelve la URL pública `{base}/f/{token}`. El binario nunca vive en el QR.
 */
import {
  type ErrorCode,
  ErrorCodes,
  FILE_UPLOAD_LIMITS,
  type FileUploadResponse,
} from "@acore/contracts";

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class FileApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string | undefined;

  constructor(status: number, code: string, detail?: string) {
    super(detail ?? code);
    this.name = "FileApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export interface UploadProgress {
  /** Progreso de bytes enviados (0-100); solo si el navegador lo conoce. */
  percent: number;
}

function toApiError(status: number, body: unknown): FileApiError {
  if (typeof body === "object" && body !== null) {
    const problem = body as { code?: string; detail?: string };
    if (typeof problem.code === "string") {
      return new FileApiError(status, problem.code, problem.detail);
    }
  }
  return new FileApiError(status, "FILE_NETWORK_ERROR", undefined);
}

/**
 * Sube el archivo con progreso y soporte de cancelación (AbortSignal).
 * La validación final (firma mágica, extensión, re-encode) es de la API.
 */
export function uploadFileRequest(
  file: File,
  onProgress: (progress: UploadProgress) => void,
  signal: AbortSignal,
): Promise<FileUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/files`);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress({ percent: Math.round((event.loaded / event.total) * 100) });
      }
    };
    const onAbortSignal = () => xhr.abort();
    signal.addEventListener("abort", onAbortSignal, { once: true });
    const done = () => signal.removeEventListener("abort", onAbortSignal);

    xhr.onload = () => {
      done();
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as FileUploadResponse);
        return;
      }
      reject(toApiError(xhr.status, xhr.response));
    };
    xhr.onerror = () => {
      done();
      reject(new FileApiError(0, "FILE_NETWORK_ERROR", undefined));
    };
    xhr.onabort = () => {
      done();
      reject(new DOMException("Subida cancelada", "AbortError"));
    };

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

/**
 * Comprobaciones rápidas en cliente (la API es la autoridad final): devuelve
 * el código del contrato para mapear el mensaje, o undefined si puede subirse.
 */
export function clientSideFileError(file: File): ErrorCode | undefined {
  if (file.size > FILE_UPLOAD_LIMITS.maxBytes) {
    return ErrorCodes.FILE_TOO_LARGE;
  }
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const blocked = FILE_UPLOAD_LIMITS.blockedExtensions.some((blocked) => blocked === extension);
  if (blocked) {
    return ErrorCodes.FILE_TYPE_NOT_ALLOWED;
  }
  return undefined;
}
