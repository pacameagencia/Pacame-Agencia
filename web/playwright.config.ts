import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — E2E smoke suite de PACAME.
 *
 * baseURL:
 *   - Vercel preview ambientes: PREVIEW_URL=https://pr-xxx.vercel.app
 *   - Local: http://localhost:3000 (requiere `npm run dev` ya corriendo salvo fuera de CI)
 *
 * Strategy:
 *   - 1 worker en CI para evitar races contra Supabase compartida.
 *   - 4 workers en local (tests son independientes via service-role cleanup).
 *   - Reporter HTML en CI (artifact upload), list en local (ruido minimo).
 *   - Traces/videos/screenshots solo si falla para no inflar storage.
 */

const PREVIEW_URL = process.env.PREVIEW_URL;
const baseURL = PREVIEW_URL || "http://localhost:3000";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : 4,
  reporter: isCI ? [["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Firefox/WebKit opt-in via --project=firefox / --project=webkit
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: /.*/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: /.*/,
    },
  ],
  // En local (sin CI y sin PREVIEW_URL) arrancamos el dev server automaticamente.
  // En CI y contra preview, asumimos servidor externo.
  webServer:
    !isCI && !PREVIEW_URL
      ? {
          command: "npm run dev",
          url: "http://localhost:3000",
          timeout: 90_000,
          reuseExistingServer: true,
          stdout: "pipe",
          stderr: "pipe",
        }
      : undefined,
});
