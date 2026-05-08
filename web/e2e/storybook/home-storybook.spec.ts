import { expect, test } from "@playwright/test";

/**
 * E2E — Home Storybook 3D (`/`).
 *
 * Estos tests asumen que la home muestra el Storybook (flag activo en preview).
 * Si flag está OFF, los tests skip (NoScriptContent + ClassicHome ya están
 * cubiertos por el smoke test general).
 *
 * Foco: que los componentes críticos del HUD aparezcan, que no haya errores
 * JS en consola, que el SSR shell esté presente para crawlers.
 */

test.describe("Storybook 3D — Home", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    // Expose para asserts post-test
    (page as unknown as { __jsErrors: string[] }).__jsErrors = errors;
  });

  test("la home carga sin errores JS críticos", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const errors = (page as unknown as { __jsErrors: string[] }).__jsErrors;
    // Filtrar errores conocidos no críticos (CSP eval, hydration warnings)
    const critical = errors.filter(
      (e) =>
        !e.includes("hydration") &&
        !e.includes("Hydration") &&
        !e.includes("CSP") &&
        !e.includes("favicon"),
    );
    expect(critical, `Errores JS críticos:\n${critical.join("\n")}`).toHaveLength(0);
  });

  test("NoScriptContent SSR está presente con los 5 servicios", async ({
    page,
  }) => {
    await page.goto("/");

    // Los 5 servicios tienen <h2> con id semántico
    const serviceHeadings = ["web", "seo", "redes", "ads", "branding"];
    for (const id of serviceHeadings) {
      const heading = page.locator(`#service-${id}-title`);
      await expect(heading).toHaveCount(1);
    }
  });

  test("CTA persistente Pide tu auditoría es visible y navega", async ({
    page,
  }) => {
    // Solo si el flag Storybook está activo
    const flagActive = process.env.E2E_STORYBOOK === "1";
    test.skip(!flagActive, "Storybook flag off — skip CTA visual test");

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const cta = page.getByRole("link", { name: /pide tu auditoría 15 min/i });
    await expect(cta.first()).toBeVisible({ timeout: 10_000 });

    await cta.first().click();
    await expect(page).toHaveURL(/\/auditoria-3d/);
  });
});
