import { describe, expect, it } from "vitest";
import {
  assertLogoAllowed,
  detectImageFormat,
  QrLogoInvalidError,
  QrLogoTooLargeError,
} from "../src/index.js";

const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const WEBP_MAGIC = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const SVG_DISGUISED = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>');
const GARBAGE = new TextEncoder().encode("no soy una imagen");

describe("detectImageFormat (firma mágica)", () => {
  it("detecta PNG, JPEG y WebP por firma, no por extensión", () => {
    expect(detectImageFormat(PNG_MAGIC)).toBe("png");
    expect(detectImageFormat(JPEG_MAGIC)).toBe("jpeg");
    expect(detectImageFormat(WEBP_MAGIC)).toBe("webp");
  });

  it("rechaza SVG disfrazado y binarios desconocidos", () => {
    expect(detectImageFormat(SVG_DISGUISED)).toBeNull();
    expect(detectImageFormat(GARBAGE)).toBeNull();
  });
});

describe("assertLogoAllowed", () => {
  it("acepta un PNG dentro de los límites", () => {
    expect(() => assertLogoAllowed({ bytes: PNG_MAGIC, width: 64, height: 64 })).not.toThrow();
  });

  it("rechaza un logo que no es una imagen permitida (SVG disfrazado)", () => {
    expect(() => assertLogoAllowed({ bytes: SVG_DISGUISED, width: 64, height: 64 })).toThrow(
      QrLogoInvalidError,
    );
  });

  it("rechaza logos que superan el tamaño máximo (2 MB)", () => {
    const big = new Uint8Array(2 * 1024 * 1024 + 1);
    big.set(PNG_MAGIC);
    expect(() => assertLogoAllowed({ bytes: big, width: 100, height: 100 })).toThrow(
      QrLogoTooLargeError,
    );
  });

  it("rechaza logos que superan 1024×1024", () => {
    expect(() => assertLogoAllowed({ bytes: PNG_MAGIC, width: 2048, height: 1024 })).toThrow(
      QrLogoTooLargeError,
    );
  });
});
