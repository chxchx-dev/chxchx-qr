import { afterEach, describe, expect, it, vi } from "vitest";
import {
  blockQr,
  listAbuseReports,
  reportAbuse,
  resolveAbuseReport,
} from "../src/features/admin/admin-api.client";
import { getAnalytics } from "../src/features/analytics/analytics-api.client";

const ANALYTICS_BODY = {
  range: { from: "2026-08-01T00:00:00.000Z", to: "2026-08-05T23:59:59.999Z" },
  totals: { scans: 10, estimatedUnique: 7 },
  series: [{ bucket: "2026-08-01", scans: 10 }],
  devices: [{ family: "mobile", scans: 10 }],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("analytics client", () => {
  it("getAnalytics consulta /dynamic-qrs/:id/analytics con from y granularidad", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(ANALYTICS_BODY)));
    const result = await getAnalytics("dqr_1", {
      from: "2026-08-01T00:00:00.000Z",
      granularity: "week",
    });
    expect(result.totals.scans).toBe(10);
    const [url] = vi.mocked(fetch).mock.calls[0] as [string];
    expect(url).toContain("/dynamic-qrs/dqr_1/analytics");
    expect(url).toContain("granularity=week");
    expect(url).toContain("from=");
  });

  it("getAnalytics omite parámetros vacíos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(ANALYTICS_BODY)));
    await getAnalytics("dqr_1");
    const [url] = vi.mocked(fetch).mock.calls[0] as [string];
    expect(url).not.toContain("granularity");
  });
});

describe("admin client", () => {
  it("reportAbuse publica en /abuse-reports (público) con slug y motivo", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ id: "rep_1", slug: "aB9kP2XqLz", status: "open" }, 201)),
    );
    const report = await reportAbuse("aB9kP2XqLz", "El destino muestra phishing");
    expect(report.id).toBe("rep_1");
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/abuse-reports");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      slug: "aB9kP2XqLz",
      reason: "El destino muestra phishing",
    });
  });

  it("listAbuseReports filtra por estado", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0 })));
    await listAbuseReports({ status: "open" });
    const [url] = vi.mocked(fetch).mock.calls[0] as [string];
    expect(url).toContain("/admin/abuse-reports");
    expect(url).toContain("status=open");
  });

  it("blockQr envía el motivo; resolve usa el endpoint de moderación", async () => {
    // 204 sin body no es construible en la API de Response: se mockea con 200
    // (el cliente solo comprueba res.ok, no el status exacto).
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 200)));
    await blockQr("dqr_1", "Abuso confirmado");
    const [blockUrl, blockInit] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(blockUrl).toContain("/admin/qrs/dqr_1/block");
    expect(JSON.parse(String(blockInit.body))).toEqual({ reason: "Abuso confirmado" });

    await resolveAbuseReport("rep_1");
    const [resolveUrl, resolveInit] = vi.mocked(fetch).mock.calls[1] as [string, RequestInit];
    expect(resolveUrl).toContain("/admin/abuse-reports/rep_1/resolve");
    expect(resolveInit.method).toBe("POST");
  });
});
