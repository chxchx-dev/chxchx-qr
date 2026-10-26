import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "../../../../src/modules/qr/qr-render-limits.js";

function createResponse() {
  const mock = {
    getHeader: vi.fn(() => "request-456"),
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn(),
  };
  return { mock, response: mock as unknown as Response };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("createRateLimiter", () => {
  it("limita por clave y libera la cuota al terminar la ventana", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-26T12:00:00Z"));
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 1,
      getKey: (req) => req.ip ?? "unknown",
    });
    const req = { ip: "client-a" } as Request;
    const { mock, response } = createResponse();
    const next = vi.fn();

    limiter(req, response, next);
    expect(next).toHaveBeenCalledOnce();

    limiter(req, response, next);
    expect(mock.setHeader).toHaveBeenCalledWith("Retry-After", "60");
    expect(mock.status).toHaveBeenCalledWith(429);
    expect(mock.set).toHaveBeenCalledWith("Content-Type", "application/problem+json");

    vi.advanceTimersByTime(60_001);
    limiter(req, response, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
