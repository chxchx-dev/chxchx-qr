import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { downloadButton, expectSvgPreview, selectType, waitForValidation } from "./helpers";

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "logo.png");

/** Firma PNG + dimensiones desde el buffer descargado. */
function pngHeader(bytes: Uint8Array): { ok: boolean; width: number; height: number } {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const ok = sig.every((byte, index) => bytes[index] === byte);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { ok, width: view.getUint32(16), height: view.getUint32(20) };
}

test("logo: subida, preview con logo, ECC alto automático y descarga PNG verificada", async ({
  page,
}) => {
  await page.goto("/");

  await selectType(page, "URL");
  await page.getByLabel("Dirección").fill("https://ejemplo.com/ruta");
  await expectSvgPreview(page);
  await waitForValidation(page, "valid");

  // Subir el logo de prueba.
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("Logo listo")).toBeVisible({ timeout: 20_000 });

  // El preview ahora incluye el logo (elemento <image> dentro del SVG local).
  const svg = page.locator("section[aria-labelledby='preview-title'] svg").first();
  await expect(svg.locator("image")).toBeVisible();

  // ECC sube automáticamente a máximo y el badge de escaneabilidad lo confirma.
  await expect(page.getByLabel("Corrección de errores")).toHaveValue("high");
  await expect(page.getByText(/Verificado con logo/)).toBeVisible();

  // Con logo, el formato GIF queda deshabilitado (no lo admite).
  const gifRadio = page.getByRole("radio", { name: /^GIF/ });
  await expect(gifRadio).toBeDisabled();

  // Descargar en PNG: se captura el archivo y se verifican firma y dimensiones.
  await page.getByRole("radio", { name: /^PNG/ }).click();
  const downloadPromise = page.waitForEvent("download");
  await downloadButton(page).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("qr-code.png");

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const header = pngHeader(new Uint8Array(Buffer.concat(chunks)));
  expect(header.ok).toBe(true);
  // Tamaño por defecto del generador: 1024×1024.
  expect(header.width).toBe(1024);
  expect(header.height).toBe(1024);

  await expect(page.getByText("Descarga lista")).toBeVisible();
});

test("logo: se puede quitar y el GIF vuelve a estar disponible", async ({ page }) => {
  await page.goto("/");

  await selectType(page, "URL");
  await page.getByLabel("Dirección").fill("https://ejemplo.com");
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("Logo listo")).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Quitar logo" }).click();
  await expect(page.getByRole("radio", { name: /^GIF/ })).toBeEnabled();
  await expect(page.locator("section[aria-labelledby='preview-title'] svg image")).toHaveCount(0);
});
