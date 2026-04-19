import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/apps/pacame-agenda/services?instance_id=X — lista servicios del cliente
 * POST /api/apps/pacame-agenda/services — crea servicio nuevo
 */

export async function GET(request: NextRequest) {
  const client = await getAuthedClient(request);
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const instanceId = request.nextUrl.searchParams.get("instance_id");
  if (!instanceId) return NextResponse.json({ error: "instance_id required" }, { status: 400 });

  const supabase = createServerSupabase();
  // Verify ownership
  const { data: instance } = await supabase
    .from("app_instances")
    .select("id")
    .eq("id", instanceId)
    .eq("client_id", client.id)
    .maybeSingle();
  if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data } = await supabase
    .from("agenda_services")
    .select("*")
    .eq("instance_id", instanceId)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ services: data || [] });
}

export async function POST(request: NextRequest) {
  const client = await getAuthedClient(request);
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { instance_id, slug, name, description, duration_min, buffer_before_min, buffer_after_min, price_cents, capacity } = body;

  if (!instance_id || !name || !duration_min) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: instance } = await supabase
    .from("app_instances")
    .select("id")
    .eq("id", instance_id)
    .eq("client_id", client.id)
    .maybeSingle();
  if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const finalSlug =
    (slug as string)?.trim() ||
    (name as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const { data, error } = await supabase
    .from("agenda_services")
    .insert({
      instance_id,
      client_id: client.id,
      slug: finalSlug,
      name,
      description: description || null,
      duration_min,
      buffer_before_min: buffer_before_min ?? 0,
      buffer_after_min: buffer_after_min ?? 5,
      price_cents: price_cents ?? null,
      capacity: capacity ?? 1,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data });
}
