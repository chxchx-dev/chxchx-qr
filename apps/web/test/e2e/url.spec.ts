import { expect, test } from "@playwright/test";
import { downloadButton, expectSvgPreview, selectType, waitForValidation } from "./helpers";

test("URL: vista previa por API, validación y descarga SVG", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Generador de códigos QR/);

  await selectType(page, "URL");
  await page.getByLabel("Dirección").fill("https://ejemplo.com/ruta");

  // La API genera la vista previa SVG.
  await expectSvgPreview(page);

  // La API valida (debounce 300ms) y publica "Validado".
  await waitForValidation(page, "valid");

  // Densidad visible y sin avisos.
  await expect(page.getByText("Densidad normal")).toBeVisible();

  // La web solicita a la API y descarga cada uno de los formatos publicados.
  for (const format of ["SVG", "PNG", "GIF"] as const) {
    await page.getByRole("radio", { name: new RegExp(`^${format}`) }).click();
    const downloadPromise = page.waitForEvent("download");
    await downloadButton(page).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`qr-code.${format.toLowerCase()}`);
  }

  await expect(page.getByText("Descarga lista")).toBeVisible();
});
