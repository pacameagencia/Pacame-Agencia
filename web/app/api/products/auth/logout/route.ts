/**
 * POST /api/products/auth/logout
 * Borra el session token del user actual + clear cookie.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { SESSION_COOKIE, clearSessionCookie } from "@/lib/products/auth";

export const runtime = "nodejs";

export async function POST() {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (token) {
    const supabase = createServerSupabase();
    await supabase
      .from("pacame_product_users")
      .update({ auth_token: null, auth_token_expires: null })
      .eq("auth_token", token);
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearSessionCookie());
  return res;
}
