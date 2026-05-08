import { expect, test } from "@playwright/test";

/**
 * E2E — Email prompt progresivo.
 *
 * Trigger: ≥3 islas visitadas O ≥60s en sitio.
 * En tests forzamos el state directamente en localStorage para no esperar 60s.
 */

test.describe("Storybook 3D — Email prompt", () => {
  test("aparece tras forzar 3+ islas visitadas en localStorage", async ({
    page,
  }) => {
    const flagActive = process.env.E2E_STORYBOOK === "1";
    test.skip(!flagActive, "Storybook flag off — skip email prompt");

    await page.goto("/");
    // Forzar state cumplido antes de hidratación de EmailPrompt
    await page.evaluate(() => {
      localStorage.setItem(
        "pacame_storybook_v1",
        JSON.stringify({
          islandsVisited: ["web", "seo", "redes"],
          secondsOnSite: 60,
          sessionStartedAt: new Date().toISOString(),
          emailPromptShownAt: null,
          emailCaptured: null,
          lastInteractionAt: new Date().toISOString(),
        }),
      );
    });
    // Recargar para que EmailPrompt vea el state
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Prompt aparece tras ~1.5s (delay de cortesía)
    const prompt = page.getByRole("dialog", { name: /captura de email/i });
    await expect(prompt).toBeVisible({ timeout: 5_000 });
  });

  test("dismiss en X cierra el prompt", async ({ page }) => {
    const flagActive = process.env.E2E_STORYBOOK === "1";
    test.skip(!flagActive, "Storybook flag off — skip email prompt dismiss");

    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "pacame_storybook_v1",
        JSON.stringify({
          islandsVisited: ["web", "seo", "redes"],
          secondsOnSite: 60,
          sessionStartedAt: new Date().toISOString(),
          emailPromptShownAt: null,
          emailCaptured: null,
          lastInteractionAt: new Date().toISOString(),
        }),
      );
    });
    await page.reload();

    const prompt = page.getByRole("dialog", { name: /captura de email/i });
    await expect(prompt).toBeVisible({ timeout: 5_000 });

    // Click en X cierra
    const closeBtn = prompt.getByRole("button", { name: /cerrar/i });
    await closeBtn.click();
    await expect(prompt).toBeHidden({ timeout: 2_000 });
  });
});
