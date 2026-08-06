/** Cliente de la API QR. Todas las llamadas aceptan AbortSignal. */
import type { QrContent, QrRenderOptions, QrValidationResponse } from "@acore/contracts";

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class QrApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string | undefined;

  constructor(status: number, code: string, detail?: string) {
    super(detail ?? code);
    this.name = "QrApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

async function postJson(path: string, body: unknown, signal: AbortSignal): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

async function toApiError(res: Response): Promise<QrApiError> {
  let body: { code?: string; detail?: string } = {};
  try {
    body = (await res.json()) as { code?: string; detail?: string };
  } catch {
    // cuerpo no JSON: se usa el status
  }
  return new QrApiError(res.status, body.code ?? "UNKNOWN_ERROR", body.detail);
}

export async function validateQrRequest(
  content: QrContent,
  options: QrRenderOptions,
  signal: AbortSignal,
): Promise<QrValidationResponse> {
  const res = await postJson("/qr/validate", { content, options }, signal);
  if (!res.ok) {
    throw await toApiError(res);
  }
  return (await res.json()) as QrValidationResponse;
}

export async function renderQrRequest(
  content: QrContent,
  options: QrRenderOptions,
  signal: AbortSignal,
): Promise<Blob> {
  const res = await postJson("/qr/render", { content, options }, signal);
  if (!res.ok) {
    throw await toApiError(res);
  }
  return res.blob();
}

export interface UploadedLogo {
  dataUri: string;
  width: number;
  height: number;
  format: "png";
}

/**
 * Sube un logo (multipart): la API lo valida por firma mágica y lo re-encodea
 * a PNG sin metadata. Devuelve el data URI que viaja en options.logo.
 */
export async function uploadLogoRequest(file: File, signal: AbortSignal): Promise<UploadedLogo> {
  const form = new FormData();
  form.append("logo", file);
  const res = await fetch(`${API_BASE_URL}/qr/logo`, {
    method: "POST",
    body: form,
    signal,
  });
  if (!res.ok) {
    throw await toApiError(res);
  }
  return (await res.json()) as UploadedLogo;
}
