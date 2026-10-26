import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createCorsMiddleware } from "../../src/cors.js";

const ALLOWED_ORIGIN = "https://app.example.com";

function runCors(method: string, origin: string | undefined) {
  const req = {
    method,
    header: vi.fn(() => origin),
  } as unknown as Request;
  const mock = {
    setHeader: vi.fn(),
    sendStatus: vi.fn(),
  };
  const res = mock as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;

  createCorsMiddleware(ALLOWED_ORIGIN)(req, res, next);
  return { mock, next };
}

describe("createCorsMiddleware", () => {
  it("permite el origen configurado y continúa la petición", () => {
    const { mock, next } = runCors("GET", ALLOWED_ORIGIN);

    expect(mock.setHeader).toHaveBeenCalledWith("Vary", "Origin");
    expect(mock.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    expect(mock.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    expect(mock.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Headers",
      "Content-Type,X-Request-Id",
    );
    expect(mock.sendStatus).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it("responde al preflight del origen permitido sin continuar", () => {
    const { mock, next } = runCors("OPTIONS", ALLOWED_ORIGIN);

    expect(mock.sendStatus).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
  });

  it("continúa solicitudes normales de otro origen sin habilitar CORS", () => {
    const { mock, next } = runCors("GET", "https://otro.example.com");

    expect(mock.setHeader).toHaveBeenCalledWith("Vary", "Origin");
    expect(mock.setHeader).not.toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      expect.anything(),
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("cierra preflight de otro origen sin habilitar CORS", () => {
    const { mock, next } = runCors("OPTIONS", "https://otro.example.com");

    expect(mock.sendStatus).toHaveBeenCalledWith(204);
    expect(mock.setHeader).not.toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      expect.anything(),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("permite solicitudes sin cabecera Origin", () => {
    const { mock, next } = runCors("GET", undefined);

    expect(mock.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    expect(next).toHaveBeenCalledOnce();
  });
});
