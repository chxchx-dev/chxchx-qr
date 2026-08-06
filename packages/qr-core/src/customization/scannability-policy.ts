/**
 * Política de escaneabilidad (Fase 04): el logo solo es seguro con la máxima
 * corrección de errores (high) y un contenido no crítico. Estas reglas son las
 * mismas en la web (badge) y en la API (validate recomienda, render exige).
 */
import { LOGO_LIMITS } from "@acore/contracts";
import { QrLogoRequiresHighEccError } from "../domain/qr-errors.js";
import type { EccLevel, QrDensity } from "../domain/qr-options.js";

export interface LogoScannabilityInput {
  hasLogo: boolean;
  ecc: EccLevel;
  density: QrDensity;
}

/** Recomendaciones para validate (no bloquean; informan antes de exportar). */
export function logoScannabilityRecommendations(input: LogoScannabilityInput): string[] {
  const recommendations: string[] = [];
  if (input.hasLogo && input.ecc !== LOGO_LIMITS.requiredEcc) {
    recommendations.push(
      "El logo requiere la corrección de errores máxima (alto). La exportación con logo se bloqueará hasta ajustarlo.",
    );
  }
  if (input.hasLogo && input.density === "critical") {
    recommendations.push(
      "Contenido muy denso y logo: el código podría no escanear. Usa un enlace más corto o quita el logo.",
    );
  }
  return recommendations;
}

/** Exigencia en render: con logo, ECC debe ser high (error de dominio). */
export function assertEccAllowedForLogo(ecc: EccLevel, hasLogo: boolean): void {
  if (hasLogo && ecc !== LOGO_LIMITS.requiredEcc) {
    throw new QrLogoRequiresHighEccError(
      `Con un logo, la corrección de errores debe ser la máxima (${LOGO_LIMITS.requiredEcc}).`,
    );
  }
}
