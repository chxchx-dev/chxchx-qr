/** Esquemas URL permitidos y bloqueados (fuente: @acore/contracts). */
import { urlSchemeCheck } from "@acore/contracts";

export const ALLOWED_URL_SCHEMES = urlSchemeCheck.allowed;
export const BLOCKED_URL_SCHEMES = urlSchemeCheck.blocked;

export function isAllowedUrlScheme(protocol: string): boolean {
  return ALLOWED_URL_SCHEMES.includes(protocol as (typeof ALLOWED_URL_SCHEMES)[number]);
}
