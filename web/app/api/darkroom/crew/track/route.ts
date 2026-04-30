/**
 * POST /api/darkroom/crew/track
 *
 * Setea cookie `dr_ref` 30 días cuando alguien llega con `?ref=CODE` en URL.
 * Frontend de Dark Room llama a este endpoint si detecta `?ref=` en location.
 *
 * Body: { code: string }
 * Response 200: { ok: true } + Set-Cookie
 *           400 si code inválido o no existe
 *
 * Cookie: dr_ref=<code>; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/
 *
 * Idéntico al patrón que ya lee POST /api/darkroom/lead. Last-touch attribution
 * intencionada: si el visitante llega con dos codes distintos en sesiones
 * diferentes, el último gana.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { COOKIE_DAYS } from "@/lib/darkroom/crew-tiers";

export const runtime = "nodejs";
export const maxDuration = 10;

const CODE_RE = /^[a-z0-9-]{4,48}$/;

export async function POST(request: NextRequest) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const code = (body.code ?? "").trim().toLowerCase();
  if (!code || !CODE_RE.test(code)) {
    return NextResponse.json({ error: "valid code required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: aff } = await supabase
    .from("darkroom_affiliates")
    .select("code, status")
    .eq("code", code)
    .maybeSingle();

  if (!aff) {
    return NextResponse.json({ error: "code not found" }, { status: 404 });
  }
  if ((aff as { status: string }).status === "banned") {
    return NextResponse.json({ error: "code unavailable" }, { status: 410 });
  }

  const res = NextResponse.json({ ok: true, code });
  res.cookies.set("dr_ref", code, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_DAYS * 24 * 60 * 60,
  });
  return res;
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "darkroom-crew-track", method: "POST" });
}
