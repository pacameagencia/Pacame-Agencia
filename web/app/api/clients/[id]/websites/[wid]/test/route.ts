import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { wpClient, wpPing } from "@/lib/wordpress";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; wid: string }> }
) {
  const unauth = verifyInternalAuth(request);
  if (unauth) return unauth;

  const { id, wid } = await params;
  const supabase = createServerSupabase();

  const { data: site, error } = await supabase
    .from("client_websites")
    .select("id, client_id, platform")
    .eq("id", wid)
    .eq("client_id", id)
    .single();

  if (error || !site) {
    return NextResponse.json({ error: "website not found for this client" }, { status: 404 });
  }
  if (site.platform !== "wordpress") {
    return NextResponse.json({ error: `test only supported for wordpress, got ${site.platform}` }, { status: 400 });
  }

  try {
    const client = await wpClient(wid);
    const me = await wpPing(client);
    await supabase
      .from("client_websites")
      .update({ status: "connected", last_sync_at: new Date().toISOString(), last_error: null })
      .eq("id", wid);
    return NextResponse.json({ ok: true, user: { id: me.id, name: me.name, roles: me.roles } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await supabase
      .from("client_websites")
      .update({ status: "error", last_error: message.slice(0, 500) })
      .eq("id", wid);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
