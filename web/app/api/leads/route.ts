import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";
import { notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import { notifyHotLead } from "@/lib/telegram";
import { sendLeadWelcome, isWhatsAppConfigured } from "@/lib/whatsapp";
import { fireSynapse, recordStimulus, startThoughtChain, rememberMemory } from "@/lib/neural";

const leadSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres").max(100),
  email: z.email("Email no valido"),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  services: z.array(z.string()).max(10).optional(),
  budget: z.string().max(50).optional(),
  message: z.string().max(2000).optional(),
  referral_code: z.string().max(50).optional(),
});

const supabase = createServerSupabase();

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

    const raw = await request.json();
    const parsed = leadSchema.safeParse(raw);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Datos invalidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, phone, company, services, budget, message, referral_code } = parsed.data;

    // Auto-score based on budget + services + referral
    let score = 2;
    if (budget === ">5000€") score = 5;
    else if (budget === "3000-5000€") score = 4;
    else if (budget === "1500-3000€") score = 3;
    else if (budget === "500-1500€") score = 2;
    else if (budget === "<500€") score = 1;
    if (referral_code) score = Math.min(5, score + 1);
    if ((services || []).length >= 3) score = Math.min(5, score + 1);

    // 1. SIEMPRE guardar en Supabase primero (nunca perder un lead)
    const { data: lead, error: dbError } = await supabase.from("leads").insert({
      name,
      email,
      phone: phone || null,
      business_name: company || null,
      problem: message || null,
      budget: budget || null,
      score,
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

            const { data: current } = await supabase
              .from("commercials")
              .select("total_referrals")
              .eq("id", partner.id)
              .single();
            const currentCount = (current?.total_referrals as number | null) ?? 0;
            await supabase
              .from("commercials")
              .update({ total_referrals: currentCount + 1 })
              .eq("id", partner.id);
          }
        }
      } catch (err) {
        // Referral association failure is non-blocking, but log it
        console.warn("[leads] referral association failed:", err instanceof Error ? err.message : "unknown");
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
            ...parsed.data,
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

    // 3b. Notificar a Pablo por email + Telegram
    notifyPablo(
      `Nuevo lead: ${name} (${company || "sin empresa"})`,
      wrapEmailTemplate(
        `<strong>${name}</strong>${company ? ` de <strong>${company}</strong>` : ""}\n\n` +
        `Email: ${email}\n` +
        (phone ? `Telefono: ${phone}\n` : "") +
        `Servicios: ${(services || []).join(", ") || "No especificado"}\n` +
        `Presupuesto: ${budget || "No indicado"}\n` +
        `Mensaje: ${message ? message.slice(0, 200) : "Sin mensaje"}` +
        (referral_code ? `\n\nViene referido: ${referral_code}` : ""),
        { cta: "Ver en dashboard", ctaUrl: "https://pacameagencia.com/dashboard/leads" }
      )
    );
    notifyHotLead({
      name,
      business_name: company || undefined,
      score: referral_code ? 4 : 3,
      problem: message ? message.slice(0, 100) : undefined,
      budget: budget || undefined,
      source: referral_code ? `referral (${referral_code})` : "web",
    });

    // 3c. Enviar WhatsApp de bienvenida si tiene telefono
    if (phone && isWhatsAppConfigured()) {
      try {
        await sendLeadWelcome(phone, name);
      } catch {
        // WhatsApp failure is non-blocking
      }
    }

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

    // 6. Neural: estimulo externo → SAGE, sinapsis DIOS→SAGE, cadena de pensamiento
    recordStimulus({ targetAgent: "sage", source: "webhook", signal: `nuevo_lead:${name}:${score}`, intensity: Math.min(score / 5, 1) });
    fireSynapse("dios", "sage", "orchestrates", true);
    if (score >= 4) {
      fireSynapse("sage", "nexus", "delegates_to", true); // hot lead → nurturing pipeline
    }
    startThoughtChain({ initiatingAgent: "sage", goal: `Procesar lead ${name} (score ${score})`, participatingAgents: ["sage", "nexus", "copy"] });
    rememberMemory({
      agentId: "sage",
      type: "episodic",
      title: `Lead recibido: ${name}`,
      content: `${company || "Sin empresa"}, ${email}. Budget: ${budget || "?"}. Score: ${score}. Servicios: ${(services || []).join(", ") || "?"}`,
      importance: score / 5,
      tags: ["lead", "inbound", score >= 4 ? "hot" : "warm"],
    });

    return NextResponse.json({ success: true, lead_id: lead?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error procesando lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
