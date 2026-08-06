import { defineConfig, devices } from "@playwright/test";

/**
 * E2E de la web (Fase 03). Los servidores (API + web) los arranca
 * `scripts/e2e.sh`; esta config solo define proyectos y la carpeta de tests.
 */
export default defineConfig({
  testDir: "./test/e2e",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
});
