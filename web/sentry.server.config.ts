// Sentry config para runtime Node (API routes, server components, acciones).
// Init solo si hay DSN; filtra ruido conocido en beforeSend.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: env === "production" ? 0.1 : 1.0,
    profilesSampleRate: 0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.nativeNodeFetchIntegration(),
    ],
    beforeSend(event, hint) {
      // Filtro de errores conocidos/ruidosos.
      const err = (hint as { originalException?: unknown } | null)?.originalException;
      if (err instanceof Error) {
        const msg = err.message || "";
        if (msg.includes("AbortError")) return null;
        if (msg.includes("ECONNRESET")) return null;
      }
      return event;
    },
    debug: false,
  });
}
