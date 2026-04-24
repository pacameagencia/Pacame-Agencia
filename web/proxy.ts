import { NextRequest, NextResponse } from "next/server";
import { ulid } from "ulid";
import { needsCsrfCheck, verifyCsrf } from "@/lib/security/csrf";
import { verifyDashboardTokenEdge } from "@/lib/dashboard-auth";

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

// Next 16 deprecated "middleware" file + export convention in favor of "proxy".
// Migrated on 2026-04-24 to resolve MIDDLEWARE_INVOCATION_FAILED errors in
// production edge runtime.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Request ID propagation ──────────────────────────────────────────
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
    return res;
  };

  // ─── CSRF check para mutaciones en /api/** ──────────────
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
        return withReqId(
          NextResponse.json({ error: "CSRF token invalid" }, { status: 403 }),
        );
      }
    }
  }

  // ─── Dashboard protection (admin) ────────────────────────
  // Merge S3 compliance + HMAC-signed tokens (PR #9)
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

  // ─── Portal protection (clients) ────────────────────────
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

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*", "/api/:path*"],
};
