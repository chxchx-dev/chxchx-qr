/**
 * Detección de tipo por firma mágica (docs/07 §2 y §6): nunca se confía en el
 * MIME del browser ni en la extensión. Tipos soportados en Fase 05: PNG, JPEG,
 * WebP, PDF y texto plano (UTF-8, sin bytes NUL, ratio de control mínimo).
 */
export interface DetectedFileType {
  mimeType: string;
  /** Extensión canónica (con punto) coherente con el tipo detectado. */
  extension: string;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const TEXT_UTF8_SAMPLE_BYTES = 4096;

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }
  return signature.every((byte, index) => bytes[index] === byte);
}

function isWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) {
    return false;
  }
  const ascii = (offset: number): string => {
    const byte = bytes[offset];
    return byte === undefined ? "\u0000" : String.fromCharCode(byte);
  };
  return (
    ascii(0) === "R" &&
    ascii(1) === "I" &&
    ascii(2) === "F" &&
    ascii(3) === "F" &&
    ascii(8) === "W" &&
    ascii(9) === "E" &&
    ascii(10) === "B" &&
    ascii(11) === "P"
  );
}

/** ¿El contenido parece texto UTF-8 legible? (heurística mínima y testeada). */
function isLikelyText(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, TEXT_UTF8_SAMPLE_BYTES);
  let controlChars = 0;
  for (const byte of sample) {
    // NUL o caracteres de control no permitidos (se admiten \t \n \r).
    if (byte === 0x00 || (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d)) {
      return false;
    }
    if (byte < 0x20) {
      controlChars += 1;
    }
  }
  // El texto real apenas contiene \t\n\r; un ratio alto de control es sospechoso.
  if (sample.length > 0 && controlChars / sample.length > 0.15) {
    return false;
  }
  // UTF-8 estricto: un binario arbitrario suele fallar la decodificación.
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(sample);
    return true;
  } catch {
    return false;
  }
}

/** Detecta el tipo real por firma mágica; null si no coincide con ningún tipo permitido. */
export function detectFileType(bytes: Uint8Array): DetectedFileType | null {
  if (startsWith(bytes, PNG_SIGNATURE)) {
    return { mimeType: "image/png", extension: ".png" };
  }
  if (startsWith(bytes, JPEG_SIGNATURE)) {
    return { mimeType: "image/jpeg", extension: ".jpg" };
  }
  if (isWebp(bytes)) {
    return { mimeType: "image/webp", extension: ".webp" };
  }
  if (startsWith(bytes, PDF_SIGNATURE)) {
    return { mimeType: "application/pdf", extension: ".pdf" };
  }
  if (isLikelyText(bytes)) {
    return { mimeType: "text/plain", extension: ".txt" };
  }
  return null;
}
