import { expect, test } from "@playwright/test";
import { downloadButton, expectSvgPreview, selectType, waitForValidation } from "./helpers";

test("URL: preview local, validación por API y descarga SVG", async ({ page }) => {
  await page.goto("/");

  // El título y el eslogan del shell están presentes.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Genera códigos QR fiables/);

  await selectType(page, "URL");
  await page.getByLabel("Dirección").fill("https://ejemplo.com/ruta");

  // Vista previa local (mismo motor que la API) aparece al instante.
  await expectSvgPreview(page);

  // La API valida (debounce 300ms) y publica "Validado".
  await waitForValidation(page, "valid");

  // Densidad visible y sin avisos.
  await expect(page.getByText("Densidad normal")).toBeVisible();

  // Descarga SVG: captura del archivo descargado.
  const downloadPromise = page.waitForEvent("download");
  await downloadButton(page).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("qr-code.svg");

  await expect(page.getByText("Descarga lista")).toBeVisible();
});
