/**
 * compose — combina middlewares tipo (handler) => handler en orden derecha a
 * izquierda. El primero que pases es el MAS EXTERNO (se ejecuta primero).
 *
 * Ejemplo:
 *   compose(
 *     withRateLimit(authLimiter, getClientIp),
 *     withValidation({ body: Schema }),
 *   )(async ({ body }) => { ... })
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Middleware<H = any> = (handler: H) => H;

export function compose<H>(...middlewares: Middleware<H>[]): (handler: H) => H {
  return (handler: H) =>
    middlewares.reduceRight<H>((acc, mw) => mw(acc), handler);
}
