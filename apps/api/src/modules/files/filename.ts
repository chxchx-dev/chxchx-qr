/**
 * Sanitización de nombres de archivo (docs/07 §8 y §9): el nombre original
 * NUNCA se usa como ruta ni como nombre de descarga tal cual. Se sanean los
 * separadores de ruta, caracteres de control y longitud, y se fuerza la
 * extensión coherente con el tipo detectado por firma.
 */

const MAX_FILENAME_LENGTH = 180;

/** Elimina caracteres de control C0 (0x00-0x1F) y DEL (0x7F). */
export function stripControlCharacters(value: string): string {
  let result = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) {
      continue;
    }
    result += char;
  }
  return result;
}

/** Limpia el nombre original para mostrarlo y para construir el nombre seguro. */
export function sanitizeOriginalName(originalName: string): string {
  // Quitar separadores de ruta y caracteres de control; normalizar espacios.
  const cleaned = stripControlCharacters(originalName)
    .replace(/[/\\]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) {
    return "archivo";
  }
  return cleaned.slice(0, MAX_FILENAME_LENGTH);
}

/** Nombre de descarga seguro: nombre sanitizado sin extensión + extensión canónica. */
export function buildDownloadName(originalName: string, extension: string): string {
  const sanitized = sanitizeOriginalName(originalName);
  // Eliminar cualquier extensión previa (incluida la bloqueada) y añadir la canónica.
  const stem = sanitized.replace(/\.[^.]+$/, "");
  const safe = stem.slice(0, MAX_FILENAME_LENGTH - extension.length);
  return `${safe}${extension}`;
}

/** Codifica un nombre para Content-Disposition RFC 5987 (filename*). */
export function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * Header Content-Disposition con fallback ASCII (filename="...") y variante
 * RFC 5987 (filename*=UTF-8''...) para nombres con caracteres no ASCII.
 */
export function buildContentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeRfc5987(filename)}`;
}
