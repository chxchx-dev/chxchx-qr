/**
 * Cliente HTTP compartido (Fase 07): todas las llamadas autenticadas llevan
 * `credentials: "include"` (la sesión vive en cookie HttpOnly; nunca en
 * localStorage). Los errores se normalizan desde Problem Details (RFC 9457).
 */
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string | undefined;

  constructor(status: number, code: string, detail?: string) {
    super(detail ?? code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: { code?: string; detail?: string } = {};
  try {
    body = (await res.json()) as { code?: string; detail?: string };
  } catch {
    // cuerpo no JSON: se usa el status
  }
  return new ApiError(res.status, body.code ?? "UNKNOWN_ERROR", body.detail);
}

/** GET/POST/PATCH/DELETE con credenciales y Content-Type JSON. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    throw await toApiError(res);
  }
  return res;
}

/** Serializa query params omitiendo vacíos/undefined (paginación y filtros). */
export function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs === "" ? "" : `?${qs}`;
}
