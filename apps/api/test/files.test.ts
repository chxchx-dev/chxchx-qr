import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ApiConfig } from "@acore/config";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { FileStorage } from "../src/infrastructure/storage/file-storage.js";
import { createFileStorage } from "../src/infrastructure/storage/storage-factory.js";
import { createFilesService } from "../src/modules/files/files.service.js";
import { startTestServer, uploadFile } from "./helpers.js";

/** Directorio temporal aislado por test (evita colisiones entre suites). */
function tempDir(): string {
  return mkdtempSync(path.join(os.tmpdir(), "acore-qr-files-test-"));
}

function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/** Imagen PNG válida generada con sharp (evita fixtures corruptos). */
async function validPng(width = 8, height = 8): Promise<Uint8Array> {
  const buffer = await sharp({
    create: { width, height, channels: 3, background: { r: 20, g: 120, b: 200 } },
  })
    .png()
    .toBuffer();
  return new Uint8Array(buffer);
}

const PDF_MIN = new Uint8Array(
  Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
    "utf8",
  ),
);

describe("POST /api/v1/files", () => {
  it("sube un PNG válido y devuelve la URL con token opaco", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({ FILE_TEMP_DIR: dir });
      const res = await uploadFile(baseUrl, await validPng(), "menu.png", "image/png");
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        token: string;
        url: string;
        fileName: string;
        sizeBytes: number;
        mimeType: string;
        sha256: string;
        expiresAt: string;
      };
      expect(body.mimeType).toBe("image/png");
      expect(body.token).toMatch(/^[A-Za-z0-9_-]{20,}$/);
      expect(body.url).toMatch(/\/f\/[A-Za-z0-9_-]{20,}$/);
      expect(body.fileName.endsWith(".png")).toBe(true);
      expect(body.sizeBytes).toBeGreaterThan(0);
      expect(body.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(Number.isNaN(Date.parse(body.expiresAt))).toBe(false);
    } finally {
      cleanup(dir);
    }
  });

  it("acepta PDF, texto plano, JPEG y WebP (firma mágica, no el MIME del browser)", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({ FILE_TEMP_DIR: dir });
      const png = await validPng();
      const jpeg = await sharp(png).jpeg().toBuffer();
      const webp = await sharp(png).webp().toBuffer();

      const pdf = await uploadFile(baseUrl, PDF_MIN, "manual.pdf", "application/pdf");
      expect(pdf.status).toBe(200);
      expect(((await pdf.json()) as { mimeType: string }).mimeType).toBe("application/pdf");

      const txt = await uploadFile(
        baseUrl,
        new TextEncoder().encode("hola mundo\n"),
        "nota.txt",
        "text/plain",
      );
      expect(txt.status).toBe(200);
      expect(((await txt.json()) as { mimeType: string }).mimeType).toBe("text/plain");

      // MIME del browser mintiendo: la firma manda.
      const fake = await uploadFile(baseUrl, new Uint8Array(jpeg), "foto.jpeg", "application/pdf");
      expect(fake.status).toBe(200);
      expect(((await fake.json()) as { mimeType: string }).mimeType).toBe("image/jpeg");

      const wp = await uploadFile(baseUrl, new Uint8Array(webp), "anim.webp", "image/png");
      expect(wp.status).toBe(200);
      expect(((await wp.json()) as { mimeType: string }).mimeType).toBe("image/webp");
    } finally {
      cleanup(dir);
    }
  });

  it("rechaza tipos bloqueados aunque la extensión parezca válida (SVG, EXE)", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({ FILE_TEMP_DIR: dir });
      const svg = await uploadFile(
        baseUrl,
        new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"),
        "grafico.svg",
        "image/svg+xml",
      );
      expect(svg.status).toBe(415);
      expect(((await svg.json()) as { code: string }).code).toBe("FILE_TYPE_NOT_ALLOWED");

      const exe = await uploadFile(
        baseUrl,
        new TextEncoder().encode("MZ\x90\x00"),
        "virus.exe",
        "application/octet-stream",
      );
      expect(exe.status).toBe(415);
    } finally {
      cleanup(dir);
    }
  });

  it("rechaza una extensión bloqueada aunque el contenido sea texto válido", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({ FILE_TEMP_DIR: dir });
      const res = await uploadFile(
        baseUrl,
        new TextEncoder().encode("console.log('x')\n"),
        "script.sh",
        "text/plain",
      );
      expect(res.status).toBe(415);
    } finally {
      cleanup(dir);
    }
  });

  it("rechaza firmas inválidas (binario desconocido) con 415", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({ FILE_TEMP_DIR: dir });
      const res = await uploadFile(
        baseUrl,
        new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe, 0x00, 0x99]),
        "raro.dat",
        "application/octet-stream",
      );
      expect(res.status).toBe(415);
    } finally {
      cleanup(dir);
    }
  });

  it("rechaza archivos que superan FILE_MAX_BYTES con 413", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({
        FILE_TEMP_DIR: dir,
        FILE_MAX_BYTES: "1024",
      });
      const big = Buffer.concat([Buffer.from(await validPng()), Buffer.alloc(4096, 0x41)]);
      const res = await uploadFile(baseUrl, new Uint8Array(big), "grande.png", "image/png");
      expect(res.status).toBe(413);
      expect(((await res.json()) as { code: string }).code).toBe("FILE_TOO_LARGE");
    } finally {
      cleanup(dir);
    }
  });

  it("responde 400 cuando no llega archivo y 403 si la subida está deshabilitada", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({ FILE_TEMP_DIR: dir });
      const form = new FormData();
      const noFile = await fetch(`${baseUrl}/api/v1/files`, { method: "POST", body: form });
      expect(noFile.status).toBe(400);
      expect(((await noFile.json()) as { code: string }).code).toBe("FILE_INVALID");

      const { baseUrl: disabledUrl } = await startTestServer({
        FILE_TEMP_DIR: dir,
        FILE_UPLOAD_ENABLED: "false",
      });
      const off = await uploadFile(disabledUrl, await validPng(), "a.png", "image/png");
      expect(off.status).toBe(403);
      expect(((await off.json()) as { code: string }).code).toBe("FILE_UPLOAD_DISABLED");
    } finally {
      cleanup(dir);
    }
  });
});

describe("GET /f/:token", () => {
  it("sirve el archivo con headers de seguridad estrictos", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({ FILE_TEMP_DIR: dir });
      const upload = await uploadFile(baseUrl, PDF_MIN, "manual de uso.pdf", "application/pdf");
      const body = (await upload.json()) as { token: string };
      const res = await fetch(`${baseUrl}/f/${body.token}`);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/pdf");
      const disposition = res.headers.get("Content-Disposition") ?? "";
      expect(disposition.startsWith("attachment")).toBe(true);
      expect(disposition).toContain("filename*=UTF-8''");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Content-Security-Policy")).toBe("sandbox");
      expect(res.headers.get("Cache-Control")).toContain("private");
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(bytes.length).toBeGreaterThan(0);
    } finally {
      cleanup(dir);
    }
  });

  it("devuelve 404 para un token inexistente", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({ FILE_TEMP_DIR: dir });
      const res = await fetch(`${baseUrl}/f/token-que-no-existe-1234567890`);
      expect(res.status).toBe(404);
      expect(((await res.json()) as { code: string }).code).toBe("FILE_NOT_FOUND");
    } finally {
      cleanup(dir);
    }
  });

  it("devuelve 410 y elimina el archivo cuando expiró (TTL=0)", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({
        FILE_TEMP_DIR: dir,
        FILE_ANONYMOUS_TTL_HOURS: "0",
      });
      const upload = await uploadFile(baseUrl, await validPng(), "a.png", "image/png");
      const body = (await upload.json()) as { token: string };
      const res = await fetch(`${baseUrl}/f/${body.token}`);
      expect(res.status).toBe(410);
      expect(((await res.json()) as { code: string }).code).toBe("FILE_EXPIRED");
      // El archivo ya no existe tras la expiración.
      const again = await fetch(`${baseUrl}/f/${body.token}`);
      expect(again.status).toBe(404);
    } finally {
      cleanup(dir);
    }
  });
});

describe("cleanup y storage", () => {
  it("el cleanup elimina expirados, huérfanos y temporales viejos", async () => {
    const dir = tempDir();
    const storageDir = path.join(dir, "storage");
    const uploadsDir = path.join(dir, "uploads");
    mkdirSync(storageDir, { recursive: true });
    mkdirSync(uploadsDir, { recursive: true });
    try {
      const { baseUrl } = await startTestServer({ FILE_TEMP_DIR: dir });
      const upload = await uploadFile(baseUrl, await validPng(), "a.png", "image/png");
      const body = (await upload.json()) as { token: string };
      expect(readFileSync(path.join(storageDir, `${body.token}.bin`)).length).toBeGreaterThan(0);

      // Temporal viejo: se crea con fecha antigua.
      const staleTemp = path.join(uploadsDir, "stale-temp-file");
      writeFileSync(staleTemp, "x");
      const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const { utimesSync } = await import("node:fs");
      utimesSync(staleTemp, old, old);

      // Expiración inmediata para el archivo subido: se fuerza la metadata.
      const metaPath = path.join(storageDir, `${body.token}.json`);
      const meta = JSON.parse(readFileSync(metaPath, "utf8")) as { expiresAt: string };
      meta.expiresAt = new Date(Date.now() - 1000).toISOString();
      writeFileSync(metaPath, JSON.stringify(meta));

      const { runFileCleanup } = await import("../src/modules/files/file-cleanup.js");
      const { LocalFileStorage } = await import(
        "../src/infrastructure/storage/local-file-storage.js"
      );
      const storage = new LocalFileStorage(storageDir);
      const removed = await runFileCleanup({ storage, uploadsDir, tempMaxAgeMs: 60 * 60 * 1000 });

      expect(removed).toBeGreaterThanOrEqual(2);
      expect(() => readFileSync(path.join(storageDir, `${body.token}.bin`))).toThrow();
      expect(() => readFileSync(staleTemp)).toThrow();
    } finally {
      cleanup(dir);
    }
  });

  it("el factory falla temprano con FILE_STORAGE_DRIVER=s3 (requiere ADR)", () => {
    expect(() => createFileStorage({ FILE_STORAGE_DRIVER: "s3", FILE_TEMP_DIR: "/tmp/x" })).toThrow(
      /s3 no está implementado/,
    );
  });

  it("el service lanza FILE_STORAGE_UNAVAILABLE si el storage.save falla (unit)", async () => {
    const dir = tempDir();
    try {
      const png = await validPng();
      const file = {
        path: "",
        originalname: "a.png",
        mimetype: "image/png",
        size: png.length,
      } as Express.Multer.File;
      writeFileSync(path.join(dir, "a.png"), png);
      file.path = path.join(dir, "a.png");

      const broken: FileStorage = {
        save: async () => {
          throw new Error("storage roto");
        },
        read: async () => null,
        delete: async () => {},
        listTokens: async () => [],
      };
      const config = {
        FILE_UPLOAD_ENABLED: true,
        FILE_MAX_BYTES: 10 * 1024 * 1024,
        FILE_ALLOWED_TYPES: "image/png,image/jpeg,image/webp,application/pdf,text/plain",
        FILE_ANONYMOUS_TTL_HOURS: 168,
        FILE_PUBLIC_BASE_URL: "http://localhost:4000",
      } as unknown as ApiConfig;
      const service = createFilesService(config, broken);
      await expect(service.storeUpload(file)).rejects.toThrow("No se pudo almacenar");
    } finally {
      cleanup(dir);
    }
  });
});

describe("rate limit y concurrencia", () => {
  it("limita la subida a FILE_RATE_LIMIT_UPLOAD_PER_HOUR (429 FILE_RATE_LIMITED)", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({
        FILE_TEMP_DIR: dir,
        FILE_RATE_LIMIT_UPLOAD_PER_HOUR: "2",
      });
      const first = await uploadFile(baseUrl, await validPng(), "a.png", "image/png");
      expect(first.status).toBe(200);
      const second = await uploadFile(baseUrl, await validPng(), "b.png", "image/png");
      expect(second.status).toBe(200);
      const third = await uploadFile(baseUrl, await validPng(), "c.png", "image/png");
      expect(third.status).toBe(429);
      expect(((await third.json()) as { code: string }).code).toBe("FILE_RATE_LIMITED");
    } finally {
      cleanup(dir);
    }
  });

  it("dos subidas generan tokens distintos (URLs independientes)", async () => {
    const dir = tempDir();
    try {
      const { baseUrl } = await startTestServer({ FILE_TEMP_DIR: dir });
      const a = (await (await uploadFile(baseUrl, PDF_MIN, "a.pdf", "application/pdf")).json()) as {
        token: string;
      };
      const b = (await (await uploadFile(baseUrl, PDF_MIN, "b.pdf", "application/pdf")).json()) as {
        token: string;
      };
      expect(a.token).not.toBe(b.token);
    } finally {
      cleanup(dir);
    }
  });
});
