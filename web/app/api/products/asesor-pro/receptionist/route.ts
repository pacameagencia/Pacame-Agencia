/**
 * GET  /api/products/asesor-pro/receptionist  → estado de la recepcionista Vapi del asesor
 * POST /api/products/asesor-pro/receptionist  → crea/actualiza el assistant
 *      Body: { brand, business_hours?, vapi_first_message?, enabled? }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrAdmin } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  createAssistant,
  updateAssistant,
  buildAsesorReceptionistConfig,
} from "@/lib/vapi";

export const runtime = "nodejs";

async function getSettings(asesorId: string) {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("asesorpro_settings")
    .select("*")
    .eq("asesor_user_id", asesorId)
    .maybeSingle();
  return data;
}

export async function GET() {
  const user = await requireOwnerOrAdmin();
  const settings = await getSettings(user.id);
  return NextResponse.json({
    ok: true,
    enabled: settings?.vapi_enabled ?? false,
    assistant_id: settings?.vapi_assistant_id ?? null,
    business_hours: settings?.business_hours ?? null,
    first_message: settings?.vapi_first_message ?? null,
  });
}

interface PostBody {
  brand?: string;
  business_hours?: string;
  vapi_first_message?: string;
  enabled?: boolean;
}

export async function POST(request: NextRequest) {
  const user = await requireOwnerOrAdmin();
  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const settings = await getSettings(user.id);
  const brand = body.brand ?? "Asesoría";
  const baseUrl = process.env.PUBLIC_BASE_URL || request.nextUrl.origin;

  const config = buildAsesorReceptionistConfig({
    asesor_name: user.full_name ?? "tu asesor",
    brand,
    business_hours: body.business_hours,
    webhook_url: `${baseUrl}/api/vapi/webhook`,
    metadata: {
      pacame_user_id: user.id,
      pacame_product_id: "asesor-pro",
    },
  });
  if (body.vapi_first_message) {
    config.firstMessage = body.vapi_first_message;
  }

  let assistantId = settings?.vapi_assistant_id ?? null;
  if (assistantId) {
    const upd = await updateAssistant(assistantId, config);
    if (!upd.ok) {
      return NextResponse.json({ error: "vapi_update_failed", detail: upd.error }, { status: 502 });
    }
  } else {
    const created = await createAssistant(config);
    if (!created.ok) {
      return NextResponse.json({ error: "vapi_create_failed", detail: created.error }, { status: 502 });
    }
    assistantId = created.id;
  }

  await supabase
    .from("asesorpro_settings")
    .upsert(
      {
        asesor_user_id: user.id,
        vapi_assistant_id: assistantId,
        vapi_enabled: body.enabled ?? true,
        vapi_first_message: config.firstMessage ?? null,
        business_hours: body.business_hours ?? null,
        vapi_phone_number_id: process.env.VAPI_PHONE_NUMBER_ID ?? null,
      },
      { onConflict: "asesor_user_id" }
    );

  return NextResponse.json({
    ok: true,
    assistant_id: assistantId,
    dashboard_url: `https://dashboard.vapi.ai/assistants/${assistantId}`,
  });
}
