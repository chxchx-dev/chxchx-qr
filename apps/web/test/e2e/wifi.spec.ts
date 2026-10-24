import { expect, test } from "@playwright/test";
import { expectSvgPreview, selectType, waitForValidation } from "./helpers";

test("WiFi: la contraseña no persiste al cambiar de red abierta ni al cambiar de tipo", async ({
  page,
}) => {
  await page.goto("/");

  await selectType(page, "WiFi");
  await page.getByLabel("Nombre de la red (SSID)").fill("MiRed");
  await page.getByLabel("Contraseña").fill("secreto123");

  // Red abierta → el campo de contraseña desaparece (nunca se envía).
  await page.getByLabel("Seguridad").selectOption("nopass");
  await expect(page.getByLabel("Contraseña")).toBeHidden();

  // Con red abierta y SSID es suficiente: válido.
  await expectSvgPreview(page);
  await waitForValidation(page, "valid");

  // Cambiar a WPA y volver a escribir la contraseña para comprobar memoria.
  await page.getByLabel("Seguridad").selectOption("WPA");
  await page.getByLabel("Contraseña").fill("secreto456");
  await expect(page.getByLabel("Contraseña")).toHaveValue("secreto456");

  // Cambiar de tipo y volver: los drafts viven solo en memoria de sesión.
  await selectType(page, "Texto");
  await selectType(page, "WiFi");
  await expect(page.getByLabel("Nombre de la red (SSID)")).toHaveValue("MiRed");
  await expect(page.getByLabel("Contraseña")).toHaveValue("secreto456");

  // La contraseña se procesa solo para generar el QR.
  await expect(page.getByText(/se procesa solo para generar el QR/)).toBeVisible();
});
