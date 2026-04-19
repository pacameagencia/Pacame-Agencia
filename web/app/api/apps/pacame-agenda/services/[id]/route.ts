import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";

export const dynamic = "force-dynamic";

async function verifyOwnership(request: NextRequest, serviceId: string) {
  const client = await getAuthedClient(request);
  if (!client) return null;
  const supabase = createServerSupabase();
  const { data: svc } = await supabase
    .from("agenda_services")
    .select("id, client_id")
    .eq("id", serviceId)
    .eq("client_id", client.id)
    .maybeSingle();
  return svc ? { client, supabase } : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await verifyOwnership(request, id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized or not found" }, { status: 401 });

  const body = await request.json();
  const allowed = [
    "name",
    "description",
    "duration_min",
    "buffer_before_min",
    "buffer_after_min",
    "price_cents",
    "capacity",
    "is_active",
    "sort_order",
    "color",
    "requires_prepay",
  ];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (k in body) update[k] = body[k];

  const { data, error } = await ctx.supabase
    .from("agenda_services")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await verifyOwnership(request, id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized or not found" }, { status: 401 });

  // Soft-delete: marca is_active=false (mantener refs de appointments)
  const { error } = await ctx.supabase
    .from("agenda_services")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
