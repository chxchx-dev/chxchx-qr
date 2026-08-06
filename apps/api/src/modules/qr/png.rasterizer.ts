/**
 * Rasterizador PNG de la API (ADR-007). Implementa `PngRasterizer` de
 * `@acore/qr-core`: rasteriza el SVG excavado con sharp, compone el logo a
 * nivel de píxel en la caja excavada y —en el render— decodifica el PNG final
 * contra el payload canónico (criterio "la exportación falla si no decodifica").
 */
import { decodeRgbImage, type PngRasterizer, QrRenderUnscannableError } from "@acore/qr-core";
import sharp from "sharp";
import { SHARP_LIMIT_INPUT_PIXELS } from "./qr-render-limits.js";

export const sharpPngRasterizer: PngRasterizer = async ({ svg, logoBox, logoDataUri }) => {
  const pipeline = sharp(Buffer.from(svg), { limitInputPixels: SHARP_LIMIT_INPUT_PIXELS }).png();
  let png: Buffer;
  try {
    png = await pipeline.toBuffer();
  } catch {
    throw new Error("No se pudo rasterizar el SVG del QR a PNG.");
  }

  if (logoBox !== undefined && logoDataUri !== undefined) {
    png = await compositeLogo(png, logoBox, logoDataUri);
  }
  return new Uint8Array(png);
};

/**
 * Compone el logo centrado dentro de la caja excavada, replicando el
 * `preserveAspectRatio="xMidYMid meet"` del SVG (paridad preview/export).
 */
async function compositeLogo(
  png: Buffer,
  box: { x: number; y: number; width: number; height: number },
  logoDataUri: string,
): Promise<Buffer> {
  const logo = sharp(Buffer.from(logoDataUri.split(",")[1] ?? "", "base64"), {
    limitInputPixels: SHARP_LIMIT_INPUT_PIXELS,
  });
  const meta = await logo.metadata();
  const sourceWidth = meta.width ?? box.width;
  const sourceHeight = meta.height ?? box.height;
  const aspect = sourceWidth / sourceHeight;

  let width: number;
  let height: number;
  if (box.width / box.height >= aspect) {
    height = Math.round(box.height);
    width = Math.round(box.height * aspect);
  } else {
    width = Math.round(box.width);
    height = Math.round(box.width / aspect);
  }
  width = Math.max(1, width);
  height = Math.max(1, height);

  const resized = await logo
    .rotate()
    .resize({ width, height, fit: "fill", withoutEnlargement: false })
    .png()
    .toBuffer();

  const left = Math.round(box.x + (box.width - width) / 2);
  const top = Math.round(box.y + (box.height - height) / 2);

  const composed = await sharp(png)
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
  return composed;
}

/**
 * Decodifica un PNG final con el motor de verificación (jsQR) y compara contra
 * el payload canónico. Lanza QrRenderUnscannableError si no coincide.
 */
export async function verifyPngPayload(png: Uint8Array, expectedPayload: string): Promise<void> {
  const { data, info } = await sharp(Buffer.from(png), {
    limitInputPixels: SHARP_LIMIT_INPUT_PIXELS,
  })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let decoded: string | undefined;
  try {
    decoded = decodeRgbImage(
      { width: info.width, height: info.height, data: new Uint8Array(data) },
      4,
    );
  } catch {
    decoded = undefined;
  }
  if (decoded !== expectedPayload) {
    throw new QrRenderUnscannableError(
      "El QR final no decodifica el contenido esperado: reduce el tamaño del logo, aclara su fondo o usa un enlace más corto.",
    );
  }
}
