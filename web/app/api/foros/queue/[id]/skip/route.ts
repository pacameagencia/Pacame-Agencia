/**
 * POST /api/foros/queue/[id]/skip
 * Marca opportunity como skipped (Pablo decide no responder).
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("foros_opportunities")
    .update({ status: "skipped" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, opportunity_id: id, status: "skipped" });
}
