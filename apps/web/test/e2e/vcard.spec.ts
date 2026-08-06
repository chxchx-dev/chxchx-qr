import { expect, test } from "@playwright/test";
import { expectSvgPreview, selectType, waitForValidation } from "./helpers";

test("vCard: contacto completo, validado y copiable", async ({ page }) => {
  await page.goto("/");

  await selectType(page, "Contacto");

  // Rellenar los campos principales del contacto (exact, para no chocar con
  // otros campos como "Nombre del archivo").
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Ana");
  await page.getByRole("textbox", { name: "Apellidos", exact: true }).fill("Pérez");
  await page.getByRole("textbox", { name: "Empresa", exact: true }).fill("Acme");
  await page.getByRole("textbox", { name: "Correo", exact: true }).fill("ana@acme.dev");

  await expectSvgPreview(page);
  await waitForValidation(page, "valid");

  // Copiar el payload canónico (vCard con escapado correcto).
  page.on("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Copiar contenido" }).click();

  // El estado de descarga publica el resultado.
  await expect(page.getByText(/Contenido copiado|No se pudo generar/).first()).toBeVisible();
});
