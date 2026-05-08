import { devices, expect, test } from "@playwright/test";

/**
 * E2E — Mobile flow (375×812, iPhone 13 viewport).
 */

test.use({ ...devices["iPhone 13"] });

test.describe("Storybook 3D — Mobile flow", () => {
  test("home carga y CTA visible en 375px", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // CTA Pide tu auditoría debe ser visible (centrada bottom en mobile)
    const cta = page.getByRole("link", { name: /pide tu auditoría/i }).first();
    await expect(cta).toBeVisible({ timeout: 10_000 });
  });

  test("auditoria-3d form usable en mobile", async ({ page }) => {
    await page.goto("/auditoria-3d");

    // Inputs accesibles en viewport mobile
    const nombreInput = page.getByLabel(/nombre/i);
    await expect(nombreInput).toBeVisible();
    await nombreInput.fill("Mobile Test");
    await expect(nombreInput).toHaveValue("Mobile Test");

    // Submit visible
    const submit = page.getByRole("button", { name: /pide auditoría/i });
    await expect(submit).toBeVisible();
  });
});
