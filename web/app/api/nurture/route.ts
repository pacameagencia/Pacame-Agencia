import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sequences } from "@/lib/data/email-sequences";
import { logAgentActivity } from "@/lib/agent-logger";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import { verifyInternalAuth } from "@/lib/api-auth";
import { llmChat, extractJSON } from "@/lib/llm";

const supabase = createServerSupabase();

// Interpolate template variables
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}

// POST: Trigger nurturing actions
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { action } = body;

  // --- Enqueue a lead into a sequence ---
  if (action === "enqueue") {
    const { lead_id, sequence_id } = body;
    if (!lead_id || !sequence_id) {
      return NextResponse.json({ error: "lead_id and sequence_id required" }, { status: 400 });
    }

    const sequence = sequences.find((s) => s.id === sequence_id);
    if (!sequence) {
      return NextResponse.json({ error: `Sequence "${sequence_id}" not found` }, { status: 404 });
    }

    // Get lead data
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadErr || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Update lead nurturing status + store which sequence they're in
    await supabase.from("leads").update({
      status: "nurturing",
      nurturing_step: 0,
      nurture_sequence: sequence_id,
    }).eq("id", lead_id);

    // Schedule first email (immediate)
    const firstEmail = sequence.emails[0];
    const sageAnalysis = (lead.sage_analysis || {}) as Record<string, unknown>;
    const vars: Record<string, string> = {
      name: lead.name || "amigo",
      email: lead.email || "",
      business_name: lead.business_name || "tu negocio",
      proposal_url: (sageAnalysis.proposal_url as string) || "https://pacameagencia.com/dashboard/proposals",
      services: (sageAnalysis.recommended_services as string[])?.join(", ") || "servicios digitales",
      total_price: (sageAnalysis.estimated_value_onetime as string) || "personalizado",
      timeline: (sageAnalysis.timeline as string) || "5-10 dias",
      brief_summary: (sageAnalysis.brief_summary as string) || "tu proyecto personalizado",
      project_type: (sageAnalysis.project_type as string) || "proyecto",
      review_url: "https://pacameagencia.com/review/" + lead_id,
    };

    const subject = interpolate(firstEmail.subject, vars);
    const emailBody = interpolate(firstEmail.body, vars);

    // Send email via Resend
    let resendId: string | null = null;
    if (lead.email) {
      const html = wrapEmailTemplate(emailBody, {
        cta: firstEmail.cta.text,
        ctaUrl: firstEmail.cta.url,
        preheader: subject,
      });
      resendId = await sendEmail({
        to: lead.email,
        subject,
        html,
        tags: [
          { name: "type", value: "nurture" },
          { name: "lead_id", value: lead_id },
        ],
      });
    }

    // Also store in notifications for dashboard visibility
    await supabase.from("notifications").insert({
      type: "nurture_email",
      priority: "normal",
      title: `Email nurturing: ${subject}`,
      message: emailBody,
      sent: !!resendId,
      sent_at: resendId ? new Date().toISOString() : null,
      sent_via: resendId ? "resend" : null,
      data: {
        lead_id,
        sequence_id,
        email_id: firstEmail.id,
        step: 0,
        to_email: lead.email,
        subject,
        cta: firstEmail.cta,
        resend_email_id: resendId,
      },
    });

    // Log to Oficina
    logAgentActivity({
      agentId: "nexus",
      type: "task_started",
      title: `Nurturing: ${lead.name}`,
      description: `Secuencia "${sequence.name}" iniciada. Email 1/${sequence.emails.length} enviado.`,
      metadata: { lead_id, sequence_id },
    });

    return NextResponse.json({
      ok: true,
      lead_id,
      sequence: sequence.name,
      emails_total: sequence.emails.length,
      first_email_subject: subject,
    });
  }

  // --- Process next step (called by cron/n8n) ---
  if (action === "process_pending") {
    // Find leads in nurturing that need their next email
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "nurturing")
      .order("updated_at", { ascending: true })
      .limit(20);

    if (!leads?.length) {
      return NextResponse.json({ processed: 0, message: "No pending nurturing leads" });
    }

    let processed = 0;

    for (const lead of leads) {
      const step = (lead.nurturing_step || 0) + 1;
      const sequenceId = lead.nurture_sequence || "welcome";
      const sequence = sequences.find((s) => s.id === sequenceId);
      if (!sequence || step >= sequence.emails.length) {
        // Sequence complete — move to qualified
        await supabase.from("leads").update({
          status: "qualified",
          nurturing_step: step,
        }).eq("id", lead.id);
        continue;
      }

      const email = sequence.emails[step];
      const hoursSinceLastContact = lead.last_contacted_at
        ? (Date.now() - new Date(lead.last_contacted_at).getTime()) / 3600000
        : Infinity;

      // Check if enough time has passed
      if (hoursSinceLastContact < email.delay_hours) continue;

      // Build template vars — include proposal data if available
      const sageAnalysis = (lead.sage_analysis || {}) as Record<string, unknown>;
      const vars: Record<string, string> = {
        name: lead.name || "amigo",
        email: lead.email || "",
        business_name: lead.business_name || "tu negocio",
        proposal_url: (sageAnalysis.proposal_url as string) || "https://pacameagencia.com/dashboard/proposals",
        services: (sageAnalysis.recommended_services as string[])?.join(", ") || "servicios digitales",
        total_price: (sageAnalysis.estimated_value_onetime as string) || "personalizado",
        timeline: (sageAnalysis.timeline as string) || "5-10 dias",
        brief_summary: (sageAnalysis.brief_summary as string) || "tu proyecto personalizado",
        project_type: (sageAnalysis.project_type as string) || "proyecto",
        review_url: "https://pacameagencia.com/review/" + lead.id,
      };

      const subject = interpolate(email.subject, vars);
      const emailBody = interpolate(email.body, vars);

      // Send email via Resend
      let resendId: string | null = null;
      if (lead.email) {
        const html = wrapEmailTemplate(emailBody, {
          cta: email.cta.text,
          ctaUrl: email.cta.url,
          preheader: subject,
        });
        resendId = await sendEmail({
          to: lead.email,
          subject,
          html,
          tags: [
            { name: "type", value: "nurture" },
            { name: "lead_id", value: lead.id },
          ],
        });
      }

      // Store in notifications for dashboard
      await supabase.from("notifications").insert({
        type: "nurture_email",
        priority: "normal",
        title: `Email nurturing: ${subject}`,
        message: emailBody,
        sent: !!resendId,
        sent_at: resendId ? new Date().toISOString() : null,
        sent_via: resendId ? "resend" : null,
        data: {
          lead_id: lead.id,
          sequence_id: sequenceId,
          email_id: email.id,
          step,
          to_email: lead.email,
          subject,
          cta: email.cta,
          resend_email_id: resendId,
        },
      });

      // Update lead
      await supabase.from("leads").update({
        nurturing_step: step,
        last_contacted_at: new Date().toISOString(),
      }).eq("id", lead.id);

      processed++;
    }

    if (processed > 0) {
      logAgentActivity({
        agentId: "nexus",
        type: "task_completed",
        title: `Nurturing batch procesado`,
        description: `${processed} emails de nurturing enviados.`,
      });
    }

    return NextResponse.json({ processed });
  }

  // --- Personalize email with AI ---
  if (action === "personalize") {
    const { lead_id, email_template, context } = body;

    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const prompt = `Eres Copy, el copywriter de PACAME.

Personaliza este email de nurturing para el siguiente lead:

LEAD:
- Nombre: ${lead.name}
- Negocio: ${lead.business_name || "No especificado"}
- Tipo: ${lead.business_type || "No especificado"}
- Servicios solicitados: ${lead.sage_analysis?.services || "No especificado"}
- Presupuesto: ${lead.budget || "No especificado"}

PLANTILLA ORIGINAL:
Asunto: ${email_template.subject}
Cuerpo: ${email_template.body}

${context ? `CONTEXTO ADICIONAL: ${context}` : ""}

REGLAS:
- Mantén el tono cercano de Pablo, tutea
- Personaliza referencias al negocio del lead
- Mantén la estructura y CTAs originales
- No cambies los enlaces
- Maximo 20% de cambio sobre el original

Responde SOLO JSON: {"subject": "...", "body": "..."}`;

    try {
      const res = await llmChat(
        [{ role: "user", content: prompt }],
        { tier: "economy", maxTokens: 1200 }
      );

      const personalized = extractJSON(res.content);
      return NextResponse.json({ personalized, tokens: res.tokensOut, provider: res.provider });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // --- Get sequence info ---
  if (action === "list_sequences") {
    return NextResponse.json({
      sequences: sequences.map((s) => ({
        id: s.id,
        name: s.name,
        trigger: s.trigger,
        description: s.description,
        email_count: s.emails.length,
      })),
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
