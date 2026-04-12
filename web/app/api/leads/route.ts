import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAgentActivity } from "@/lib/agent-logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple in-memory rate limit (per IP, 5 requests per 10 minutes)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Intentalo en unos minutos." }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, company, services, budget, message, referral_code } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email son obligatorios" }, { status: 400 });
    }

    // 1. SIEMPRE guardar en Supabase primero (nunca perder un lead)
    const { data: lead, error: dbError } = await supabase.from("leads").insert({
      name,
      email,
      business_name: company || null,
      problem: message || null,
      budget: budget || null,
      source: referral_code ? "referral" : "web",
      status: "new",
      sage_analysis: {
        services_requested: services || [],
        referral_code: referral_code || null,
        submitted_at: new Date().toISOString(),
      },
    }).select().single();

    // 1b. Si viene con referral code, asociar el lead al referido
    if (referral_code && lead?.id) {
      try {
        // Buscar referral activo con ese codigo
        const { data: referral } = await supabase
          .from("referrals")
          .select("id, referrer_client_id")
          .eq("referral_code", referral_code)
          .eq("status", "pending")
          .single();

        if (referral) {
          await supabase.from("referrals").update({
            referred_lead_id: lead.id,
            status: "contacted",
          }).eq("id", referral.id);
        } else {
          // Buscar si es un partner code
          const { data: partner } = await supabase
            .from("commercials")
            .select("id, partner_code")
            .eq("partner_code", referral_code)
            .single();

          if (partner) {
            await supabase.from("referrals").insert({
              referral_code: referral_code,
              referrer_client_id: partner.id,
              referred_lead_id: lead.id,
              source: "partner",
              status: "contacted",
            });

            await supabase.from("commercials").update({
              total_referrals: (await supabase.from("commercials").select("total_referrals").eq("id", partner.id).single()).data?.total_referrals + 1,
            }).eq("id", partner.id);
          }
        }
      } catch {
        // Referral association failure is non-blocking
      }
    }

    if (dbError) {
      console.error("Supabase error:", dbError);
      // Aun con error de DB, intentamos n8n
    }

    // 2. Notificar via n8n (no bloqueante)
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_LEAD_WEBHOOK;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...body,
            lead_id: lead?.id,
            source: "web_form",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch {
        // n8n failure is non-blocking — lead is already in Supabase
      }
    }

    // 3. Crear notificacion para Pablo
    await supabase.from("notifications").insert({
      type: "new_lead",
      priority: "high",
      title: "Nuevo lead desde la web",
      message: `${name} (${company || "sin empresa"}) — ${email}. Servicios: ${(services || []).join(", ") || "no especificado"}`,
      data: { lead_id: lead?.id, name, email, company, services, budget },
    });

    // 4. Auto-enqueue into nurturing sequence (non-blocking)
    if (lead?.id && lead?.email) {
      try {
        const baseUrl = request.nextUrl.origin;
        await fetch(`${baseUrl}/api/nurture`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "enqueue",
            lead_id: lead.id,
            sequence_id: "welcome",
          }),
        });
      } catch {
        // Nurturing failure is non-blocking
      }
    }

    // 5. Log to Oficina
    logAgentActivity({
      agentId: "sage",
      type: "alert",
      title: `Nuevo lead: ${name}`,
      description: `${company || "Sin empresa"} — ${email}. Servicios: ${(services || []).join(", ") || "no especificado"}. Nurturing iniciado.`,
      metadata: { lead_id: lead?.id, budget, source: "web" },
    });

    return NextResponse.json({ success: true, lead_id: lead?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error procesando lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
