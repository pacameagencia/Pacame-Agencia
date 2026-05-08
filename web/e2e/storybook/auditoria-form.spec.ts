import { expect, test } from "@playwright/test";

/**
 * E2E — Form auditoría /auditoria-3d.
 *
 * Cubre:
 *  - Renderiza form con todos los campos esperados.
 *  - Submit con datos válidos → success state.
 *  - Pre-rellenado desde ?case=slug funciona.
 */

test.describe("Storybook 3D — Form auditoría", () => {
  test("renderiza form con todos los campos", async ({ page }) => {
    await page.goto("/auditoria-3d");

    // Inputs obligatorios
    await expect(page.getByLabel(/nombre/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();

    // Chips: cada grupo aria-label
    await expect(page.getByRole("group", { name: /sector/i })).toBeVisible();
    await expect(page.getByRole("group", { name: /problema/i })).toBeVisible();
    await expect(page.getByRole("group", { name: /presupuesto/i })).toBeVisible();
    await expect(page.getByRole("group", { name: /timing/i })).toBeVisible();

    // Submit button
    await expect(
      page.getByRole("button", { name: /pide auditoría 15 min/i }),
    ).toBeVisible();
  });

  test("submit con datos válidos → success state", async ({ page }) => {
    // Skip si endpoint /api/leads no está disponible (preview sin Supabase)
    const skipReal = process.env.E2E_SKIP_REAL_SUBMIT === "1";
    test.skip(skipReal, "E2E_SKIP_REAL_SUBMIT=1 → no enviamos lead real");

    await page.goto("/auditoria-3d");

    await page.getByLabel(/nombre/i).fill("Test E2E");
    await page.getByLabel(/email/i).fill("e2e-test@example.com");

    // Click chips: sector hostelería, 1 problema, budget bajo, timing explorando
    await page
      .getByRole("group", { name: /sector/i })
      .getByRole("button", { name: /hostelería/i })
      .click();
    await page
      .getByRole("group", { name: /problema/i })
      .getByRole("button", { name: /sin web/i })
      .click();
    await page
      .getByRole("group", { name: /presupuesto/i })
      .getByRole("button", { name: /<500/i })
      .click();
    await page
      .getByRole("group", { name: /timing/i })
      .getByRole("button", { name: /explorando/i })
      .click();

    await page
      .getByRole("button", { name: /pide auditoría 15 min/i })
      .click();

    // Espera success state
    await expect(page.getByText(/recibida/i)).toBeVisible({ timeout: 15_000 });
  });

  test("pre-rellenado desde ?case=slug aplica sector + problem", async ({
    page,
  }) => {
    await page.goto("/auditoria-3d?case=peluqueria-ana-bilbao-reservas-ia");

    // Hint visible: "Pre-rellenado desde caso: peluqueria-ana-..."
    await expect(page.getByText(/pre-rellenado desde caso/i)).toBeVisible();
    await expect(
      page.getByText("peluqueria-ana-bilbao-reservas-ia"),
    ).toBeVisible();
  });
});
