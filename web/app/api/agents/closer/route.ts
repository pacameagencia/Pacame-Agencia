import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity, updateAgentStatus, incrementAgentTasks } from "@/lib/agent-logger";
import { sendEmail, notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import { alertPablo } from "@/lib/telegram";
import { llmChat, extractJSON } from "@/lib/llm";
import {
  fireSynapse, recordStimulus, rememberMemory,
  startThoughtChain, endThoughtChain, addChainStep, recallMemories,
} from "@/lib/neural";

const supabase = createServerSupabase();

/**
 * CLOSER — Cierre autonomo de ventas
 *
 * Cada 2h:
 * 1. Auto-enviar propuestas pendientes (status "ready")
 * 2. Followup escalonado post-propuesta
 * 3. Detectar senales de cierre
 * 4. Crear urgencia en leads calientes
 */
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;
  return runCloser();
}

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;
  return runCloser();
}

async function runCloser() {
  updateAgentStatus("sage", "working", "Cerrando ventas automaticamente");

  const chainId = await startThoughtChain({
    initiatingAgent: "sage",
    goal: "Cierre autonomo: enviar propuestas → followup → crear urgencia → cerrar",
    participatingAgents: ["sage", "copy", "nexus"],
  });

  const results: Record<string, unknown> = {};

  try {
    let proposalsSent = 0;
    let followupsSent = 0;
    let urgencyAlerts = 0;

    // Cargar memorias de cierre
    const sageMemories = await recallMemories("sage", {
      limit: 3,
      minImportance: 0.5,
      tags: ["cierre", "propuesta", "victoria"],
    });
    const closingContext = sageMemories.length
      ? sageMemories.map(m => `- ${m.title}`).join("\n")
      : "";

    // =============================================
    // 1. AUTO-ENVIAR PROPUESTAS PENDIENTES
    // =============================================
    if (chainId) await addChainStep(chainId);

    const { data: readyProposals } = await supabase
      .from("proposals")
      .select("id, lead_id, sage_analysis, services_proposed, total_onetime, total_monthly")
      .eq("status", "ready")
      .order("created_at", { ascending: true })
      .limit(5);

    for (const proposal of readyProposals || []) {
      try {
        // Obtener datos del lead
        const { data: lead } = await supabase
          .from("leads")
          .select("name, email, business_name, score")
          .eq("id", proposal.lead_id)
          .single();

        if (!lead?.email) continue;

        const sage = (proposal.sage_analysis || {}) as Record<string, unknown>;
        const services = (proposal.services_proposed || []) as Array<{ name: string; price: number; type: string }>;
        const proposalUrl = `https://pacameagencia.com/propuesta/${proposal.id}`;

        // Enviar email con propuesta
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

Haz click abajo para ver la propuesta completa.

Si tienes dudas, respondeme a este email o escribeme por WhatsApp al +34 722 669 381.

Un saludo,
Pablo Calleja
PACAME`;

        const emailId = await sendEmail({
          to: lead.email,
          subject: `${lead.name}, tu propuesta de PACAME esta lista`,
          html: wrapEmailTemplate(emailBody, {
            cta: "Ver propuesta completa",
            ctaUrl: proposalUrl,
            preheader: `${Number(proposal.total_onetime)}€ + ${Number(proposal.total_monthly)}€/mes`,
          }),
          tags: [
            { name: "type", value: "proposal" },
            { name: "proposal_id", value: proposal.id },
          ],
        });

        if (emailId) {
          // Actualizar propuesta
          await supabase.from("proposals").update({
            status: "sent",
            sent_at: new Date().toISOString(),
            preview_web_url: proposalUrl,
          }).eq("id", proposal.id);

          // Guardar en conversations
          await supabase.from("conversations").insert({
            lead_id: proposal.lead_id,
            channel: "email",
            direction: "outbound",
            sender: "pacame",
            message: `Propuesta enviada: ${services.map(s => s.name).join(", ")}. Total: ${proposal.total_onetime}€ + ${proposal.total_monthly}€/mes`,
            message_type: "text",
            mode: "auto",
            metadata: { resend_email_id: emailId, proposal_id: proposal.id, type: "proposal_sent" },
          });

          proposalsSent++;

          logAgentActivity({
            agentId: "sage",
            type: "delivery",
            title: `Propuesta auto-enviada: ${lead.business_name || lead.name}`,
            description: `${services.length} servicios. ${proposal.total_onetime}€ + ${proposal.total_monthly}€/mes.`,
            metadata: { proposal_id: proposal.id, lead_id: proposal.lead_id },
          });
        }
      } catch {
        // Non-blocking per proposal
      }
    }

    // =============================================
    // 2. FOLLOWUP ESCALONADO POST-PROPUESTA
    // =============================================
    if (chainId) await addChainStep(chainId);

    const { data: sentProposals } = await supabase
      .from("proposals")
      .select("id, lead_id, sent_at, viewed_at, total_onetime, total_monthly, services_proposed")
      .eq("status", "sent")
      .not("sent_at", "is", null)
      .order("sent_at", { ascending: true })
      .limit(20);

    for (const proposal of sentProposals || []) {
      const sentAt = new Date(proposal.sent_at as string);
      const hoursSinceSent = (Date.now() - sentAt.getTime()) / 3600000;

      // Obtener lead
      const { data: lead } = await supabase
        .from("leads")
        .select("name, email, business_name, score, last_contacted_at")
        .eq("id", proposal.lead_id)
        .single();

      if (!lead?.email) continue;

      // No contactar si ya se contacto hace menos de 20h
      if (lead.last_contacted_at) {
        const hoursSinceContact = (Date.now() - new Date(lead.last_contacted_at).getTime()) / 3600000;
        if (hoursSinceContact < 20) continue;
      }

      // Determinar paso del followup
      let followupStep: string | null = null;
      let followupTone = "";

      if (hoursSinceSent >= 120 && hoursSinceSent < 168) {
        followupStep = "last_chance";
        followupTone = "Ultimo recordatorio. Tono: urgencia real pero no desesperado. Menciona que estas reorganizando agenda y necesitas saber si cuenta con vosotros.";
      } else if (hoursSinceSent >= 72 && hoursSinceSent < 120) {
        followupStep = "special_offer";
        followupTone = "Ofrecer 10% descuento si confirma esta semana. Tono: generoso, como regalo por ser de los primeros.";
      } else if (hoursSinceSent >= 48 && hoursSinceSent < 72) {
        followupStep = "offer_call";
        followupTone = "Ofrecer llamada rapida para resolver dudas. Tono: servicial, cercano. Menciona que puedes llamarle en 5 min.";
      } else if (hoursSinceSent >= 24 && hoursSinceSent < 48) {
        followupStep = "soft_check";
        followupTone = "Comprobar si vio la propuesta. Tono: casual, ligero. Pregunta abierta.";
      }

      if (!followupStep) continue;

      // Priorizar leads que vieron la propuesta
      const viewed = !!proposal.viewed_at;

      try {
        const res = await llmChat(
          [{
            role: "user",
            content: `Eres Copy, copywriter de PACAME. Genera un email de followup post-propuesta.
${closingContext ? `\nVICTORIAS PREVIAS:\n${closingContext}\n` : ""}
LEAD: ${lead.business_name || lead.name}
PROPUESTA: ${Number(proposal.total_onetime)}€ + ${Number(proposal.total_monthly)}€/mes
ENVIADA HACE: ${Math.round(hoursSinceSent)}h
VIO LA PROPUESTA: ${viewed ? "SI" : "NO"}
PASO: ${followupStep}
TONO: ${followupTone}

REGLAS:
- Maximo 80 palabras
- Tutea, cercano, SIN ser pesado
- NO repitas el contenido de la propuesta
- ${viewed ? "Menciona que viste que abrio la propuesta" : "No menciones tracking"}
- Firma: Pablo Calleja, PACAME
- SIN emojis

Responde SOLO JSON: {"subject":"asunto","body":"cuerpo"}`,
          }],
          // skipGemma: email followup requiere tono PACAME y JSON limpio
          // Gemma e2b genera respuestas genericas y JSON con fences markdown
          { tier: "economy", maxTokens: 300, skipGemma: true }
        );

        const emailData = extractJSON(res.content);
        if (!emailData?.subject || !emailData?.body) continue;

        const emailId = await sendEmail({
          to: lead.email,
          subject: String(emailData.subject),
          html: wrapEmailTemplate(String(emailData.body) + "\n\n---\nPablo Calleja\nPACAME — pacameagencia.com", {
            cta: "Ver tu propuesta",
            ctaUrl: `https://pacameagencia.com/propuesta/${proposal.id}`,
          }),
          tags: [
            { name: "type", value: `followup_${followupStep}` },
            { name: "proposal_id", value: proposal.id },
          ],
        });

        if (emailId) {
          followupsSent++;

          // Guardar en conversations
          await supabase.from("conversations").insert({
            lead_id: proposal.lead_id,
            channel: "email",
            direction: "outbound",
            sender: "pacame",
            message: String(emailData.body),
            message_type: "text",
            mode: "auto",
            metadata: { resend_email_id: emailId, followup_step: followupStep, proposal_id: proposal.id },
          });

          // Actualizar last_contacted_at
          await supabase.from("leads").update({
            last_contacted_at: new Date().toISOString(),
          }).eq("id", proposal.lead_id);
        }
      } catch {
        // Non-blocking
      }

      // Delay entre followups
      await new Promise((r) => setTimeout(r, 2000));
    }

    // =============================================
    // 3. ALERTAS DE URGENCIA — leads calientes sin cerrar
    // =============================================
    if (chainId) await addChainStep(chainId);

    const { data: urgentLeads } = await supabase
      .from("proposals")
      .select("id, lead_id, sent_at, total_onetime, total_monthly")
      .eq("status", "sent")
      .not("sent_at", "is", null)
      .limit(20);

    for (const proposal of urgentLeads || []) {
      const sentAt = new Date(proposal.sent_at as string);
      const daysSinceSent = (Date.now() - sentAt.getTime()) / 86400000;

      if (daysSinceSent < 5) continue;

      // Lead caliente sin cerrar en 5+ dias
      const { data: lead } = await supabase
        .from("leads")
        .select("name, email, phone, business_name, score")
        .eq("id", proposal.lead_id)
        .single();

      if (!lead || (lead.score || 0) < 4) continue;

      // Verificar que no hemos alertado ya
      const { count: existingAlerts } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("type", "closing_urgency")
        .eq("data->>proposal_id", proposal.id);

      if ((existingAlerts || 0) > 0) continue;

      urgencyAlerts++;

      // Alerta Pablo — este necesita llamada
      await supabase.from("notifications").insert({
        type: "closing_urgency",
        priority: "high",
        title: `CERRAR: ${lead.business_name || lead.name} (${Number(proposal.total_onetime) + Number(proposal.total_monthly)}€)`,
        message: `Propuesta enviada hace ${Math.round(daysSinceSent)} dias sin respuesta. Score ${lead.score}/5. Llamar para cerrar.`,
        data: { proposal_id: proposal.id, lead_id: proposal.lead_id, phone: lead.phone },
      });

      alertPablo(
        `CERRAR: ${lead.business_name || lead.name}`,
        `Propuesta de ${Number(proposal.total_onetime)}€ + ${Number(proposal.total_monthly)}€/mes enviada hace ${Math.round(daysSinceSent)} dias. Score ${lead.score}/5. Llamale: ${lead.phone || "sin telefono"}`,
        "critical"
      );

      notifyPablo(
        `Oportunidad de cierre: ${lead.business_name || lead.name}`,
        wrapEmailTemplate(
          `<strong>Este lead necesita una llamada tuya para cerrar.</strong>\n\n` +
          `Lead: ${lead.business_name || lead.name}\n` +
          `Valor: ${Number(proposal.total_onetime)}€ + ${Number(proposal.total_monthly)}€/mes\n` +
          `Dias desde propuesta: ${Math.round(daysSinceSent)}\n` +
          `Telefono: ${lead.phone || "No disponible"}\n` +
          `Email: ${lead.email || "No disponible"}`,
          { cta: "Ver propuesta", ctaUrl: `https://pacameagencia.com/propuesta/${proposal.id}` }
        )
      );
    }

    // =============================================
    // 4. MARCAR PROPUESTAS ABANDONADAS (>14 dias sin respuesta)
    // =============================================
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data: abandoned } = await supabase
      .from("proposals")
      .select("id, lead_id")
      .eq("status", "sent")
      .lt("sent_at", twoWeeksAgo)
      .is("responded_at", null)
      .limit(10);

    let abandonedCount = 0;
    for (const p of abandoned || []) {
      await supabase.from("proposals").update({ status: "expired" }).eq("id", p.id);
      await supabase.from("leads").update({ status: "dormant" }).eq("id", p.lead_id);
      abandonedCount++;
    }

    // Neural
    recordStimulus({
      targetAgent: "sage",
      source: "cron",
      signal: `closer:${proposalsSent}sent:${followupsSent}followup:${urgencyAlerts}urgent`,
      intensity: proposalsSent > 0 || urgencyAlerts > 0 ? 0.8 : 0.4,
    });
    fireSynapse("dios", "sage", "orchestrates", true);
    if (followupsSent > 0) {
      fireSynapse("sage", "copy", "delegates_to", true);
    }

    rememberMemory({
      agentId: "sage",
      type: "procedural",
      title: `Closer ${new Date().toISOString().slice(0, 16)}: ${proposalsSent}P ${followupsSent}F ${urgencyAlerts}U`,
      content: `Propuestas enviadas: ${proposalsSent}. Followups: ${followupsSent}. Alertas urgencia: ${urgencyAlerts}. Abandonadas: ${abandonedCount}.`,
      importance: proposalsSent > 0 ? 0.6 : 0.3,
      tags: ["closer", "cierre", "automatico"],
    });

    if (chainId) {
      await endThoughtChain(
        chainId,
        `${proposalsSent} propuestas enviadas, ${followupsSent} followups, ${urgencyAlerts} alertas urgencia`,
        proposalsSent + followupsSent > 0 ? 0.8 : 0.4
      );
    }

    results.proposals_sent = proposalsSent;
    results.followups_sent = followupsSent;
    results.urgency_alerts = urgencyAlerts;
    results.abandoned = abandonedCount;

    if (proposalsSent > 0 || followupsSent > 0) {
      logAgentActivity({
        agentId: "sage",
        type: "task_completed",
        title: `Closer: ${proposalsSent} propuestas + ${followupsSent} followups`,
        description: `Auto-enviadas ${proposalsSent} propuestas. ${followupsSent} followups de cierre. ${urgencyAlerts} alertas urgencia para Pablo.`,
        metadata: results,
      });
      incrementAgentTasks("sage");
    }

  } catch (e) {
    if (chainId) await endThoughtChain(chainId, `Error: ${String(e)}`, 0, "abandoned");
    results.error = String(e);
  }

  updateAgentStatus("sage", "idle");

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
