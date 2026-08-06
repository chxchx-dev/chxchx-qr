import { expect, type Page } from "@playwright/test";

/** Selecciona el tipo de contenido en el radiogroup (role=radio). */
export async function selectType(page: Page, label: string): Promise<void> {
  await page.getByRole("radio", { name: new RegExp(`^${label}`) }).click();
}

/**
 * Espera a que la validación termine y devuelve el estado visible.
 * El aria-live publica: Validando… → Validado / Advertencia / Revisa…
 */
export async function waitForValidation(
  page: Page,
  status: "valid" | "warning" | "invalid",
  timeout = 15_000,
): Promise<void> {
  const expected =
    status === "valid"
      ? "Validado"
      : status === "warning"
        ? "Advertencia"
        : "Revisa los campos marcados";
  // El texto del estado vive en un <p> con el bullet decorativo (●): se busca
  // por substring dentro de la sección aria-live.
  await expect(
    page.locator("section[aria-live]").getByText(expected, { exact: false }).first(),
  ).toBeVisible({
    timeout,
  });
}

/** Comprueba que el SVG de la vista previa local se ha renderizado. */
export async function expectSvgPreview(page: Page): Promise<void> {
  const svg = page.locator("section[aria-labelledby='preview-title'] svg").first();
  await expect(svg).toBeVisible();
  await expect(svg).toHaveAttribute("viewBox", /0 0 \d+ \d+/);
}

/** Botón de descarga (habilitado solo cuando la validación lo permite). */
export function downloadButton(page: Page) {
  return page.getByRole("button", { name: "Descargar QR" });
}
