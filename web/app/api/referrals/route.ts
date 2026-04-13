import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";
import { verifyInternalAuth } from "@/lib/api-auth";

const supabase = createServerSupabase();

function generateCode(prefix: string, length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}_${code}`;
}

// Commission tiers
const TIERS = {
  bronce: { firstPct: 15, recurringPct: 10, months: 6, minReferrals: 0 },
  plata: { firstPct: 20, recurringPct: 12, months: 9, minReferrals: 3 },
  oro: { firstPct: 25, recurringPct: 15, months: 999, minReferrals: 6 },
} as const;

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { action } = body;

  // --- Generate referral code for existing client ---
  if (action === "generate_client_code") {
    const { client_id } = body;
    if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

    // Check if client already has a referral
    const { data: existing } = await supabase
      .from("referrals")
      .select("referral_code")
      .eq("referrer_client_id", client_id)
      .is("referred_lead_id", null)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ code: existing[0].referral_code });
    }

    const code = generateCode("R");
    const { error } = await supabase.from("referrals").insert({
      referrer_client_id: client_id,
      referral_code: code,
      status: "pending",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    logAgentActivity({
      agentId: "sage",
      type: "update",
      title: "Codigo de referido generado",
      description: `Cliente ${client_id} tiene codigo: ${code}`,
    });

    return NextResponse.json({ code, url: `https://pacameagencia.com/r/${code}` });
  }

  // --- Track referral landing (when someone visits /r/CODE) ---
  if (action === "track_visit") {
    const { code } = body;
    if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

    const { data: referral } = await supabase
      .from("referrals")
      .select("id, referrer_client_id")
      .eq("referral_code", code)
      .single();

    if (!referral) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

    return NextResponse.json({ valid: true, referral_id: referral.id });
  }

  // --- Convert referral (lead becomes client) ---
  if (action === "convert") {
    const { referral_code, lead_id, client_id } = body;
    if (!referral_code || !client_id) {
      return NextResponse.json({ error: "referral_code and client_id required" }, { status: 400 });
    }

    const { data: referral, error: findErr } = await supabase
      .from("referrals")
      .select("*")
      .eq("referral_code", referral_code)
      .eq("status", "pending")
      .single();

    if (findErr || !referral) {
      return NextResponse.json({ error: "Referral not found or already converted" }, { status: 404 });
    }

    // Update referral
    await supabase.from("referrals").update({
      referred_lead_id: lead_id || null,
      referred_client_id: client_id,
      status: "converted",
      converted_at: new Date().toISOString(),
    }).eq("id", referral.id);

    // Notify Pablo
    await supabase.from("notifications").insert({
      type: "referral_converted",
      priority: "high",
      title: "Referido exitoso",
      message: `El referido con codigo ${referral_code} se ha convertido en cliente.`,
      data: { referral_id: referral.id, client_id, referrer_client_id: referral.referrer_client_id },
    });

    logAgentActivity({
      agentId: "sage",
      type: "delivery",
      title: "Referido convertido",
      description: `Codigo ${referral_code} → nuevo cliente. Descuentos aplicados.`,
    });

    return NextResponse.json({ ok: true });
  }

  // --- Register new commercial/partner ---
  if (action === "register_partner") {
    const { name, email, phone, type } = body;
    if (!name || !email) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 });
    }

    // Check existing
    const { data: existing } = await supabase
      .from("commercials")
      .select("id, partner_code")
      .eq("email", email)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ partner_code: existing[0].partner_code, already_exists: true });
    }

    const partnerCode = generateCode("P");
    const { data, error } = await supabase.from("commercials").insert({
      name,
      email,
      phone: phone || "",
      type: type || "freelance",
      tier: "bronce",
      partner_code: partnerCode,
      status: "active",
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify
    await supabase.from("notifications").insert({
      type: "new_partner",
      priority: "normal",
      title: `Nuevo colaborador: ${name}`,
      message: `${email} se ha registrado como comercial. Codigo: ${partnerCode}`,
      data: { commercial_id: data.id, partner_code: partnerCode },
    });

    logAgentActivity({
      agentId: "sage",
      type: "update",
      title: `Nuevo colaborador: ${name}`,
      description: `Tipo: ${type || "freelance"}. Codigo: ${partnerCode}. Tier: bronce.`,
    });

    return NextResponse.json({
      ok: true,
      partner_code: partnerCode,
      url: `https://pacameagencia.com/partner/${partnerCode}`,
      tier: "bronce",
      commission: TIERS.bronce,
    });
  }

  // --- Get partner dashboard data ---
  if (action === "partner_dashboard") {
    const { partner_code } = body;
    if (!partner_code) return NextResponse.json({ error: "partner_code required" }, { status: 400 });

    const { data: partner } = await supabase
      .from("commercials")
      .select("*")
      .eq("partner_code", partner_code)
      .single();

    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    // Get referrals
    const { data: referrals } = await supabase
      .from("referrals")
      .select("id, referral_code, status, created_at, converted_at, referred_client_id")
      .eq("referral_code", partner_code)
      .order("created_at", { ascending: false });

    // Get commissions
    const { data: commissions } = await supabase
      .from("commissions")
      .select("*")
      .eq("commercial_id", partner.id)
      .order("created_at", { ascending: false });

    const totalPending = (commissions || [])
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const totalPaid = (commissions || [])
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return NextResponse.json({
      partner,
      referrals: referrals || [],
      commissions: commissions || [],
      stats: {
        total_referrals: partner.total_referrals,
        total_conversions: partner.total_conversions,
        total_earned: partner.total_earned,
        pending_payout: totalPending,
        paid_out: totalPaid,
        tier: partner.tier,
        next_tier: partner.tier === "bronce" ? "plata" : partner.tier === "plata" ? "oro" : null,
        referrals_for_next: partner.tier === "bronce"
          ? Math.max(0, 3 - partner.total_conversions)
          : partner.tier === "plata"
            ? Math.max(0, 6 - partner.total_conversions)
            : 0,
      },
    });
  }

  // --- Auto-upgrade tier ---
  if (action === "check_tier") {
    const { commercial_id } = body;
    if (!commercial_id) return NextResponse.json({ error: "commercial_id required" }, { status: 400 });

    const { data: partner } = await supabase
      .from("commercials")
      .select("*")
      .eq("id", commercial_id)
      .single();

    if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let newTier = partner.tier;
    if (partner.total_conversions >= TIERS.oro.minReferrals) newTier = "oro";
    else if (partner.total_conversions >= TIERS.plata.minReferrals) newTier = "plata";

    if (newTier !== partner.tier) {
      const tierConfig = TIERS[newTier as keyof typeof TIERS];
      await supabase.from("commercials").update({
        tier: newTier,
        commission_first_pct: tierConfig.firstPct,
        commission_recurring_pct: tierConfig.recurringPct,
        commission_months: tierConfig.months,
      }).eq("id", commercial_id);

      logAgentActivity({
        agentId: "sage",
        type: "delivery",
        title: `Comercial sube a tier ${newTier.toUpperCase()}`,
        description: `${partner.name} ahora tiene comision ${tierConfig.firstPct}% primer pago + ${tierConfig.recurringPct}% recurrente.`,
      });
    }

    return NextResponse.json({ tier: newTier, upgraded: newTier !== partner.tier });
  }

  // --- List all partners (dashboard) ---
  if (action === "list_partners") {
    const { data } = await supabase
      .from("commercials")
      .select("*")
      .order("total_earned", { ascending: false });

    return NextResponse.json({ partners: data || [] });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
