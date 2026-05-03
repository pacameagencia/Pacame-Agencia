/**
 * Multi-host routing middleware (PACAME ↔ DarkRoom).
 *
 * Razón: este Next.js sirve dos dominios simultáneamente:
 *   - `pacameagencia.com`: marca PACAME (Capa 1). Default.
 *   - `darkroomcreative.cloud`: marca DarkRoom (Capa 3 SaaS aislada).
 *
 * Regla maestra (`strategy/darkroom/proteccion-identidad.md` + `arquitectura-3-capas.md`):
 * DarkRoom NO se asocia públicamente a PACAME. El middleware ENFORCEA esto a
 * nivel de routing — sin él, alguien podría entrar a `darkroomcreative.cloud/equipo`
 * y leer "el equipo PACAME es...", filtrando la separación de marca.
 *
 * Comportamiento:
 *   - Host `darkroomcreative.cloud` o subdominios: solo permite rutas DarkRoom +
 *     compartidas. Resto → 404.
 *   - Host `pacameagencia.com` o cualquier otro (default PACAME): bloquea rutas
 *     DarkRoom (`/legal/*`, `/crew/*`, `/api/darkroom/*`) → 404. Resto pasa.
 *   - `localhost`, `127.0.0.1`, `*.vercel.app` (preview): NO aplica restricciones
 *     (modo dev/staging).
 *
 * Notas:
 *   - El middleware corre en runtime Edge (rápido, sin Node APIs).
 *   - El matcher excluye estáticos (_next, favicon, imágenes, CSS, JS, fonts).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROD_DARKROOM_HOST = "darkroomcreative.cloud";

/**
 * Rutas exclusivas de DarkRoom. Si alguien las pide desde un host PACAME →
 * 404 inmediato. Si las pide desde host DarkRoom → permitir.
 *
 * Mantener sincronizado con `strategy/darkroom/runbook/multi-host-routing.md`.
 */
const DARKROOM_ONLY_PATHS = [
  "/legal",        // /legal y /legal/*
  "/crew",         // /crew y /crew/*
  "/api/darkroom", // /api/darkroom/*
];

/**
 * Rutas que deben funcionar en TODOS los hosts (utilitarias o compartidas).
 * Se permite explícitamente y no aplica filtrado.
 */
const SHARED_PATHS = [
  "/api/health",         // health check
  "/api/og",             // open graph image dinámica
  "/api/cron",           // crons compartidos (Vercel los llama por host único)
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.json",
  "/favicon.ico",
  "/opengraph-image",
  "/icon",
  "/apple-icon",
  "/_next",              // next internals (assets, image optimization)
  "/_vercel",            // vercel internals
];

function startsWithAny(pathname: string, prefixes: readonly string[]): boolean {
  for (const p of prefixes) {
    if (pathname === p) return true;
    if (pathname.startsWith(p + "/")) return true;
  }
  return false;
}

function isDarkRoomProductionHost(host: string): boolean {
  const h = host.toLowerCase().replace(/:\d+$/, "");
  return h === PROD_DARKROOM_HOST || h.endsWith("." + PROD_DARKROOM_HOST);
}

function isDevOrPreviewHost(host: string): boolean {
  const h = host.toLowerCase().replace(/:\d+$/, "");
  return (
    h === "localhost" ||
    h.startsWith("127.0.0.1") ||
    h.endsWith(".vercel.app") ||
    h.endsWith(".vercel.dev")
  );
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  // 1. Compartidas siempre pasan (health, sitemap, og, etc.)
  if (startsWithAny(pathname, SHARED_PATHS)) {
    return NextResponse.next();
  }

  // 2. Dev / preview: cero restricciones (todo accesible para testing)
  if (isDevOrPreviewHost(host)) {
    return NextResponse.next();
  }

  const isDarkRoomHost = isDarkRoomProductionHost(host);
  const isDarkRoomPath = startsWithAny(pathname, DARKROOM_ONLY_PATHS);

  // 3. Host DarkRoom: solo rutas DarkRoom + compartidas + raíz
  if (isDarkRoomHost) {
    if (isDarkRoomPath) {
      return NextResponse.next();
    }
    // Raíz: por ahora redirigimos al hub legal (no hay landing DarkRoom oficial todavía).
    // Cuando se construya `/` para DarkRoom, este redirect se elimina y se permite.
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL("/legal", req.url));
    }
    // Cualquier otra ruta PACAME accedida desde host DarkRoom → 404 (sin filtrar contenido)
    return new NextResponse("Not Found", { status: 404 });
  }

  // 4. Host PACAME (default): bloquea rutas DarkRoom-only
  if (isDarkRoomPath) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Matcher Next.js — excluye estáticos para no procesar imágenes/CSS/JS por middleware.
   * Resto pasa por el middleware (incluye páginas y API routes).
   *
   * Sintaxis: regex negativo. Excluye paths que terminan en extensión común estática
   * o empiezan por _next/static, _next/image, favicon.ico.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff|woff2|ttf|otf|map)$).*)",
  ],
};
