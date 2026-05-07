/**
 * Feature flags simples para el despliegue Storybook 3D.
 *
 * Cuando STORYBOOK_HOME=1 → la home `/` muestra el rediseño 3D.
 * Cuando STORYBOOK_HOME=0 (o no definido) → la home muestra la versión clásica.
 *
 * En Vercel:
 *   - Preview env: `NEXT_PUBLIC_STORYBOOK_HOME=1` para validar.
 *   - Production env: `NEXT_PUBLIC_STORYBOOK_HOME=0` hasta el switch.
 *
 * Cambiar este flag en Vercel → redeploy <60s → rollback inmediato.
 */

export const STORYBOOK_HOME =
  process.env.NEXT_PUBLIC_STORYBOOK_HOME === "1";
