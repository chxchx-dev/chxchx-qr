/**
 * Límites del API QR.
 *
 * - Rate limit en memoria por IP (ventana deslizante simple, reset perezoso).
 *   Limitación documentada: es por proceso; con varios nodos se reparte la
 *   cuota. Suficiente para el alcance actual (sin DB ni Redis).
 * - PNG tiene un límite menor porque el render consume más CPU y memoria.
 */
import type { ApiConfig } from "@chxchx/config";
import { ErrorCodes } from "@chxchx/contracts";
import type { Request, RequestHandler } from "express";
import { sendProblem } from "../../errors.js";

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 10_000;
const CLEANUP_BATCH_SIZE = 100;

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** IP del cliente resuelta por Express según la confianza de proxy configurada. */
  getKey: (req: Request) => string;
}

/** Crea un limitador por ventana fija con limpieza incremental y memoria acotada. */
export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();
  let cleanupCursor: Iterator<string> | undefined;

  const purgeExpired = (now: number): void => {
    if (buckets.size === 0) {
      cleanupCursor = undefined;
      return;
    }

    cleanupCursor ??= buckets.keys();
    for (let inspected = 0; inspected < CLEANUP_BATCH_SIZE; inspected += 1) {
      const entry = cleanupCursor.next();
      if (entry.done) {
        cleanupCursor = buckets.keys();
        break;
      }
      const bucket = buckets.get(entry.value);
      if (bucket !== undefined && bucket.resetAt <= now) {
        buckets.delete(entry.value);
      }
    }
  };

  const evictOldest = (): void => {
    const oldest = buckets.keys().next();
    if (!oldest.done) buckets.delete(oldest.value);
  };

  return (req, res, next) => {
    const key = options.getKey(req);
    const now = Date.now();
    purgeExpired(now);
    let bucket = buckets.get(key);
    if (bucket === undefined || bucket.resetAt <= now) {
      if (bucket !== undefined) buckets.delete(key);
      while (buckets.size >= MAX_BUCKETS) evictOldest();
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    } else {
      // Mantiene los clientes activos al final para que el tope expulse los más antiguos.
      buckets.delete(key);
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

/** Monta los limitadores por ruta según la configuración de la API. */
export function createQrRateLimiters(config: ApiConfig): QrRateLimiters {
  // Express resuelve req.ip respetando la política `trust proxy` de createApp.
  const getKey = (req: Request): string => req.ip || "unknown";

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
