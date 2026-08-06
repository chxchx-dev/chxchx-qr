import { afterEach, describe, expect, it, vi } from "vitest";
import { updateQr } from "../src/features/dashboard/dashboard-api.client";
import { apiFetch, buildQuery } from "../src/shared/lib/api";

describe("buildQuery", () => {
  it("serializa parámetros y omite vacíos/undefined", () => {
    // URLSearchParams codifica caracteres no ASCII (la API los recibe igual).
    expect(buildQuery({ page: 2, search: "menú", status: undefined })).toBe(
      "?page=2&search=men%C3%BA",
    );
    expect(buildQuery({ page: 1 })).toBe("?page=1");
    expect(buildQuery({ page: 1, search: "", status: undefined })).toBe("?page=1");
    expect(buildQuery({})).toBe("");
  });
});

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("llama con credentials: include (sesión en cookie) y devuelve el body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ user: { id: "usr_1" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiFetch("/auth/me");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: { id: "usr_1" } });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/me");
    expect(init.credentials).toBe("include");
  });

  it("lanza ApiError con el código de Problem Details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: "AUTH_UNAUTHENTICATED", detail: "Inicia sesión" }), {
          status: 401,
        }),
      ),
    );
    await expect(apiFetch("/auth/me")).rejects.toMatchObject({
      status: 401,
      code: "AUTH_UNAUTHENTICATED",
      detail: "Inicia sesión",
    });
  });

  it("lanza ApiError con UNKNOWN_ERROR si el body no es JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no json", { status: 500 })));
    await expect(apiFetch("/x")).rejects.toMatchObject({ status: 500, code: "UNKNOWN_ERROR" });
  });
});

describe("dashboard client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updateQr envía If-Match con la versión (optimistic concurrency)", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ id: "dqr_1", version: 2 }), { status: 200 }),
        ),
    );
    const result = await updateQr("dqr_1", 3, { name: "Nuevo nombre" });
    expect(result.version).toBe(2);
    const fetchMock = vi.mocked(fetch);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/dynamic-qrs/dqr_1");
    expect(init.method).toBe("PATCH");
    const headers = init.headers as Record<string, string>;
    expect(headers["If-Match"]).toBe("v3");
    expect(JSON.parse(String(init.body))).toEqual({ name: "Nuevo nombre" });
  });
});
