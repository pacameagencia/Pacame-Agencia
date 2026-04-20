// Next 16 instrumentation hook: se ejecuta una vez al arrancar el runtime
// (node o edge) y permite registrar Sentry + cualquier otra telemetria.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  } else if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(
  err: unknown,
  request: unknown,
  context: unknown,
) {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
}
