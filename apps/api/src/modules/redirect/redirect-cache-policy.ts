/**
 * Política de cache de la redirección (Fase 06): cache en memoria por slug con
 * TTL corto (configurable; 0 = sin cache, p. ej. tests) + headers HTTP que
 * fuerzan revalidación del navegador. Un TTL corto asegura que un cambio de
 * destino se refleje rápido sin depender de invalidación explícita.
 */
import type { RedirectResolution } from "../dynamic-qrs/dynamic-qr.service.js";

export interface RedirectCache {
  get(slug: string): RedirectResolution | undefined;
  set(slug: string, resolution: RedirectResolution): void;
}

export function createRedirectCache(ttlSeconds: number): RedirectCache {
  const entries = new Map<string, { value: RedirectResolution; expiresAt: number }>();
  return {
    get(slug) {
      const entry = entries.get(slug);
      if (entry === undefined) {
        return undefined;
      }
      if (entry.expiresAt <= Date.now()) {
        entries.delete(slug);
        return undefined;
      }
      return entry.value;
    },
    set(slug, resolution) {
      if (ttlSeconds <= 0) {
        return;
      }
      entries.set(slug, { value: resolution, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
  };
}

/** Headers de la 302: el navegador revalida en cada visita. */
export function redirectHeaders(): Record<string, string> {
  return {
    "Cache-Control": "no-cache, private",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
}
