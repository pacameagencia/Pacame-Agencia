import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity, updateAgentStatus } from "@/lib/agent-logger";
import { sendEmail, notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import { verifyInternalAuth } from "@/lib/api-auth";
import { fireSynapse, recordStimulus, rememberMemory, routeInput } from "@/lib/neural";

const supabase = createServerSupabase();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Service catalog for proposal generation
const SERVICE_CATALOG = {
  "web-corporativa": { name: "Web Corporativa", price: 497, type: "onetime", timeline: "5-10 dias" },
  "landing-page": { name: "Landing Page", price: 300, type: "onetime", timeline: "3-5 dias" },
  "ecommerce": { name: "E-commerce", price: 997, type: "onetime", timeline: "10-15 dias" },
  "seo": { name: "SEO Posicionamiento", price: 397, type: "monthly", timeline: "resultados en 60-90 dias" },
  "redes-sociales": { name: "Gestion Redes Sociales", price: 297, type: "monthly", timeline: "resultados en 30 dias" },
  "meta-ads": { name: "Meta Ads", price: 297, type: "monthly", timeline: "resultados en 7 dias" },
  "google-ads": { name: "Google Ads", price: 397, type: "monthly", timeline: "resultados en 14 dias" },
  "branding": { name: "Branding Completo", price: 497, type: "onetime", timeline: "7-10 dias" },
  "chatbot-whatsapp": { name: "ChatBot WhatsApp", price: 197, type: "monthly", timeline: "3-5 dias setup" },
} as const;

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { action } = body;

  // --- Generate AI proposal for a lead ---
  if (action === "generate") {
    const { lead_id } = body;
    if (!lead_id) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

    // Fetch lead data
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    updateAgentStatus("sage", "working", `Generando propuesta para ${lead.name}`);

    const sageAnalysis = lead.sage_analysis || {};
    const recommendedServices = sageAnalysis.recommended_services || [];

    // Calculate pricing from catalog
    let totalOnetime = 0;
    let totalMonthly = 0;
    const services: { name: string; price: number; type: string; timeline: string }[] = [];

    for (const svc of recommendedServices) {
      const key = Object.keys(SERVICE_CATALOG).find(
        (k) => SERVICE_CATALOG[k as keyof typeof SERVICE_CATALOG].name.toLowerCase().includes(svc.toLowerCase())
      );
      if (key) {
        const catalog = SERVICE_CATALOG[key as keyof typeof SERVICE_CATALOG];
        services.push({ name: catalog.name, price: catalog.price, type: catalog.type, timeline: catalog.timeline });
        if (catalog.type === "onetime") totalOnetime += catalog.price;
        else totalMonthly += catalog.price;
      }
    }

    // Generate proposal content with AI
    let proposalContent = null;
    if (CLAUDE_API_KEY) {
      try {
        const prompt = `Eres Sage, Chief Strategy Officer de PACAME.

Genera una propuesta comercial para este lead:

LEAD:
- Nombre: ${lead.name}
- Empresa: ${lead.business_name || "No especificado"}
- Sector: ${lead.sector || "General"}
- Ciudad: ${lead.city || "Espana"}
- Mensaje: ${lead.message || "Sin mensaje"}
- Score: ${lead.score || "3"}/5
- Servicios recomendados: ${recommendedServices.join(", ") || "Por determinar"}

SERVICIOS Y PRECIOS:
${services.map((s) => `- ${s.name}: ${s.price}EUR (${s.type === "onetime" ? "unico" : "mensual"}) — ${s.timeline}`).join("\n")}

Total unico: ${totalOnetime}EUR | Total mensual: ${totalMonthly}EUR/mes

GENERA UNA PROPUESTA con:
1. Saludo personalizado (2-3 frases, cercano, sin servilismo)
2. Diagnostico del negocio (que hemos detectado, 3-4 puntos)
3. Solucion propuesta (que haremos exactamente, paso a paso)
4. Timeline concreto (semana a semana)
5. Inversion detallada (desglose + total)
6. Garantia (satisfaccion o devolucion)
7. Proximo paso (CTA claro)

Tono: directo, cercano, espanol de Espana, tutea. Sin frases de chatbot.

Responde SOLO JSON:
{
  "title": "titulo corto de la propuesta",
  "greeting": "saludo personalizado",
  "diagnosis": ["punto 1", "punto 2", "punto 3"],
  "solution": ["paso 1", "paso 2", "paso 3"],
  "timeline": [{"week": "Semana 1", "tasks": "..."}],
  "deliverables": ["entregable 1", "entregable 2"],
  "guarantee": "texto de garantia",
  "cta": "proximo paso"
}`;

        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2000,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;
        if (jsonStart >= 0) {
          proposalContent = JSON.parse(text.slice(jsonStart, jsonEnd));
        }
      } catch {
        // Continue without AI content
      }
    }

    // Save proposal to DB
    // Match actual DB schema: proposals table uses brief_original, sage_analysis, services_proposed, etc.
    const { data: proposal, error } = await supabase.from("proposals").insert({
      lead_id,
      brief_original: lead.problem || lead.message || `Propuesta para ${lead.business_name || lead.name}`,
      sage_analysis: {
        title: proposalContent?.title || `Propuesta para ${lead.business_name || lead.name}`,
        greeting: proposalContent?.greeting || "",
        diagnosis: proposalContent?.diagnosis || [],
        solution: proposalContent?.solution || [],
        timeline: proposalContent?.timeline || [],
        deliverables: proposalContent?.deliverables || services.map((s) => s.name),
        guarantee: proposalContent?.guarantee || "Satisfaccion garantizada o devolucion del 100%",
        cta: proposalContent?.cta || "Contacta con nosotros para empezar",
      },
      services_proposed: services.map((s) => ({ name: s.name, price: s.price, type: s.type })),
      total_onetime: totalOnetime,
      total_monthly: totalMonthly,
      status: "ready",
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    logAgentActivity({
      agentId: "sage",
      type: "delivery",
      title: `Propuesta generada: ${lead.name}`,
      description: `${services.length} servicios. Total: ${totalOnetime}EUR + ${totalMonthly}EUR/mes. Pendiente de revision.`,
      metadata: { proposal_id: proposal.id, lead_id, services: services.map((s) => s.name) },
    });

    // Neural: SAGE genera propuesta (colabora con COPY para redaccion)
    fireSynapse("dios", "sage", "orchestrates", true);
    fireSynapse("sage", "copy", "consults", true);
    recordStimulus({ targetAgent: "sage", source: "system", signal: `propuesta_generada:${lead.name}:${totalOnetime + totalMonthly}EUR`, intensity: 0.8 });
    rememberMemory({
      agentId: "sage",
      type: "procedural",
      title: `Propuesta: ${lead.name}`,
      content: `${services.length} servicios por ${totalOnetime}€ + ${totalMonthly}€/mes. Lead: ${lead.business_name || lead.name}.`,
      importance: 0.7,
      tags: ["propuesta", "generada"],
    });

    updateAgentStatus("sage", "idle");

    return NextResponse.json({
      proposal,
      content: proposalContent,
      pricing: { onetime: totalOnetime, monthly: totalMonthly, services },
    });
  }

  // --- List proposals ---
  if (action === "list") {
    const { status, lead_id } = body;
    let query = supabase.from("proposals").select("*").order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (lead_id) query = query.eq("lead_id", lead_id);

    const { data } = await query.limit(body.limit || 20);
    return NextResponse.json({ proposals: data || [] });
  }

  // --- Update proposal status ---
  if (action === "update_status") {
    const { proposal_id, status } = body;
    if (!proposal_id || !status) {
      return NextResponse.json({ error: "proposal_id and status required" }, { status: 400 });
    }

    const update: Record<string, unknown> = { status };
    if (status === "sent") update.sent_at = new Date().toISOString();
    if (status === "viewed") update.viewed_at = new Date().toISOString();
    if (status === "accepted" || status === "rejected") update.responded_at = new Date().toISOString();

    const { error } = await supabase.from("proposals").update(update).eq("id", proposal_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (status === "accepted") {
      logAgentActivity({
        agentId: "sage",
        type: "delivery",
        title: "Propuesta aceptada",
        description: `Propuesta ${proposal_id} aceptada. Iniciar onboarding.`,
      });
      // Neural: refuerzo positivo en toda la cadena de venta
      fireSynapse("sage", "dios", "reports_to", true);
      fireSynapse("sage", "copy", "collaborates_with", true);
      fireSynapse("sage", "nexus", "collaborates_with", true);
      rememberMemory({
        agentId: "sage",
        type: "emotional",
        title: `Victoria: propuesta ${proposal_id} aceptada`,
        content: "Propuesta aceptada por el cliente. Proceso de venta completado con exito.",
        importance: 0.9,
        tags: ["victoria", "propuesta_aceptada", "conversion"],
      });
    }
    if (status === "rejected") {
      // Neural: debilitar sinapsis (aprender del fallo)
      fireSynapse("sage", "copy", "collaborates_with", false);
      rememberMemory({
        agentId: "sage",
        type: "emotional",
        title: `Propuesta ${proposal_id} rechazada`,
        content: "Propuesta rechazada. Analizar razones para mejorar futuras propuestas.",
        importance: 0.6,
        tags: ["rechazo", "propuesta_rechazada", "mejora"],
      });
    }

    return NextResponse.json({ ok: true });
  }

  // --- Send proposal to lead (queue notification) ---
  if (action === "send") {
    const { proposal_id } = body;
    if (!proposal_id) return NextResponse.json({ error: "proposal_id required" }, { status: 400 });

    const { data: proposal } = await supabase
      .from("proposals")
      .select("*, leads(name, email, business_name)")
      .eq("id", proposal_id)
      .single();

    if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const lead = (proposal as Record<string, unknown>).leads as { name: string; email: string; business_name: string } | null;

    const sage = (proposal.sage_analysis || {}) as Record<string, unknown>;
    const proposalTitle = String(sage.title || `Propuesta para ${lead?.business_name || lead?.name}`);
    const services = (proposal.services_proposed || []) as Array<{ name: string; price: number; type: string }>;
    const proposalUrl = `https://pacameagencia.com/propuesta/${proposal_id}`;

    // Update status
    await supabase.from("proposals").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      preview_web_url: proposalUrl,
    }).eq("id", proposal_id);

    // Send actual email to the lead via Resend
    if (lead?.email) {
      const servicesHtml = services.map((s) =>
        `<li style="padding:4px 0"><strong>${s.name}</strong> — ${s.price}€${s.type === "monthly" ? "/mes" : ""}</li>`
      ).join("");

      const greeting = String(sage.greeting || `Hola ${lead.name},`);
      const guarantee = String(sage.guarantee || "Satisfaccion garantizada o devolucion del 100%.");

      const emailBody = `${greeting}

Tu propuesta personalizada esta lista. Aqui tienes un resumen:

<strong>Servicios propuestos:</strong>
<ul style="list-style:none;padding:0">${servicesHtml}</ul>

<strong>Inversion:</strong>
${Number(proposal.total_onetime) > 0 ? `<br>Puntual: <strong>${Number(proposal.total_onetime).toLocaleString("es-ES")}€</strong>` : ""}
${Number(proposal.total_monthly) > 0 ? `<br>Mensual: <strong>${Number(proposal.total_monthly).toLocaleString("es-ES")}€/mes</strong>` : ""}

<strong>Garantia:</strong> ${guarantee}

Haz click abajo para ver la propuesta completa con todos los detalles.

Si tienes cualquier duda, respondeme directamente a este email o escribeme por WhatsApp al +34 722 669 381.

Un saludo,
Pablo Calleja
PACAME`;

      await sendEmail({
        to: lead.email,
        subject: `${lead.name}, tu propuesta de PACAME esta lista`,
        html: wrapEmailTemplate(emailBody, {
          cta: "Ver propuesta completa",
          ctaUrl: proposalUrl,
          preheader: `${proposalTitle} — ${Number(proposal.total_onetime)}€ + ${Number(proposal.total_monthly)}€/mes`,
        }),
        tags: [
          { name: "type", value: "proposal" },
          { name: "proposal_id", value: proposal_id },
        ],
      });
    }

    // Notify Pablo
    notifyPablo(
      `Propuesta enviada: ${lead?.name || "Lead"}`,
      wrapEmailTemplate(
        `Propuesta "${proposalTitle}" enviada a ${lead?.email || "sin email"}.\n\n` +
        `Valor: ${proposal.total_onetime}€ + ${proposal.total_monthly}€/mes\n` +
        `Servicios: ${services.map((s) => s.name).join(", ")}`,
        { cta: "Ver en dashboard", ctaUrl: "https://pacameagencia.com/dashboard/proposals" }
      )
    );

    // Enqueue post-proposal nurture sequence
    try {
      await fetch(new URL("/api/nurture", request.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enqueue",
          lead_id: proposal.lead_id,
          sequence_id: "post_proposal",
        }),
      });
    } catch {
      // Non-blocking
    }

    logAgentActivity({
      agentId: "sage",
      type: "delivery",
      title: `Propuesta enviada a ${lead?.name || "lead"}`,
      description: `${proposal.total_onetime}EUR + ${proposal.total_monthly}EUR/mes. Email enviado + secuencia de cierre activada.`,
    });

    // Neural: SAGE delega nurturing post-propuesta a NEXUS
    fireSynapse("sage", "nexus", "delegates_to", true);
    recordStimulus({ targetAgent: "nexus", source: "agent", signal: `propuesta_enviada:${lead?.name}`, intensity: 0.7 });

    return NextResponse.json({ ok: true, email_sent: !!lead?.email });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
