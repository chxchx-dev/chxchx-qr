/**
 * Límites del API QR.
 *
 * - Rate limit en memoria por IP (ventana deslizante simple, reset perezoso).
 *   Limitación documentada: es por proceso; con varios nodos se reparte la
 *   cuota. Suficiente para el alcance actual (sin DB ni Redis).
 * - PNG tiene un límite menor porque el render consume más CPU y memoria.
 */
import type { ApiConfig } from "@acore/config";
import { ErrorCodes } from "@acore/contracts";
import type { Request, RequestHandler } from "express";
import { sendProblem } from "../../errors.js";

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Identificador del cliente (IP, o X-Forwarded-For si TRUST_PROXY). */
  getKey: (req: Request) => string;
}

/** Crea un limitador simple (token bucket por ventana fija con reset perezoso). */
export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();
  // Limpieza perezosa: las entradas caducadas se descartan al consultar.
  return (req, res, next) => {
    const key = options.getKey(req);
    const now = Date.now();
    let bucket = buckets.get(key);
    if (bucket === undefined || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > options.max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      sendProblem(
        res,
        429,
        ErrorCodes.QR_RATE_LIMITED,
        "Demasiadas peticiones",
        `Vuelve a intentarlo en ${retryAfter} segundos.`,
      );
      return;
    }
    next();
  };
}

export interface QrRateLimiters {
  validate: RequestHandler;
  /** Elige bucket por formato: SVG/GIF (medio) vs PNG (bajo). */
  render: RequestHandler;
}

/** Monta los limitadores por ruta según config (docs/07 §11). */
export function createQrRateLimiters(config: ApiConfig): QrRateLimiters {
  const getKey = (req: Request): string => {
    const forwarded = req.header("x-forwarded-for");
    if (config.TRUST_PROXY && forwarded !== undefined) {
      return forwarded.split(",")[0]?.trim() ?? "unknown";
    }
    return req.ip ?? "unknown";
  };

  const render = createRateLimiter({
    windowMs: 60_000,
    max: config.RATE_LIMIT_RENDER_PER_MINUTE,
    getKey,
  });
  const png = createRateLimiter({
    windowMs: 60_000,
    max: config.RATE_LIMIT_PNG_PER_MINUTE,
    getKey,
  });

  return {
    validate: createRateLimiter({
      windowMs: 60_000,
      max: config.RATE_LIMIT_VALIDATE_PER_MINUTE,
      getKey,
    }),
    render: (req, res, next) => {
      const format = (req.body as { options?: { format?: string } } | undefined)?.options?.format;
      (format === "png" ? png : render)(req, res, next);
    },
  };
}
