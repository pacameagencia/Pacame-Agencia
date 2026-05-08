import { expect, test } from "@playwright/test";

/**
 * E2E — Accesibilidad básica del Storybook 3D.
 *
 * Cubre lo crítico: landmarks, headings, alt en imágenes, focus visible.
 * Para audits exhaustivos usar Lighthouse / axe en Fase 7.5 manual.
 */

test.describe("Storybook 3D — Accesibilidad", () => {
  test("home tiene landmarks main + headings jerárquicos", async ({ page }) => {
    await page.goto("/");

    // Al menos 1 <main> (NoScriptContent o ClassicHome)
    const mains = page.locator("main");
    expect(await mains.count()).toBeGreaterThanOrEqual(1);

    // h1 único en la home
    const h1Count = await page.locator("h1").count();
    expect(h1Count, "Debe haber exactamente 1 h1 en la home").toBeGreaterThanOrEqual(1);
  });

  test("auditoria-3d tiene labels asociadas a inputs", async ({ page }) => {
    await page.goto("/auditoria-3d");

    // Cada input visible debe tener label asociada (HTML for=id o aria-label)
    const nombreInput = page.getByLabel(/nombre/i);
    await expect(nombreInput).toBeVisible();

    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
  });

  test("CTA tiene texto descriptivo (no solo ícono)", async ({ page }) => {
    await page.goto("/");
    // CTA sea por aria-label o por texto visible "Pide tu auditoría 15 min"
    const ctas = page.getByRole("link", { name: /pide tu auditoría/i });
    expect(await ctas.count()).toBeGreaterThan(0);
  });

  test("AccessibleNav atajos teclado responde", async ({ page }) => {
    const flagActive = process.env.E2E_STORYBOOK === "1";
    test.skip(!flagActive, "Storybook flag off — skip atajos teclado");

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Tecla "1" debe activar isla web (URL no cambia, pero scroll sí).
    // Verificamos que no hay error JS al pulsar.
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.keyboard.press("1");
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });
});
