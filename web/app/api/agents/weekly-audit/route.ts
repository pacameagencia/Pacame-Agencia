import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity, updateAgentStatus } from "@/lib/agent-logger";
import { verifyInternalAuth } from "@/lib/api-auth";
import { notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import { alertPablo } from "@/lib/telegram";

export const maxDuration = 300;

const supabase = createServerSupabase();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

/**
 * DIOS Weekly Audit — Meta-analysis of all agent activity
 * Called by Vercel cron every Monday at 8:00 AM
 * Generates a comprehensive weekly report and sends it as a notification to Pablo
 */

// GET handler for Vercel cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runWeeklyAudit();
}

export async function POST(_request: NextRequest) {
  const authError = verifyInternalAuth(_request);
  if (authError) return authError;

  return runWeeklyAudit();
}

async function runWeeklyAudit() {
  try {
    updateAgentStatus("dios", "working", "Auditoria semanal DIOS");

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    // Collect data from all sources in parallel
    const [
      leadsRes,
      wonLeadsRes,
      lostLeadsRes,
      proposalsRes,
      acceptedProposalsRes,
      contentRes,
      activitiesRes,
      referralsRes,
      commissionsRes,
      notificationsRes,
    ] = await Promise.all([
      supabase.from("leads").select("id, score, status, source", { count: "exact" }).gte("created_at", weekAgo),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "won").gte("updated_at", weekAgo),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "lost").gte("updated_at", weekAgo),
      supabase.from("proposals").select("id, total_onetime, total_monthly, status", { count: "exact" }).gte("created_at", weekAgo),
      supabase.from("proposals").select("id, total_onetime, total_monthly", { count: "exact" }).eq("status", "accepted").gte("updated_at", weekAgo),
      supabase.from("content").select("id, platform, status", { count: "exact" }).gte("created_at", weekAgo),
      supabase.from("agent_activities").select("agent_id, type").gte("created_at", weekAgo),
      supabase.from("referrals").select("id, status", { count: "exact" }).gte("created_at", weekAgo),
      supabase.from("commissions").select("id, amount", { count: "exact" }).gte("created_at", weekAgo),
      supabase.from("notifications").select("id, read", { count: "exact" }).eq("read", false),
    ]);

    // Process metrics
    const newLeads = leadsRes.count || 0;
    const wonLeads = wonLeadsRes.count || 0;
    const lostLeads = lostLeadsRes.count || 0;
    const hotLeads = (leadsRes.data || []).filter((l) => l.score >= 4).length;
    const leadSources = (leadsRes.data || []).reduce((acc: Record<string, number>, l) => {
      acc[l.source || "unknown"] = (acc[l.source || "unknown"] || 0) + 1;
      return acc;
    }, {});

    const newProposals = proposalsRes.count || 0;
    const acceptedProposals = acceptedProposalsRes.count || 0;
    const proposalRevenue = (acceptedProposalsRes.data || []).reduce(
      (sum, p) => sum + (Number(p.total_onetime) || 0) + (Number(p.total_monthly) || 0) * 12,
      0
    );
    const conversionRate = newProposals > 0 ? Math.round((acceptedProposals / newProposals) * 100) : 0;

    const contentCreated = contentRes.count || 0;
    const newReferrals = referralsRes.count || 0;
    const convertedReferrals = (referralsRes.data || []).filter((r) => r.status === "converted").length;
    const totalCommissions = (commissionsRes.data || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const unreadNotifications = notificationsRes.count || 0;

    // Agent activity breakdown
    const agentActivity = (activitiesRes.data || []).reduce((acc: Record<string, number>, a) => {
      acc[a.agent_id] = (acc[a.agent_id] || 0) + 1;
      return acc;
    }, {});

    // Build report
    const report = {
      period: { start: weekAgo, end: now },
      leads: {
        new: newLeads,
        hot: hotLeads,
        won: wonLeads,
        lost: lostLeads,
        sources: leadSources,
      },
      proposals: {
        created: newProposals,
        accepted: acceptedProposals,
        conversion_rate: conversionRate,
        revenue_annualized: proposalRevenue,
      },
      content: {
        created: contentCreated,
      },
      referrals: {
        new: newReferrals,
        converted: convertedReferrals,
        commissions: totalCommissions,
      },
      agents: {
        activities: agentActivity,
      },
      health: {
        unread_notifications: unreadNotifications,
      },
    };

    // Generate AI summary if API key available
    let aiSummary = "";
    if (CLAUDE_API_KEY) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 600,
            messages: [{
              role: "user",
              content: `Eres DIOS, el orquestador de PACAME agencia digital. Genera un informe semanal ejecutivo para Pablo (CEO).

DATOS DE LA SEMANA:
${JSON.stringify(report, null, 2)}

Genera un resumen en espanol de 5-8 lineas con:
1. Titulo con emoji que refleje el estado (ej: "Semana fuerte" o "Atencion requerida")
2. KPIs principales en numeros
3. Que fue bien esta semana
4. Que necesita atencion
5. Accion prioritaria para la proxima semana

Tono: directo, ejecutivo, sin rodeos. Tutea a Pablo.`,
            }],
          }),
        });

        const data = await res.json();
        aiSummary = data.content?.[0]?.text || "";
      } catch {
        // Continue without AI summary
      }
    }

    // Fallback summary
    if (!aiSummary) {
      aiSummary = `INFORME SEMANAL PACAME

Leads: ${newLeads} nuevos (${hotLeads} calientes), ${wonLeads} ganados, ${lostLeads} perdidos
Propuestas: ${newProposals} creadas, ${acceptedProposals} aceptadas (${conversionRate}% conversion)
Valor cerrado: ${proposalRevenue.toLocaleString("es-ES")}€ (anualizado)
Contenido: ${contentCreated} piezas generadas
Referidos: ${newReferrals} nuevos, ${convertedReferrals} convertidos
Comisiones: ${totalCommissions.toLocaleString("es-ES")}€
Notificaciones sin leer: ${unreadNotifications}`;
    }

    // Save report as notification
    await supabase.from("notifications").insert({
      type: "weekly_audit",
      priority: "high",
      title: "Informe Semanal DIOS",
      message: aiSummary,
      data: report,
    });

    // Send weekly report to Pablo via email
    const emailBody = aiSummary.replace(/\n/g, "<br>") +
      `<br><br><strong>Resumen rapido:</strong><br>` +
      `• Leads: ${newLeads} nuevos (${hotLeads} calientes), ${wonLeads} ganados<br>` +
      `• Propuestas: ${newProposals} creadas, ${acceptedProposals} aceptadas (${conversionRate}%)<br>` +
      `• Valor cerrado: ${proposalRevenue.toLocaleString("es-ES")}€ anualizado<br>` +
      `• Contenido: ${contentCreated} piezas generadas<br>` +
      `• Referidos: ${newReferrals} nuevos, ${convertedReferrals} convertidos`;

    notifyPablo(
      `Informe Semanal PACAME — ${newLeads} leads, ${wonLeads} ganados`,
      wrapEmailTemplate(emailBody, {
        cta: "Ver Dashboard",
        ctaUrl: "https://pacameagencia.com/dashboard",
        preheader: `${newLeads} leads, ${acceptedProposals} propuestas aceptadas, ${proposalRevenue}€ valor`,
      })
    );

    // Send Telegram summary
    const telegramMsg = `Leads: ${newLeads} (${hotLeads} hot), ${wonLeads} won\n` +
      `Propuestas: ${newProposals} → ${acceptedProposals} aceptadas (${conversionRate}%)\n` +
      `Valor: ${proposalRevenue.toLocaleString("es-ES")}€\n` +
      `Contenido: ${contentCreated} piezas`;
    alertPablo("Informe Semanal DIOS", telegramMsg, "normal");

    // Log the audit
    logAgentActivity({
      agentId: "dios",
      type: "insight",
      title: "Auditoria semanal completada",
      description: `Leads: ${newLeads} | Propuestas: ${newProposals} (${conversionRate}% conv) | Valor: ${proposalRevenue.toLocaleString("es-ES")}€ | Contenido: ${contentCreated}`,
      metadata: report,
    });

    updateAgentStatus("dios", "idle");

    return NextResponse.json({
      ok: true,
      report,
      summary: aiSummary,
    });
  } catch (error) {
    updateAgentStatus("dios", "idle");
    const message = error instanceof Error ? error.message : "Error en auditoria semanal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
