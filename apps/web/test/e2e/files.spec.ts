/**
 * E2E Archivo (Fase 05): subir un archivo permitido genera una URL pública
 * (ADR-003), el QR contiene esa URL (nunca el binario) y se puede descargar.
 * Requiere VITE_FILE_UPLOAD_ENABLED=true (lo fija scripts/e2e.sh).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { downloadButton, expectSvgPreview, selectType, waitForValidation } from "./helpers";

const FIXTURE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const SAMPLE_PDF = path.join(FIXTURE_DIR, "sample.pdf");

test("Archivo: subida → URL pública → preview → descarga del QR", async ({ page }) => {
  await page.goto("/");
  await selectType(page, "Archivo");

  // Subida del PDF (input oculto identificado por su aria-label).
  await page.getByLabel("Elegir archivo para el QR").setInputFiles(SAMPLE_PDF);

  // El resultado muestra la URL /f/{token} y la advertencia de enlace.
  await expect(page.getByText(/\/f\/[A-Za-z0-9_-]{20,}/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/contiene un enlace al archivo/)).toBeVisible();

  // Preview local del QR de la URL.
  await expectSvgPreview(page);

  // La API valida la URL y, al ser http:// (dev), avisa con la recomendación
  // de usar https (estado "Advertencia"); la densidad sigue siendo normal.
  await waitForValidation(page, "warning");
  await expect(page.getByText("Densidad normal")).toBeVisible();

  // Descarga SVG del QR (contiene la URL del archivo, no el binario).
  const downloadPromise = page.waitForEvent("download");
  await downloadButton(page).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("qr-code.svg");

  await expect(page.getByText("Descarga lista")).toBeVisible();
});

test("Archivo: quitar el archivo limpia el resultado y la validación", async ({ page }) => {
  await page.goto("/");
  await selectType(page, "Archivo");

  await page.getByLabel("Elegir archivo para el QR").setInputFiles(SAMPLE_PDF);
  await expect(page.getByText(/\/f\/[A-Za-z0-9_-]{20,}/)).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Quitar" }).click();
  await expect(page.getByText(/\/f\/[A-Za-z0-9_-]{20,}/)).not.toBeVisible();
  // El input oculto tiene su propio aria-label; el botón visible es único.
  await expect(page.getByRole("button", { name: "Elegir archivo", exact: true })).toBeVisible();
});

test("Archivo: rechaza en cliente un tipo bloqueado (SVG)", async ({ page }) => {
  await page.goto("/");
  await selectType(page, "Archivo");

  await page.getByLabel("Elegir archivo para el QR").setInputFiles({
    name: "grafico.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"),
  });

  await expect(page.getByText(/Tipo de archivo no permitido/)).toBeVisible();
});
