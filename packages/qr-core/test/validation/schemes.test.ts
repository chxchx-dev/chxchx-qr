import { describe, expect, it } from "vitest";
import {
  ALLOWED_URL_SCHEMES,
  BLOCKED_URL_SCHEMES,
  isAllowedUrlScheme,
} from "../../src/validation/schemes.js";

describe("esquemas URL permitidos", () => {
  it.each(ALLOWED_URL_SCHEMES)("acepta %s", (scheme) => {
    expect(isAllowedUrlScheme(scheme)).toBe(true);
  });

  it.each(BLOCKED_URL_SCHEMES)("rechaza %s", (scheme) => {
    expect(isAllowedUrlScheme(scheme)).toBe(false);
  });

  it("rechaza protocolos no definidos", () => {
    expect(isAllowedUrlScheme("custom:")).toBe(false);
  });
});
