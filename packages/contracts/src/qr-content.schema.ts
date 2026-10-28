/**
 * Esquemas de contenido QR (unión discriminada por `type`).
 *
 * Normalización: cada string se normaliza a Unicode NFC y se recorta antes de
 * validar (transformaciones transparentes). El payload canónico se construye
 * en `@chxchx/qr-core` a partir de estos DTO ya validados.
 */
import { z } from "zod";

/** Límites de producto por tipo (fuente: CONTENT-MATRIX y 04-DOMAIN-CONTENT-TYPES). */
export const QR_CONTENT_LIMITS = {
  textMaxLength: 500,
  urlMaxLength: 2000,
  emailMaxLength: 254,
  emailSubjectMaxLength: 500,
  emailBodyMaxLength: 1000,
  phoneMaxLength: 32,
  smsBodyMaxLength: 500,
  wifiSsidMaxLength: 64,
  wifiPasswordMaxLength: 64,
  vcardFieldMaxLength: 200,
  vcardAddressMaxLength: 300,
  vcardNoteMaxLength: 500,
  calendarSummaryMaxLength: 200,
  calendarDescriptionMaxLength: 500,
  geoLabelMaxLength: 200,
} as const;

/** String obligatorio: NFC, recorte, 1..max (mensajes en español). */
const text = (max: number) =>
  z
    .string()
    .transform((value) => value.normalize("NFC"))
    .pipe(
      z.string().trim().min(1, "Este campo es obligatorio").max(max, `Máximo ${max} caracteres`),
    );

/** String opcional (vacío permitido): NFC, recorte, 0..max. */
const textOpt = (max: number) =>
  z
    .string()
    .transform((value) => value.normalize("NFC"))
    .pipe(z.string().trim().max(max, `Máximo ${max} caracteres`));

const phoneString = text(QR_CONTENT_LIMITS.phoneMaxLength).refine(
  (value) => /^\+?[0-9\s\-()]+$/.test(value),
  { message: "Solo se admiten dígitos, espacios, guiones, paréntesis y un + inicial" },
);

/** Fecha ISO 8601 en UTC con sufijo Z, verificada como fecha real. */
const utcDateTime = (label: string) =>
  z
    .string()
    .refine(
      (value) =>
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) && !Number.isNaN(Date.parse(value)),
      { message: `${label} debe ser una fecha ISO 8601 UTC (p. ej. 2026-08-05T15:00:00Z)` },
    );

const textContentSchema = z.object({
  type: z.literal("text"),
  text: text(QR_CONTENT_LIMITS.textMaxLength),
});

/** URL segura: solo http/https, sin credenciales y con dominio válido. */
const safeUrl = (max: number) =>
  text(max).superRefine((value, ctx) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "La URL no es válida" });
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      ctx.addIssue({ code: "custom", message: "Solo se admiten los esquemas http: y https:" });
    }
    if (parsed.username !== "" || parsed.password !== "") {
      ctx.addIssue({
        code: "custom",
        message: "No se admiten credenciales embebidas en la URL",
      });
    }
    if (parsed.hostname === "") {
      ctx.addIssue({ code: "custom", message: "La URL no tiene un dominio válido" });
    }
  });

/** Esquema de URL segura compartido por URL y vCard. */
export const SAFE_URL_SCHEMA = safeUrl(QR_CONTENT_LIMITS.urlMaxLength);

const urlContentSchema = z.object({
  type: z.literal("url"),
  url: SAFE_URL_SCHEMA,
});

const emailContentSchema = z.object({
  type: z.literal("email"),
  email: text(QR_CONTENT_LIMITS.emailMaxLength).pipe(
    z.email("Escribe un correo válido, por ejemplo nombre@dominio.com"),
  ),
  subject: textOpt(QR_CONTENT_LIMITS.emailSubjectMaxLength).optional(),
  body: textOpt(QR_CONTENT_LIMITS.emailBodyMaxLength).optional(),
});

const phoneContentSchema = z.object({
  type: z.literal("phone"),
  phone: phoneString,
});

const smsContentSchema = z.object({
  type: z.literal("sms"),
  phone: phoneString,
  body: textOpt(QR_CONTENT_LIMITS.smsBodyMaxLength).optional(),
});

/**
 * WiFi. Nota de contrato: el tipo de red se llama `networkType` para no colisionar
 * con el discriminante `type` de la unión (ver PHASE-02-PLAN y QR-ENDPOINTS).
 */
const wifiContentSchema = z
  .object({
    type: z.literal("wifi"),
    ssid: text(QR_CONTENT_LIMITS.wifiSsidMaxLength),
    password: textOpt(QR_CONTENT_LIMITS.wifiPasswordMaxLength).optional(),
    networkType: z.enum(["WPA", "WEP", "nopass"]),
    hidden: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    const hasPassword = value.password !== undefined && value.password !== "";
    if (value.networkType === "nopass" && hasPassword) {
      ctx.addIssue({
        path: ["password"],
        code: "custom",
        message: "Una red sin contraseña (nopass) no admite password",
      });
    }
    if (value.networkType !== "nopass" && !hasPassword) {
      ctx.addIssue({
        path: ["password"],
        code: "custom",
        message: "Se requiere password para redes WPA/WEP",
      });
    }
  });

const vcardContentSchema = z.object({
  type: z.literal("vcard"),
  name: text(QR_CONTENT_LIMITS.vcardFieldMaxLength),
  lastname: textOpt(QR_CONTENT_LIMITS.vcardFieldMaxLength).optional(),
  org: textOpt(QR_CONTENT_LIMITS.vcardFieldMaxLength).optional(),
  title: textOpt(QR_CONTENT_LIMITS.vcardFieldMaxLength).optional(),
  phone: phoneString.optional(),
  email: text(QR_CONTENT_LIMITS.emailMaxLength)
    .pipe(z.email("Escribe un correo válido, por ejemplo nombre@dominio.com"))
    .optional(),
  url: SAFE_URL_SCHEMA.optional(),
  address: textOpt(QR_CONTENT_LIMITS.vcardAddressMaxLength).optional(),
  note: textOpt(QR_CONTENT_LIMITS.vcardNoteMaxLength).optional(),
});

const calendarContentSchema = z
  .object({
    type: z.literal("calendar"),
    summary: text(QR_CONTENT_LIMITS.calendarSummaryMaxLength),
    start: utcDateTime("start"),
    end: utcDateTime("end").optional(),
    location: textOpt(QR_CONTENT_LIMITS.calendarSummaryMaxLength).optional(),
    description: textOpt(QR_CONTENT_LIMITS.calendarDescriptionMaxLength).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.end !== undefined && value.end <= value.start) {
      ctx.addIssue({ path: ["end"], code: "custom", message: "end debe ser posterior a start" });
    }
  });

const geoSchema = z.object({
  type: z.literal("geo"),
  lat: z
    .number("Escribe un número válido")
    .min(-90, "Debe ser mayor o igual a -90")
    .max(90, "Debe ser menor o igual a 90"),
  lng: z
    .number("Escribe un número válido")
    .min(-180, "Debe ser mayor o igual a -180")
    .max(180, "Debe ser menor o igual a 180"),
  label: textOpt(QR_CONTENT_LIMITS.geoLabelMaxLength).optional(),
});

/** Unión discriminada por `type`: la entrada de contenido validada. */
export const qrContentSchema = z.discriminatedUnion("type", [
  textContentSchema,
  urlContentSchema,
  emailContentSchema,
  phoneContentSchema,
  smsContentSchema,
  wifiContentSchema,
  vcardContentSchema,
  calendarContentSchema,
  geoSchema,
]);

export type QrContent = z.infer<typeof qrContentSchema>;

export const urlSchemeCheck = {
  allowed: ["http:", "https:"],
  blocked: ["javascript:", "data:", "file:", "vbscript:", "ftp:"],
} as const;
