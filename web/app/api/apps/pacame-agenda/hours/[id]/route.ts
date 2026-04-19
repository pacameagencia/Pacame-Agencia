import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await getAuthedClient(request);
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  // Verify ownership via join a app_instances
  const { data: row } = await supabase
    .from("agenda_hours")
    .select("id, app_instances!inner(client_id)")
    .eq("id", id)
    .maybeSingle();

  const ownerId = (row as unknown as { app_instances?: { client_id: string } })
    ?.app_instances?.client_id;
  if (!ownerId || ownerId !== client.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase.from("agenda_hours").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
