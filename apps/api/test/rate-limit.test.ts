import { describe, expect, it } from "vitest";
import { postJson, startTestServer } from "./helpers.js";

describe("rate limit (docs/07 §11)", () => {
  it("limita el render PNG a la cuota por minuto (429 QR_RATE_LIMITED)", async () => {
    const { baseUrl } = await startTestServer({
      RATE_LIMIT_PNG_PER_MINUTE: "2",
      RATE_LIMIT_RENDER_PER_MINUTE: "100",
    });
    const body = {
      content: { type: "text", text: "hola" },
      options: {
        format: "png",
        ecc: "medium",
        size: 128,
        marginModules: 4,
        foreground: "#000000",
        background: "#FFFFFF",
      },
    };
    const first = await postJson(baseUrl, "/api/v1/qr/render", body);
    const second = await postJson(baseUrl, "/api/v1/qr/render", body);
    const third = await postJson(baseUrl, "/api/v1/qr/render", body);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    const problem = (await third.json()) as { code: string };
    expect(problem.code).toBe("QR_RATE_LIMITED");
    expect(third.headers.get("retry-after")).toBeTruthy();
  });

  it("el render SVG/GIF usa su propia cuota (no consume la de PNG)", async () => {
    const { baseUrl } = await startTestServer({
      RATE_LIMIT_PNG_PER_MINUTE: "1",
      RATE_LIMIT_RENDER_PER_MINUTE: "3",
    });
    const png = {
      content: { type: "text", text: "hola" },
      options: {
        format: "png",
        ecc: "medium",
        size: 128,
        marginModules: 4,
        foreground: "#000000",
        background: "#FFFFFF",
      },
    };
    const svg = {
      content: { type: "text", text: "hola" },
      options: {
        format: "svg",
        ecc: "medium",
        size: 128,
        marginModules: 4,
        foreground: "#000000",
        background: "#FFFFFF",
      },
    };
    expect((await postJson(baseUrl, "/api/v1/qr/render", png)).status).toBe(200);
    expect((await postJson(baseUrl, "/api/v1/qr/render", svg)).status).toBe(200);
    // PNG agotó su cuota; SVG sigue su cuota propia.
    expect((await postJson(baseUrl, "/api/v1/qr/render", png)).status).toBe(429);
    expect((await postJson(baseUrl, "/api/v1/qr/render", svg)).status).toBe(200);
  });

  it("limita el validate a su cuota", async () => {
    const { baseUrl } = await startTestServer({
      RATE_LIMIT_VALIDATE_PER_MINUTE: "2",
      RATE_LIMIT_PNG_PER_MINUTE: "100",
      RATE_LIMIT_RENDER_PER_MINUTE: "100",
    });
    const body = { content: { type: "text", text: "hola" } };
    expect((await postJson(baseUrl, "/api/v1/qr/validate", body)).status).toBe(200);
    expect((await postJson(baseUrl, "/api/v1/qr/validate", body)).status).toBe(200);
    expect((await postJson(baseUrl, "/api/v1/qr/validate", body)).status).toBe(429);
  });
});
