/**
 * CSRF double-submit cookie pattern.
 *
 * - En login (admin o cliente), emitimos cookie `pacame_csrf` (no httpOnly — el cliente debe leerla)
 *   con un token aleatorio de 32 bytes hex.
 * - En mutaciones (POST/PUT/PATCH/DELETE) de rutas protegidas, el cliente envia el token
 *   via header `x-csrf-token`. El middleware compara cookie vs header.
 * - Match → OK. No match → 403.
 *
 * Rutas EXENTAS (firma propia o no auth):
 * - `/api/stripe/webhook` (Stripe signature)
 * - `/api/whatsapp/webhook`, `/api/instagram/webhook`, `/api/telegram/webhook`,
 *   `/api/apps/pacame-contact/webhook`, `/api/calls/webhook`, `/api/sms/webhook`,
 *   `/api/instagram/callback` (OAuth callback)
 * - `/api/auth` login / `/api/client-auth` login+magic_link (aun no hay sesion)
 * - `/api/leads` (publico — form de contacto)
 * - `/api/gdpr/delete` accion='confirm' (viene por email link, sin cookie todavia)
 * - `/api/debug-sentry` (test endpoint)
 * - Cron endpoints (Bearer CRON_SECRET ya valida).
 *
 * Cookie config:
 * - Name: `pacame_csrf`
 * - No httpOnly (cliente React necesita leerla via document.cookie para el fetch)
 * - secure + sameSite=lax
 * - ttl: misma que la sesion (30d)
 */

import { NextRequest, NextResponse } from "next/server";

export const CSRF_COOKIE = "pacame_csrf";
export const CSRF_HEADER = "x-csrf-token";
const CSRF_TTL_SECONDS = 30 * 24 * 3600;

/**
 * Genera un token aleatorio de 32 bytes hex.
 * Usa WebCrypto (globalThis.crypto.getRandomValues) — funciona en Node, Edge
 * runtime y navegadores por igual. Evita `node:crypto` que rompe el build de
 * middleware edge en Next 16.
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Adjunta la cookie CSRF a una respuesta. Llamar al emitir sesion (login).
 */
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CSRF_TTL_SECONDS,
    path: "/",
  });
  return response;
}

/**
 * Verifica match entre cookie y header. Devuelve true si valido.
 */
export function verifyCsrf(request: NextRequest): boolean {
  const cookie = request.cookies.get(CSRF_COOKIE)?.value;
  const header = request.headers.get(CSRF_HEADER);
  if (!cookie || !header) return false;
  if (cookie.length !== header.length) return false;
  // Timing-safe comparison
  let diff = 0;
  for (let i = 0; i < cookie.length; i++) {
    diff |= cookie.charCodeAt(i) ^ header.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Rutas exentas de CSRF (HMAC propia, callbacks, cron, o login fresh).
 * Devuelve true si el path no requiere CSRF check.
 */
export function isExemptFromCsrf(pathname: string): boolean {
  const exact = new Set([
    "/api/auth",                     // login admin (aun sin sesion)
    "/api/client-auth",              // login + magic_link (aun sin sesion)
    "/api/leads",                    // form contacto publico
    "/api/debug-sentry",
    "/api/marketplace/upsell-cron",
    "/api/auth/cleanup-cron",
    "/api/gdpr/purge-cron",
    "/api/agents/cron",
    "/api/agents/weekly-audit",
    "/api/agents/neural-decay",
    "/api/seed",
    "/api/setup-memory",
  ]);
  if (exact.has(pathname)) return true;

  const prefixes = [
    "/api/stripe/webhook",
    "/api/whatsapp/webhook",
    "/api/instagram/webhook",
    "/api/instagram/callback",
    "/api/telegram/webhook",
    "/api/apps/pacame-contact/webhook",
    "/api/calls/webhook",
    "/api/sms/webhook",
  ];
  return prefixes.some((p) => pathname.startsWith(p));
}

/**
 * Detecta si el request necesita CSRF check (mutaciones).
 */
export function needsCsrfCheck(request: NextRequest): boolean {
  const method = request.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return false;
  if (!request.nextUrl.pathname.startsWith("/api/")) return false;
  if (isExemptFromCsrf(request.nextUrl.pathname)) return false;

  // Bearer CRON_SECRET exempt (ya valida por si mismo)
  const auth = request.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) return false;

  return true;
}
