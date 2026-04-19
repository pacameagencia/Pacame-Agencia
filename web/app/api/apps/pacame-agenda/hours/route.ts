import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedClient } from "@/lib/client-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/apps/pacame-agenda/hours — crea una franja horaria
 * Body: { instance_id, weekday (0-6), start_time 'HH:MM', end_time 'HH:MM' }
 */
export async function POST(request: NextRequest) {
  const client = await getAuthedClient(request);
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { instance_id, weekday, start_time, end_time } = body;

  if (
    typeof instance_id !== "string" ||
    typeof weekday !== "number" ||
    weekday < 0 ||
    weekday > 6 ||
    !start_time ||
    !end_time
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: instance } = await supabase
    .from("app_instances")
    .select("id")
    .eq("id", instance_id)
    .eq("client_id", client.id)
    .maybeSingle();
  if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("agenda_hours")
    .insert({
      instance_id,
      weekday,
      start_time: start_time.length === 5 ? `${start_time}:00` : start_time,
      end_time: end_time.length === 5 ? `${end_time}:00` : end_time,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hour: data });
}
