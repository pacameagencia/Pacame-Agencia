// Sentry config para runtime Edge (middleware.ts, edge API routes).
// Nota: las integraciones nativas http/fetch de Node no aplican aqui.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: env === "production" ? 0.1 : 1.0,
    profilesSampleRate: 0,
    debug: false,
  });
}
