import { type Page, test } from "@playwright/test";
import { expectSvgPreview, selectType, waitForValidation } from "./helpers.js";

const CONTENT_TYPES: Array<{ label: string; fill: (page: Page) => Promise<void> }> = [
  {
    label: "Texto",
    fill: (page) =>
      page.getByRole("textbox", { name: "Texto", exact: true }).fill("Prueba de aceptación"),
  },
  {
    label: "URL",
    fill: (page) => page.getByLabel("Dirección").fill("https://example.com/acceptance"),
  },
  {
    label: "Correo",
    fill: (page) =>
      page.getByRole("textbox", { name: "Correo", exact: true }).fill("hola@example.com"),
  },
  {
    label: "Teléfono",
    fill: (page) => page.getByLabel("Número").fill("+573001234567"),
  },
  {
    label: "SMS",
    fill: async (page) => {
      await page.getByLabel("Número").fill("+573001234567");
      await page.getByLabel("Mensaje").fill("Cita mañana a las 10");
    },
  },
  {
    label: "WiFi",
    fill: async (page) => {
      await page.getByLabel("Nombre de la red (SSID)").fill("Chxchx-WiFi");
      await page.getByLabel("Contraseña").fill("prueba-qr-2026");
    },
  },
  {
    label: "Contacto",
    fill: async (page) => {
      await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Ana");
      await page.getByLabel("Apellidos").fill("García");
    },
  },
  {
    label: "Evento",
    fill: async (page) => {
      await page.getByLabel("Título").fill("Revisión del generador");
      await page.getByLabel("Inicio").fill("2026-08-05T15:00");
      await page.getByLabel("Fin").fill("2026-08-05T16:00");
    },
  },
  {
    label: "Ubicación",
    fill: async (page) => {
      await page.getByLabel("Latitud").fill("4.711");
      await page.getByLabel("Longitud").fill("-74.0721");
    },
  },
];

for (const contentType of CONTENT_TYPES) {
  test(`${contentType.label}: el formulario valida y la API genera la vista previa`, async ({
    page,
  }) => {
    await page.goto("/");
    await selectType(page, contentType.label);
    await contentType.fill(page);

    await waitForValidation(page, "valid");
    await expectSvgPreview(page);
  });
}
