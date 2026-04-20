import { test, expect } from "@playwright/test";

/**
 * Smoke de endpoints publicos criticos: health, home, status.
 * No requieren setup en DB — safe para correr en cualquier preview.
 */

test.describe("health: endpoints publicos", () => {
  test("endpoint /api/health responde", async ({ request }) => {
    const res = await request.get("/api/health");
    // 200 si todo OK, 503 si algun check critico falla (aceptable en preview).
    expect([200, 503]).toContain(res.status());
    const body = (await res.json()) as {
      checks?: { supabase?: unknown };
      version?: unknown;
    };
    expect(body.checks).toBeDefined();
    expect(body.checks?.supabase).toBeDefined();
    expect(body).toHaveProperty("version");
  });

  test("home carga sin errores", async ({ page }) => {
    const resp = await page.goto("/");
    expect(resp).not.toBeNull();
    expect(resp!.status()).toBeLessThan(500);
    // PACAME debe aparecer en algun heading principal.
    const pacameHeading = page.locator("h1, h2").filter({ hasText: /PACAME/i }).first();
    await expect(pacameHeading).toBeVisible({ timeout: 10_000 });
  });

  test("status page renderiza", async ({ page }) => {
    const resp = await page.goto("/status");
    expect(resp?.status()).toBe(200);
    await expect(page.getByText(/sistema|status/i).first()).toBeVisible();
  });
});
