// TODO: eliminar al cerrar Sprint 1 (observabilidad).
// Endpoint temporal para verificar que Sentry recibe eventos.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
  const token = req.nextUrl.searchParams.get("token");
  const cronSecret = process.env.CRON_SECRET;

  if (isProd && (!cronSecret || token !== cronSecret)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  throw new Error("Sentry test " + Date.now());
}
