/**
 * Servicio de redirección (Fase 06): resuelve el slug con cache TTL. La
 * redirección nunca depende de analítica (solo DB + cache) y los errores no
 * revelan el destino.
 */
import type { DynamicQrService, RedirectResolution } from "../dynamic-qrs/dynamic-qr.service.js";
import type { RedirectCache } from "./redirect-cache-policy.js";

export function createRedirectService(
  dynamicQrs: DynamicQrService,
  cache: RedirectCache,
): { resolve: (slug: string) => Promise<RedirectResolution> } {
  return {
    async resolve(slug) {
      const cached = cache.get(slug);
      if (cached !== undefined) {
        return cached;
      }
      const resolution = await dynamicQrs.resolveSlug(slug);
      // Solo se cachean los estados estables (ok/paused); missing/expired no.
      if (resolution.kind === "ok" || resolution.kind === "paused") {
        cache.set(slug, resolution);
      }
      return resolution;
    },
  };
}
