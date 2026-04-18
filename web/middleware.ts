import { NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";

// Edge-safe JSON logger (middleware corre en runtime edge).
// Emitimos el mismo shape que lib/observability/logger.ts para consistencia.
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Request ID propagation ──────────────────────────────────────────
  // Respetamos el que venga del cliente/proxy si ya esta presente.
  const incomingReqId = request.headers.get("x-request-id");
  const requestId = incomingReqId && incomingReqId.trim().length > 0 ? incomingReqId : ulid();

  // Log estructurado de la request.
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

  // Prepara headers mutables para propagar a la request downstream.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // Helper para construir responses con el requestId setado.
  const withReqId = (res: NextResponse): NextResponse => {
    res.headers.set("x-request-id", requestId);
    return res;
  };

  // ─── Dashboard protection (admin) ────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("pacame_auth")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return withReqId(NextResponse.redirect(loginUrl));
    }

    return withReqId(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // ─── Portal protection (clients) ────────────────────────
  if (pathname.startsWith("/portal")) {
    // Allow login page and reset-password without auth
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

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*"],
};
