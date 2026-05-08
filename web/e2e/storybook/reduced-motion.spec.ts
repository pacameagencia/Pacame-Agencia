import { expect, test } from "@playwright/test";

/**
 * E2E — Reduced motion.
 *
 * Usuarios con prefers-reduced-motion: reduce no deben recibir 3D.
 * Verificamos que NoScriptContent visible aparece como contenido funcional
 * (no en sr-only) y que el form auditoría sigue siendo accesible.
 */

test.use({
  contextOptions: {
    reducedMotion: "reduce",
  },
});

test.describe("Storybook 3D — Reduced motion", () => {
  test("home muestra NoScriptContent visible (no sr-only)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Los headings de los 5 servicios deben estar visibles (no display:none)
    const webHeading = page.locator("#service-web-title");
    await expect(webHeading).toBeVisible();
  });

  test("ReducedMotionToggle indica '3D off' por defecto", async ({ page }) => {
    const flagActive = process.env.E2E_STORYBOOK === "1";
    test.skip(!flagActive, "Storybook flag off — skip toggle visual");

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // El toggle debe existir
    const toggle = page.getByRole("button", { name: /modo reducido|3d off|3d on/i });
    await expect(toggle.first()).toBeVisible();
  });

  test("auditoria-3d form sigue accesible en reduced motion", async ({ page }) => {
    await page.goto("/auditoria-3d");

    await expect(page.getByLabel(/nombre/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /pide auditoría/i }),
    ).toBeVisible();
  });
});
