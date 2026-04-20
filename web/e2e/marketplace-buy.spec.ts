import { test, expect } from "@playwright/test";

/**
 * Smoke test del flujo de compra marketplace.
 *
 * Estrategia: en CI (E2E_SKIP_STRIPE=true) no navegamos hasta Stripe Checkout
 * porque Stripe test mode introduce flakiness (3DS challenges, redirects lentos,
 * iframes de CardElement). En su lugar validamos que el endpoint POST
 * /api/stripe/checkout devuelva una URL valida de checkout.stripe.com.
 */

const SKIP_STRIPE_DEFAULT_CI = process.env.CI ? "true" : "false";
const SKIP_STRIPE =
  (process.env.E2E_SKIP_STRIPE || SKIP_STRIPE_DEFAULT_CI) === "true";

test.describe("marketplace: logo-express", () => {
  test("compra un logo-express (smoke)", async ({ page, request }) => {
    await page.goto("/servicios/logo-express");

    // Producto renderiza con nombre + precio.
    await expect(page.getByText(/Logo Express/i).first()).toBeVisible();
    await expect(page.getByText(/49/).first()).toBeVisible();

    if (SKIP_STRIPE) {
      // Llamada directa al API — evita flakiness del UI de Stripe Checkout.
      const res = await request.post("/api/stripe/checkout", {
        data: { source: "public", service_slug: "logo-express" },
        headers: { "Content-Type": "application/json" },
      });
      expect(res.status()).toBe(200);
      const json = (await res.json()) as { url?: string };
      expect(json.url).toBeDefined();
      expect(json.url).toContain("checkout.stripe.com");
    } else {
      // Modo completo: click real al boton (solo en local con Stripe test keys).
      const buyButton = page.getByRole("button", { name: /comprar|buy/i }).first();
      if (await buyButton.isVisible().catch(() => false)) {
        await buyButton.click();
        // Aceptamos navegacion a Stripe o permanencia en pagina (si abre popup).
        await page.waitForTimeout(2_000);
      }
    }

    // La pagina sigue renderizando — no hay 500.
    const response = await page.goto("/servicios/logo-express");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText(/Logo Express/i).first()).toBeVisible();
  });
});
