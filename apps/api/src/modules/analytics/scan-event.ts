/**
 * Recorder de eventos de escaneo (Fase 08): se dispara desde el redirect
 * DESPUÉS de resolver la respuesta y NUNCA bloquea ni rompe la redirección.
 * Todo error de escritura se registra y se ignora (redirect primero, evento
 * después — docs/07 §15).
 */
import type { Request, Response } from "express";
import type { Pool } from "pg";
import type { RedirectResolution } from "../dynamic-qrs/dynamic-qr.service.js";
import { createAnalyticsRepository } from "./analytics.repository.js";
import { classifyUserAgent } from "./bot-policy.js";
import { newScanEventId } from "./ids.js";
import { dailyVisitorHash } from "./visitor-hash.js";

export interface ScanRecorder {
  /** Registra un escaneo sin esperar; nunca lanza. */
  record(req: Request, res: Response, resolution: RedirectResolution): void;
}

/** Dominio del referrer (sin path ni query) o null si no hay/parsea. */
function referrerDomainOf(referer: string | undefined): string | null {
  if (referer === undefined || referer === "") {
    return null;
  }
  try {
    return new URL(referer).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function requestIdOf(res: Response): string | undefined {
  const value = res.getHeader("x-request-id");
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function createScanRecorder(input: { pool: Pool; hmacSecret: string }): ScanRecorder {
  const repo = createAnalyticsRepository(input.pool);

  return {
    record(req, res, resolution) {
      // Solo redirects reales: pausado/expirado/inexistente no cuentan como escaneo.
      if (resolution.kind !== "ok") {
        return;
      }
      let visitorHash: string | null = null;
      let isBot = false;
      let deviceFamily = "unknown";
      let referrerDomain: string | null = null;
      try {
        const userAgent = req.header("user-agent");
        const info = classifyUserAgent(userAgent);
        isBot = info.isBot;
        deviceFamily = info.deviceFamily;
        visitorHash = info.isBot
          ? null
          : (dailyVisitorHash(input.hmacSecret, req.ip, userAgent) ?? null);
        referrerDomain = referrerDomainOf(req.header("referer"));
      } catch {
        // Clasificar nunca debe tumbar el redirect: se omite el evento.
        return;
      }

      void repo
        .insertEvent(input.pool, {
          id: newScanEventId(),
          qrId: resolution.qrId,
          scannedAt: new Date(),
          visitorHash,
          isBot,
          deviceFamily,
          referrerDomain,
          requestId: requestIdOf(res),
        })
        .catch((error: unknown) => {
          console.warn("[analytics] evento de escaneo omitido", error);
        });
    },
  };
}
