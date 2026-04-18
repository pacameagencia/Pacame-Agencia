"use client";

/**
 * CSRF client helper — lee cookie `pacame_csrf` y adjunta header `x-csrf-token`
 * en mutaciones fetch.
 *
 * Uso (client component):
 *   import { csrfFetch } from "@/lib/csrf-fetch";
 *   const res = await csrfFetch("/api/orders/123/revision", { method: "POST", body: ... });
 */

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)pacame_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

type FetchInit = Parameters<typeof fetch>[1];

/**
 * Wrapper de fetch que adjunta el header CSRF en mutaciones.
 * GET/HEAD: passthrough sin cambios.
 */
export async function csrfFetch(input: RequestInfo | URL, init?: FetchInit): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return fetch(input, init);
  }
  const token = getCsrfToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("x-csrf-token", token);
  return fetch(input, { ...init, headers });
}

/**
 * React hook para leer el token actual (util para forms HTML nativos).
 */
export function useCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  return getCsrfToken();
}
