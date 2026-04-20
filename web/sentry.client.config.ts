// Sentry config para el browser. Replay desactivado por privacidad por defecto.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "development";

  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: env === "production" ? 0.1 : 1.0,
    profilesSampleRate: 0,
    // replayIntegration NO activada por defecto (privacy-first).
    debug: false,
  });
}
