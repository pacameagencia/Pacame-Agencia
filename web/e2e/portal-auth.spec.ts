import { test, expect } from "@playwright/test";
import {
  createTestClient,
  deleteTestClient,
  insertFakeOrder,
} from "./helpers/supabase";

/**
 * Smoke del portal autenticado.
 * Bypasses el login flow (email+code) inyectando auth_token en la DB
 * y la cookie pacame_client_auth directamente en el browser.
 */

test.describe("portal: acceso autenticado", () => {
  test("cliente puede ver sus orders tras login", async ({ page, context, baseURL }) => {
    const client = await createTestClient({ name: "E2E Auth Client" });
    const fakeOrder = await insertFakeOrder({
      clientId: client.id,
      serviceSlug: "logo-express",
    });

    try {
      // Cookie de sesion — match con el flujo real en lib/client-auth.ts.
      const url = new URL(baseURL || "http://localhost:3000");
      await context.addCookies([
        {
          name: "pacame_client_auth",
          value: client.authToken,
          domain: url.hostname,
          path: "/",
          httpOnly: false, // el middleware solo lee el value, no flags
          secure: url.protocol === "https:",
          sameSite: "Lax",
        },
      ]);

      // Dashboard: si redirige a /portal (login) el auth fallo.
      const dashResp = await page.goto("/portal/dashboard");
      expect(dashResp?.status()).toBeLessThan(500);
      expect(page.url()).toContain("/portal/dashboard");
      expect(page.url()).not.toMatch(/\/portal\/?$/);

      // Orders: debe listar la fake order creada.
      await page.goto("/portal/orders");
      const orderLocator = page.getByText(
        new RegExp(`${fakeOrder.order_number}|logo-express`, "i")
      ).first();
      await expect(orderLocator).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteTestClient(client.id);
    }
  });
});
