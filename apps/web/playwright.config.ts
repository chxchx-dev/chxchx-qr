import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const repoRoot = resolve(import.meta.dirname, "../..");
const webUrl = "http://127.0.0.1:5173";

/**
 * Playwright levanta API y web por su cuenta. Esto mantiene el comando E2E
 * igual en Windows, macOS, Linux y CI, sin depender de Bash ni curl.
 */
export default defineConfig({
  testDir: "./test/e2e",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: webUrl,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev:api",
      cwd: repoRoot,
      url: "http://127.0.0.1:4000/health/live",
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: "test",
        PORT: "4000",
        WEB_ORIGIN: webUrl,
      },
    },
    {
      command: "npm run dev:web",
      cwd: repoRoot,
      url: webUrl,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_BASE_URL: "/api/v1",
      },
    },
  ],
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
