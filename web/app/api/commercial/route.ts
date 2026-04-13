import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity, updateAgentStatus } from "@/lib/agent-logger";
import { sendEmail, notifyPablo, wrapEmailTemplate } from "@/lib/resend";

const supabase = createServerSupabase();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

/**
 * Commercial Pipeline API
 *
 * Orchestrates the full sales funnel:
 * 1. send_outreach — Send cold email to scraped lead
 * 2. send_followup — Send follow-up to non-responders
 * 3. process_pipeline — Auto-process leads at each stage
 * 4. funnel_stats — Get conversion metrics
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // --- Send outreach email to a lead ---
  if (action === "send_outreach") {
    const { lead_id, email_number = 1 } = body;
    if (!lead_id) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (!lead.email) return NextResponse.json({ error: "Lead has no email" }, { status: 400 });

    const sageAnalysis = (lead.sage_analysis || {}) as Record<string, unknown>;
    const outreachEmails = sageAnalysis.outreach_emails as Record<string, { subject: string; body: string }> | undefined;

    if (!outreachEmails) {
      return NextResponse.json({ error: "No outreach emails generated for this lead. Run leadgen outreach first." }, { status: 400 });
    }

    const emailKey = `email_${email_number}`;
    const emailData = outreachEmails[emailKey];
    if (!emailData) {
      return NextResponse.json({ error: `Email ${email_number} not found` }, { status: 400 });
    }

    // Send via Resend
    const emailId = await sendEmail({
      to: lead.email,
      subject: emailData.subject,
      html: wrapEmailTemplate(emailData.body, {
        cta: "Diagnostico gratuito",
        ctaUrl: "https://pacameagencia.com/contacto",
        preheader: `${lead.business_name || lead.name} — oportunidad digital`,
      }),
      tags: [
        { name: "type", value: "outreach" },
        { name: "lead_id", value: lead_id },
        { name: "email_number", value: String(email_number) },
      ],
    });

    if (!emailId) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    // Update lead status and track outreach
    const outreachHistory = (sageAnalysis.outreach_history || []) as Array<Record<string, unknown>>;
    outreachHistory.push({
      email_number,
      sent_at: new Date().toISOString(),
      resend_id: emailId,
      subject: emailData.subject,
    });

    await supabase.from("leads").update({
      status: lead.status === "new" ? "contacted" : lead.status,
      sage_analysis: {
        ...sageAnalysis,
        outreach_history: outreachHistory,
        last_outreach_at: new Date().toISOString(),
        outreach_count: outreachHistory.length,
      },
    }).eq("id", lead_id);

    logAgentActivity({
      agentId: "copy",
      type: "delivery",
      title: `Outreach enviado: ${lead.name}`,
      description: `Email ${email_number}/3 enviado a ${lead.email}. Asunto: "${emailData.subject}"`,
      metadata: { lead_id, email_number, resend_id: emailId },
    });

    return NextResponse.json({ ok: true, email_id: emailId, email_number });
  }

  // --- Batch send outreach to multiple leads ---
  if (action === "batch_outreach") {
    const { lead_ids, email_number = 1 } = body;
    if (!lead_ids?.length) return NextResponse.json({ error: "lead_ids required" }, { status: 400 });
    if (lead_ids.length > 100) return NextResponse.json({ error: "Maximo 100 leads por batch" }, { status: 400 });

    updateAgentStatus("copy", "working", `Enviando outreach batch: ${lead_ids.length} leads`);

    let sent = 0;
    let failed = 0;
    const baseUrl = request.nextUrl.origin;

    for (const leadId of lead_ids) {
      try {
        const res = await fetch(`${baseUrl}/api/commercial`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send_outreach", lead_id: leadId, email_number }),
        });
        if (res.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }

      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    updateAgentStatus("copy", "idle");

    notifyPablo(
      `Outreach batch completado`,
      wrapEmailTemplate(
        `Campaña de outreach completada:\n\n` +
        `Enviados: <strong>${sent}</strong>\n` +
        `Fallidos: <strong>${failed}</strong>\n` +
        `Email #${email_number} de la secuencia`,
        { cta: "Ver leads", ctaUrl: "https://pacameagencia.com/dashboard/leads" }
      )
    );

    return NextResponse.json({ ok: true, sent, failed, total: lead_ids.length });
  }

  // --- Process pipeline: auto follow-up non-responders ---
  if (action === "process_pipeline") {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Find leads that were contacted but haven't responded
    const { data: contactedLeads } = await supabase
      .from("leads")
      .select("id, name, email, sage_analysis")
      .eq("source", "outbound")
      .eq("status", "contacted")
      .limit(50);

    const baseUrl = request.nextUrl.origin;
    let followUpsSent = 0;

    for (const lead of contactedLeads || []) {
      const analysis = (lead.sage_analysis || {}) as Record<string, unknown>;
      const lastOutreach = analysis.last_outreach_at as string | undefined;
      const outreachCount = (analysis.outreach_count || 0) as number;
      const outreachEmails = analysis.outreach_emails as Record<string, unknown> | undefined;

      if (!lastOutreach || !outreachEmails || !lead.email) continue;

      // Send follow-up email 2 after 3 days, email 3 after 7 days
      const nextEmailNumber = outreachCount + 1;
      if (nextEmailNumber > 3) continue; // Max 3 emails

      const minDelay = nextEmailNumber === 2 ? threeDaysAgo : sevenDaysAgo;
      if (lastOutreach > minDelay) continue; // Not enough time has passed

      try {
        const res = await fetch(`${baseUrl}/api/commercial`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send_outreach",
            lead_id: lead.id,
            email_number: nextEmailNumber,
          }),
        });
        if (res.ok) followUpsSent++;
      } catch {
        // Non-blocking
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    // Auto-generate proposals for hot leads (score >= 4)
    const { data: hotLeads } = await supabase
      .from("leads")
      .select("id, name")
      .gte("score", 4)
      .in("status", ["qualified", "contacted"])
      .is("sage_analysis->proposal_generated", null)
      .limit(5);

    let proposalsGenerated = 0;
    for (const lead of hotLeads || []) {
      try {
        const res = await fetch(`${baseUrl}/api/proposals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate", lead_id: lead.id }),
        });
        if (res.ok) {
          proposalsGenerated++;
          // Mark proposal as generated in lead analysis
          await supabase.from("leads").update({
            sage_analysis: {
              ...(lead as Record<string, unknown>).sage_analysis as Record<string, unknown>,
              proposal_generated: true,
              proposal_generated_at: new Date().toISOString(),
            },
          }).eq("id", lead.id);
        }
      } catch {
        // Non-blocking
      }
    }

    logAgentActivity({
      agentId: "sage",
      type: "task_completed",
      title: "Pipeline comercial procesado",
      description: `Follow-ups: ${followUpsSent}. Propuestas generadas: ${proposalsGenerated}.`,
      metadata: { followups: followUpsSent, proposals: proposalsGenerated },
    });

    return NextResponse.json({
      ok: true,
      followups_sent: followUpsSent,
      proposals_generated: proposalsGenerated,
    });
  }

  // --- Get funnel stats ---
  if (action === "funnel_stats") {
    const [newLeads, contacted, qualified, proposals, accepted, clients] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "contacted"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "qualified"),
      supabase.from("proposals").select("id", { count: "exact", head: true }).in("status", ["ready", "sent", "viewed"]),
      supabase.from("proposals").select("id", { count: "exact", head: true }).eq("status", "accepted"),
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    // Revenue metrics
    const { data: revenueData } = await supabase
      .from("finances")
      .select("amount")
      .eq("type", "income")
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const monthlyRevenue = (revenueData || []).reduce((sum, f) => sum + Number(f.amount || 0), 0);

    // Outbound metrics
    const { data: outboundLeads } = await supabase
      .from("leads")
      .select("sage_analysis")
      .eq("source", "outbound")
      .limit(200);

    const totalOutreachSent = (outboundLeads || []).reduce((sum, l) => {
      const analysis = (l.sage_analysis || {}) as Record<string, unknown>;
      return sum + ((analysis.outreach_count || 0) as number);
    }, 0);

    return NextResponse.json({
      funnel: {
        new: newLeads.count || 0,
        contacted: contacted.count || 0,
        qualified: qualified.count || 0,
        proposals: proposals.count || 0,
        accepted: accepted.count || 0,
        clients: clients.count || 0,
      },
      metrics: {
        monthly_revenue: monthlyRevenue,
        total_outreach_sent: totalOutreachSent,
        outbound_leads: outboundLeads?.length || 0,
      },
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
