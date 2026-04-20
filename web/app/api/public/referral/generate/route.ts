import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";
import { getLogger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/public/referral/generate
 * Body: { email: string }
 *
 * Busca el client por email. Si existe y tiene >= 1 order pagado,
 * genera (o devuelve) su referral_code unico.
 *
 * Si no existe cliente o no ha comprado nada, devuelve 403 — no queremos
 * codigos de gente que no es cliente real (evitar spam + mantener calidad).
 *
 * Formato codigo: "PACAME-" + primeras 3 letras del nombre en mayus + 4 chars random.
 */

const schema = z.object({
  email: z.string().email().max(320).toLowerCase(),
});

function randCode(name: string | null): string {
  const prefix = (name || "PAC")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${rand}`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const supabase = createServerSupabase();
  const log = getLogger();

  // Busca cliente
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email")
    .eq("email", email)
    .maybeSingle();

  if (!client) {
    return NextResponse.json(
      { error: "not_a_client", message: "No encontramos ningun pedido a tu nombre. Compra algo en PACAME y luego puedes invitar." },
      { status: 403 }
    );
  }

  // Verifica que tenga al menos 1 order pagado
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id)
    .in("status", ["paid", "inputs_pending", "processing", "delivered"]);

  if (!count || count < 1) {
    return NextResponse.json(
      { error: "no_orders", message: "Para invitar amigos necesitas al menos 1 pedido confirmado." },
      { status: 403 }
    );
  }

  // Lookup o crea codigo
  const existing = await supabase
    .from("referral_codes")
    .select("code, discount_pct, commission_pct, total_uses, total_revenue_cents, total_commission_cents")
    .eq("client_id", client.id)
    .maybeSingle();

  if (existing.data) {
    return NextResponse.json({
      ok: true,
      code: existing.data.code,
      discount_pct: existing.data.discount_pct,
      commission_pct: existing.data.commission_pct,
      stats: {
        total_uses: existing.data.total_uses,
        total_revenue_cents: existing.data.total_revenue_cents,
        total_commission_cents: existing.data.total_commission_cents,
      },
    });
  }

  // Generar nuevo — 3 intentos por si hay colision
  let code = "";
  for (let i = 0; i < 3; i++) {
    const candidate = randCode(client.name);
    const { data: conflict } = await supabase
      .from("referral_codes")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();
    if (!conflict) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    log.error({ clientId: client.id }, "[referral] no se pudo generar codigo unico");
    return NextResponse.json({ error: "code_gen_fail" }, { status: 500 });
  }

  const { data: created, error: insErr } = await supabase
    .from("referral_codes")
    .insert({
      client_id: client.id,
      code,
      discount_pct: 10,
      commission_pct: 15,
    })
    .select("code, discount_pct, commission_pct, total_uses, total_revenue_cents, total_commission_cents")
    .single();

  if (insErr || !created) {
    log.error({ err: insErr, clientId: client.id }, "[referral] insert fallo");
    return NextResponse.json({ error: insErr?.message || "insert_fail" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    code: created.code,
    discount_pct: created.discount_pct,
    commission_pct: created.commission_pct,
    stats: {
      total_uses: 0,
      total_revenue_cents: 0,
      total_commission_cents: 0,
    },
  });
}
