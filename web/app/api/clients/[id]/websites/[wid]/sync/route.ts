import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { wpClient, wpListPosts } from "@/lib/wordpress";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/clients/[id]/websites/[wid]/sync
 * Pull-only: lista los posts recientes del WP del cliente para mostrarlos en el
 * dashboard junto con los drafts PACAME. No persiste — la fuente de la verdad
 * sigue siendo el WP.
 */
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
    return NextResponse.json({ error: "sync currently supports only wordpress" }, { status: 400 });
  }

  try {
    const client = await wpClient(wid);
    const posts = await wpListPosts(client, { perPage: 20 });
    await supabase
      .from("client_websites")
      .update({ last_sync_at: new Date().toISOString(), status: "connected", last_error: null })
      .eq("id", wid);
    return NextResponse.json({
      ok: true,
      count: posts.length,
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title.rendered,
        link: p.link,
        status: p.status,
        modified_gmt: p.modified_gmt,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await supabase
      .from("client_websites")
      .update({ status: "error", last_error: message.slice(0, 500) })
      .eq("id", wid);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
