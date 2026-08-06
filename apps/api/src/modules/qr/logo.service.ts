/**
 * Servicio de logos (docs/07 §10, Fase 04): decodificación con sharp, re-encode
 * a PNG sin metadata, redimensionado a ≤1024×1024 y límites anti-abuso.
 * Todo el flujo es stateless: el logo viaja como data URI re-encodado.
 */
import type { ApiConfig } from "@acore/config";
import {
  assertLogoAllowed,
  type LogoPolicyLimits,
  QrLogoInvalidError,
  QrLogoTooLargeError,
} from "@acore/qr-core";
import sharp, { type Metadata, type Sharp } from "sharp";
import { SHARP_LIMIT_INPUT_PIXELS } from "./qr-render-limits.js";

export interface ProcessedLogo {
  dataUri: string;
  width: number;
  height: number;
  format: "png";
}

export interface DecodedLogo {
  buffer: Buffer;
  width: number;
  height: number;
}

/** Decodifica una imagen con sharp bajo presupuesto de píxeles. */
function decodeImage(bytes: Uint8Array | Buffer, limitInputPixels: number): Sharp {
  return sharp(bytes, {
    limitInputPixels,
    // No dejar que un PNG corrupto "casi válido" se procese: failOn de errores.
    failOn: "error",
  });
}

/**
 * Valida, re-encodea y redimensiona un logo de entrada. Devuelve el PNG
 * re-encodado (sin metadata) como data URI, listo para el navegador.
 */
export async function processLogo(
  bytes: Uint8Array,
  policy: Pick<LogoPolicyLimits, "maxBytes" | "maxDimension">,
): Promise<ProcessedLogo> {
  const image = decodeImage(bytes, SHARP_LIMIT_INPUT_PIXELS);
  let metadata: Metadata;
  try {
    metadata = await image.metadata();
  } catch {
    throw new QrLogoInvalidError(
      "El archivo no se puede decodificar como imagen: puede estar corrupto o no ser PNG/JPEG/WebP.",
    );
  }
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  assertLogoAllowed({ bytes, width, height, policy });

  try {
    // rotate(): respeta la orientación EXIF; resize dentro de 1024×1024 sin
    // ampliar; png(): re-encode y descarta metadata (EXIF/ICC) por defecto.
    const reencoded = await image
      .rotate()
      .resize({
        width: policy.maxDimension,
        height: policy.maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
    // El PNG re-encodado viaja como data URI en validate/render (body limit
    // 2 MB). Si el re-encode crece más que el límite de entrada (p. ej. foto
    // JPEG ruidosa 1024×1024 → PNG incompresible), se rechaza aquí para que el
    // flujo posterior nunca falle con un 413 genérico.
    if (reencoded.length > policy.maxBytes) {
      throw new QrLogoTooLargeError(
        "El logo re-encodado supera el límite de 2 MB: usa una imagen más simple.",
      );
    }
    const finalMeta = await sharp(reencoded).metadata();
    return {
      dataUri: `data:image/png;base64,${reencoded.toString("base64")}`,
      width: finalMeta.width ?? width,
      height: finalMeta.height ?? height,
      format: "png",
    };
  } catch {
    throw new QrLogoInvalidError("No se pudo re-encodear el logo a PNG seguro.");
  }
}

/**
 * Decodifica un data URI PNG del contrato (options.logo) para el rasterizador.
 * El servidor NUNCA confía en el cliente: se re-valida la firma y el tamaño.
 */
export async function decodeLogoDataUri(
  dataUri: string,
  policy: Pick<LogoPolicyLimits, "maxBytes" | "maxDimension">,
): Promise<DecodedLogo> {
  const match = /^data:image\/png;base64,([a-zA-Z0-9+/=]+)$/.exec(dataUri);
  if (match === null) {
    throw new QrLogoInvalidError("Logo inválido: se esperaba un PNG re-encodado por la API.");
  }
  const base64 = match[1];
  if (base64 === undefined) {
    throw new QrLogoInvalidError("Logo inválido: base64 vacío.");
  }
  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    throw new QrLogoInvalidError("Logo inválido: base64 ilegible.");
  }
  const image = decodeImage(bytes, SHARP_LIMIT_INPUT_PIXELS);
  let metadata: Metadata;
  try {
    metadata = await image.metadata();
  } catch {
    throw new QrLogoInvalidError("Logo inválido: el PNG no se puede decodificar.");
  }
  assertLogoAllowed({
    bytes,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    policy,
  });
  return {
    buffer: bytes,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}

/** Política de logo desde config (bytes y dimensión máximos). */
export function logoPolicyFromConfig(
  config: ApiConfig,
): Pick<LogoPolicyLimits, "maxBytes" | "maxDimension"> {
  return { maxBytes: config.LOGO_MAX_BYTES, maxDimension: config.LOGO_MAX_DIMENSION };
}
