import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/apps/pacame-agenda/embed?instance_id=X[&primary=%237C3AED]
 *
 * HTML standalone para previsualizar el widget (iframe-able). Permite que
 * un cliente pegue en su web un simple <iframe src="..."> cuando no puede
 * incluir el script directamente.
 */

export const runtime = "nodejs";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function escapeAttr(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const instanceId = p.get("instance_id") || "";
  const primary = p.get("primary") || "";

  if (!/^[0-9a-f-]{10,64}$/i.test(instanceId)) {
    return NextResponse.json(
      { error: "instance_id invalido" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "pacameagencia.com";
  const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  const primaryAttr = /^#[0-9a-f]{3,8}$/i.test(primary)
    ? ` data-primary="${escapeAttr(primary)}"`
    : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Reserva</title>
<style>
  html,body{margin:0;padding:0;background:#fafafa;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  body{padding:16px}
</style>
</head>
<body>
<div data-pacame-agenda="${escapeAttr(instanceId)}"${primaryAttr}></div>
<script src="${origin}/api/apps/pacame-agenda/widget.js" defer></script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Frame-Options": "ALLOWALL",
      ...CORS_HEADERS,
    },
  });
}
