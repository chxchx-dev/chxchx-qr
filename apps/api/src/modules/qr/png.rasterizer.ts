/** Rasteriza en PNG el SVG generado por qr-core y comprueba su lectura final. */
import { decodeRgbImage, type PngRasterizer, QrRenderUnscannableError } from "@chxchx/qr-core";
import sharp from "sharp";

const MAX_INPUT_PIXELS = 4096 * 4096;

export const sharpPngRasterizer: PngRasterizer = async ({ svg }) => {
  try {
    const png = await sharp(Buffer.from(svg), { limitInputPixels: MAX_INPUT_PIXELS })
      .png()
      .toBuffer();
    return new Uint8Array(png);
  } catch {
    throw new Error("No se pudo rasterizar el SVG del QR a PNG.");
  }
};

/** Decodifica el PNG final y comprueba que contenga el payload esperado. */
export async function verifyPngPayload(png: Uint8Array, expectedPayload: string): Promise<void> {
  const { data, info } = await sharp(Buffer.from(png), {
    limitInputPixels: MAX_INPUT_PIXELS,
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
      "El PNG generado no decodifica el contenido esperado. Ajusta el tamaño o acorta el contenido.",
    );
  }
}
