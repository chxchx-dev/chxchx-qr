/** Sanea un nombre de archivo: quita separadores de ruta, caracteres de control y puntos finales. */
const FORBIDDEN = /[\\/:*?"<>|]/g;

function isControlCharacter(code: number): boolean {
  return code < 0x20 || code === 0x7f;
}

function stripControlCharacters(value: string): string {
  let result = "";
  for (const char of value) {
    result += isControlCharacter(char.codePointAt(0) ?? 0) ? "-" : char;
  }
  return result;
}

export function sanitizeFilename(input: string): string {
  const cleaned = stripControlCharacters(input)
    .normalize("NFC")
    .replace(FORBIDDEN, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 80);
  return cleaned === "" ? "qr-code" : cleaned;
}
