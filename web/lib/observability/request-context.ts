// AsyncLocalStorage para propagar contexto por request (requestId, clientId, ...)
// sin tener que pasarlo manualmente por todos los parametros.
//
// En edge runtime AsyncLocalStorage es *experimental* pero esta disponible
// en V8 recientes. Si el import falla, degradamos a un stub que siempre
// devuelve contexto vacio. El logger sigue funcionando, solo perdemos
// propagacion automatica (el caller tendria que pasar requestId explicito).

import { getLogger, type Logger } from "./logger";

export interface RequestContext {
  requestId: string;
  clientId?: string;
  orderId?: string;
  userId?: string;
  path?: string;
  method?: string;
  ip?: string;
}

type Als<T> = {
  getStore(): T | undefined;
  run<R>(store: T, cb: () => R): R;
};

let als: Als<RequestContext> | null = null;

function getAls(): Als<RequestContext> | null {
  if (als) return als;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const { AsyncLocalStorage } = require("node:async_hooks") as {
      AsyncLocalStorage: new <T>() => Als<T>;
    };
    als = new AsyncLocalStorage<RequestContext>();
    return als;
  } catch {
    // No disponible (edge workers antiguos, etc.)
    return null;
  }
}

/**
 * Ejecuta `fn` con `ctx` activo. Dentro de `fn` (y promesas creadas dentro),
 * `getContext()` devuelve este contexto.
 */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  const store = getAls();
  if (!store) return fn();
  return store.run(ctx, fn);
}

/** Devuelve el contexto actual o undefined si no hay request activa. */
export function getContext(): RequestContext | undefined {
  const store = getAls();
  if (!store) return undefined;
  return store.getStore();
}

/**
 * Logger contextual: mergea el RequestContext activo con el logger root.
 * Si no hay contexto, devuelve el root logger sin bindings extra.
 */
export function getContextualLogger(extra?: Record<string, unknown>): Logger {
  const ctx = getContext();
  if (!ctx && !extra) return getLogger();
  return getLogger({ ...(ctx || {}), ...(extra || {}) });
}
