/**
 * Proxy edge — Next.js 16 successor a `middleware.ts` (deprecated).
 *
 * Combina 3 responsabilidades en orden:
 *   1. Multi-host routing PACAME ↔ DarkRoom (host-based, content separation)
 *   2. Foros tracking (utm_content → cookie 30d para atribución)
 *   3. Request-id propagation + edge JSON log
 *   4. CSRF check para mutaciones /api/**
 *   5. Dashboard auth (cookie HMAC)
 *   6. Portal auth (cookie cliente)
 *
 * Migrado el 2026-05-07 desde `middleware.ts` (Next 16 ya no permite ambos archivos).
 */

import { NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";
import { needsCsrfCheck, verifyCsrf } from "@/lib/security/csrf";
import { verifyDashboardTokenEdge } from "@/lib/dashboard-auth";

// ─── Multi-host config ─────────────────────────────────────────────────
const PROD_DARKROOM_HOST = "darkroomcreative.cloud";
const DARKROOM_ONLY_PATHS = ["/legal", "/crew", "/api/darkroom"] as const;
const DARKROOM_HOME_INTERNAL = "/darkroom-home";
const SHARED_PATHS = [
  "/api/health",
  "/api/og",
  "/api/cron",
  "/api/webhooks",        // Resend, Stripe, etc.
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.json",
  "/favicon.ico",
  "/opengraph-image",
  "/icon",
  "/apple-icon",
  "/_next",
  "/_vercel",
] as const;

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

function applyForosTracking(req: NextRequest, res: NextResponse): NextResponse {
  const utmSource = req.nextUrl.searchParams.get("utm_source");
  const utmContent = req.nextUrl.searchParams.get("utm_content");
  if (utmSource === "foros" && utmContent && /^[a-z0-9-]{6,40}$/i.test(utmContent)) {
    const existing = req.cookies.get("dr_thread_id")?.value;
    if (existing !== utmContent) {
      res.cookies.set("dr_thread_id", utmContent, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    }
  }
  return res;
}

// ─── Edge logger ───────────────────────────────────────────────────────
function edgeLog(level: "info" | "warn" | "error", payload: Record<string, unknown>) {
  const out = {
    level,
    time: new Date().toISOString(),
    service: "pacame-web",
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "dev",
    ...payload,
  };
  // eslint-disable-next-line no-console
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(
    JSON.stringify(out),
  );
}

// ─── Multi-host gate (corre primero, antes que cualquier auth) ─────────
function multiHostGate(req: NextRequest): NextResponse | null {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  if (startsWithAny(pathname, SHARED_PATHS)) {
    return applyForosTracking(req, NextResponse.next());
  }
  if (isDevOrPreviewHost(host)) {
    return applyForosTracking(req, NextResponse.next());
  }

  const isDarkRoomHost = isDarkRoomProductionHost(host);
  const isDarkRoomPath = startsWithAny(pathname, DARKROOM_ONLY_PATHS);
  const isDarkRoomHomeInternal =
    pathname === DARKROOM_HOME_INTERNAL || pathname.startsWith(DARKROOM_HOME_INTERNAL + "/");

  if (isDarkRoomHomeInternal) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (isDarkRoomHost) {
    if (isDarkRoomPath) {
      return applyForosTracking(req, NextResponse.next());
    }
    if (pathname === "/" || pathname === "") {
      const url = req.nextUrl.clone();
      url.pathname = DARKROOM_HOME_INTERNAL;
      return applyForosTracking(req, NextResponse.rewrite(url));
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  if (isDarkRoomPath) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // PACAME default: deja seguir al resto del proxy (auth, CSRF, etc.)
  return null;
}

// ─── Proxy entrypoint ───────────────────────────────────────────────────
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Multi-host gate — si decide responder (404, rewrite, o passthrough con cookies)
  //    devolvemos directamente (excepto si retorna null = "sigue al resto del proxy").
  const hostResponse = multiHostGate(request);
  if (hostResponse) return hostResponse;

  // 2. Request ID propagation
  const incomingReqId = request.headers.get("x-request-id");
  const requestId = incomingReqId && incomingReqId.trim().length > 0 ? incomingReqId : ulid();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  edgeLog("info", {
    requestId,
    method: request.method,
    path: pathname,
    ip,
    msg: "http.request",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const withReqId = (res: NextResponse): NextResponse => {
    res.headers.set("x-request-id", requestId);
    return applyForosTracking(request, res);
  };

  // 3. CSRF para mutaciones en /api/**
  const csrfMode = process.env.CSRF_MODE || "warn";
  if (needsCsrfCheck(request)) {
    const ok = verifyCsrf(request);
    if (!ok) {
      edgeLog("warn", {
        requestId,
        method: request.method,
        path: pathname,
        msg: "csrf.mismatch",
        mode: csrfMode,
      });
      if (csrfMode === "enforce") {
        return withReqId(NextResponse.json({ error: "CSRF token invalid" }, { status: 403 }));
      }
    }
  }

  // 4. Dashboard auth (cookie HMAC)
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("pacame_auth")?.value;
    const ok = await verifyDashboardTokenEdge(token);
    if (!ok) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return withReqId(NextResponse.redirect(loginUrl));
    }
    return withReqId(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // 5. Portal auth (cookie cliente)
  if (pathname.startsWith("/portal")) {
    if (pathname === "/portal" || pathname === "/portal/reset-password") {
      return withReqId(NextResponse.next({ request: { headers: requestHeaders } }));
    }
    const clientToken = request.cookies.get("pacame_client_auth")?.value;
    if (!clientToken) {
      const portalLogin = new URL("/portal", request.url);
      return withReqId(NextResponse.redirect(portalLogin));
    }
    return withReqId(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  return withReqId(NextResponse.next({ request: { headers: requestHeaders } }));
}

// Matcher amplio (del antiguo middleware) — excluye estáticos para no procesarlos.
// Reemplaza el matcher anterior limitado a /dashboard /portal /api.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff|woff2|ttf|otf|map)$).*)",
  ],
};
