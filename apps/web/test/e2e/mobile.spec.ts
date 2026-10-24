import { expect, test } from "@playwright/test";
import { selectType } from "./helpers";

test("móvil: el generador se apila en una columna y el selector es accesible", async ({ page }) => {
  await page.goto("/");

  // Shell visible en viewport móvil.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Generador de códigos QR/);

  // El selector de tipo existe y es navegable con teclado (flecha derecha).
  // Se acota al radiogroup de tipos (el selector de formato también usa radios).
  const typeGroup = page.getByRole("radiogroup", { name: "Tipo de contenido" });
  const radios = typeGroup.getByRole("radio");
  await expect(radios).toHaveCount(9);
  await typeGroup.getByRole("radio", { name: /^Texto/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(typeGroup.getByRole("radio", { name: /^URL/ })).toBeFocused();

  // Con contenido válido se ve el preview y el estado de validación.
  await selectType(page, "URL");
  await page.getByLabel("Dirección").fill("https://ejemplo.com");
  const svg = page.locator("section[aria-labelledby='preview-title'] svg").first();
  await expect(svg).toBeVisible();

  // En móvil la preview aparece bajo el formulario (layout apilado en columna).
  const form = page.locator("section[aria-labelledby='content-form-title']");
  const preview = page.locator("section[aria-labelledby='preview-title']");
  await expect(form).toBeVisible();
  await expect(preview).toBeVisible();

  // El apilado solo aplica bajo el breakpoint lg (1024px); en escritorio la
  // preview vive en la columna lateral y no debe compararse por coordenadas.
  const viewport = page.viewportSize();
  if ((viewport?.width ?? 0) < 1024) {
    const formBox = await form.boundingBox();
    const previewBox = await preview.boundingBox();
    expect(formBox?.y).toBeGreaterThan(0);
    expect(previewBox?.y).toBeGreaterThan(formBox?.y ?? 0);
  }
});
