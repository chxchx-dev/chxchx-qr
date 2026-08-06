/**
 * Hash diario del visitante (Fase 08, docs/07 §15): HMAC-SHA256 sobre
 * `${fecha}|${ip}|${userAgent}`. Rota cada día (mismo visitante → hash distinto
 * al día siguiente) y nunca se persiste IP/UA completos. Sin IP o sin UA no hay
 * hash (el evento se registra igual, sin identidad).
 */
import { createHmac } from "node:crypto";

/** YYYY-MM-DD en UTC: el hash rota cada día de servidor. */
export function dayKeyOf(day: Date): string {
  return day.toISOString().slice(0, 10);
}

export function dailyVisitorHash(
  secret: string,
  ip: string | undefined,
  userAgent: string | undefined,
  day: Date = new Date(),
): string | undefined {
  if (ip === undefined || userAgent === undefined || ip === "" || userAgent === "") {
    return undefined;
  }
  const message = `${dayKeyOf(day)}|${ip}|${userAgent}`;
  return createHmac("sha256", secret).update(message).digest("base64url");
}
