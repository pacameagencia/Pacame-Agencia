// Helpers centralizados para interactuar con Sentry de forma lazy.
// Objetivos:
//  1. No forzar el import en modulos que no lo necesiten (reduce bundle edge).
//  2. Devolver null si SENTRY_DSN no esta definido (no-op en local sin config).
//  3. Aislar el resto del codigo de la API real de Sentry para poder migrarla
//     o mockearla en tests sin reescribir llamadores.

import type {
  Scope,
  SeverityLevel,
} from "@sentry/nextjs";

type SentryModule = typeof import("@sentry/nextjs");

let sentryPromise: Promise<SentryModule | null> | null = null;

/**
 * Carga Sentry de forma lazy. Devuelve null si:
 *  - No hay SENTRY_DSN configurado.
 *  - El modulo @sentry/nextjs no esta disponible en runtime (import falla).
 * Los consumidores deben chequear null antes de llamar metodos.
 */
export function getSentry(): Promise<SentryModule | null> {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return Promise.resolve(null);
  }

  if (!sentryPromise) {
    sentryPromise = import("@sentry/nextjs")
      .then((mod) => mod as SentryModule)
      .catch(() => null);
  }

  return sentryPromise;
}

/**
 * Captura una excepcion en Sentry. No-op si Sentry no esta disponible.
 * Acepta contexto adicional que se adjunta como extra/tags.
 */
export async function captureException(
  err: unknown,
  ctx?: Record<string, unknown>,
): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) return;

  if (ctx && Object.keys(ctx).length > 0) {
    Sentry.withScope((scope: Scope) => {
      for (const [key, value] of Object.entries(ctx)) {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          scope.setTag(key, value);
        } else {
          scope.setExtra(key, value);
        }
      }
      Sentry.captureException(err);
    });
  } else {
    Sentry.captureException(err);
  }
}

/** Captura un mensaje con nivel. No-op si Sentry no esta disponible. */
export async function captureMessage(
  msg: string,
  level: SeverityLevel = "info",
): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) return;
  Sentry.captureMessage(msg, level);
}

/** Asocia el usuario actual al scope global de Sentry. */
export async function setUser(
  user: { id?: string; email?: string } | null,
): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) return;
  Sentry.setUser(user);
}

/**
 * Ejecuta `cb` con un Scope aislado. Util para anadir tags/extras
 * sin contaminar el scope global.
 */
export async function withScope(
  cb: (scope: Scope) => void,
): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) return;
  Sentry.withScope(cb);
}

/** Flush pendiente de Sentry. Llamar antes de exit en serverless. */
export async function flush(timeoutMs = 2000): Promise<boolean> {
  const Sentry = await getSentry();
  if (!Sentry) return true;
  return Sentry.flush(timeoutMs);
}
