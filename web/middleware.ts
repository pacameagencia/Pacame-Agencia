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
 * Ruta interna a la que `darkroomcreative.cloud/` se rewriteá.
 *
 * El usuario ve URL `darkroomcreative.cloud/`. Internamente Next renderiza
 * el contenido de `/darkroom-home/page.tsx`. NO se expone publicamente —
 * acceso directo está bloqueado en el middleware (ver más abajo).
 */
const DARKROOM_HOME_INTERNAL = "/darkroom-home";

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
  const isDarkRoomHomeInternal = pathname === DARKROOM_HOME_INTERNAL || pathname.startsWith(DARKROOM_HOME_INTERNAL + "/");

  // Bloqueo absoluto: `/darkroom-home` es ruta interna, no debe accederse directo
  // desde NINGÚN host (ni siquiera darkroomcreative.cloud — ahí se llega por rewrite).
  if (isDarkRoomHomeInternal) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 3. Host DarkRoom: solo rutas DarkRoom + compartidas + raíz (rewrite)
  if (isDarkRoomHost) {
    if (isDarkRoomPath) {
      return NextResponse.next();
    }
    // Raíz: rewrite interno a /darkroom-home (URL externa sigue siendo /).
    // El usuario ve `darkroomcreative.cloud/`, Next renderiza `/darkroom-home/page.tsx`.
    if (pathname === "/" || pathname === "") {
      const url = req.nextUrl.clone();
      url.pathname = DARKROOM_HOME_INTERNAL;
      return NextResponse.rewrite(url);
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
