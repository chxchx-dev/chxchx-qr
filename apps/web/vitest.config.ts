import { defineConfig } from "vitest/config";

/** Unit tests: solo src/test, nunca los specs de Playwright (test/e2e). */
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    exclude: ["test/e2e/**", "node_modules/**", "dist/**"],
  },
});
