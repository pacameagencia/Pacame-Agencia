import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Dashboard protection (admin) ────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("pacame_auth")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ─── Portal protection (clients) ────────────────────────
  if (pathname.startsWith("/portal")) {
    // Allow login page and reset-password without auth
    if (pathname === "/portal" || pathname === "/portal/reset-password") {
      return NextResponse.next();
    }

    const clientToken = request.cookies.get("pacame_client_auth")?.value;

    if (!clientToken) {
      const portalLogin = new URL("/portal", request.url);
      return NextResponse.redirect(portalLogin);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*"],
};
