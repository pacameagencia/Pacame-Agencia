import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { sendTelegram } from "@/lib/telegram";
import { notifyPablo, wrapEmailTemplate } from "@/lib/resend";

const supabase = createServerSupabase();

/**
 * Daily Digest — Summary of all agent work sent to Pablo
 * Called at the end of each cron cycle (3x/day)
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const results = body.results || {};

  // 1. Get today's activity summary
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: todayActivities } = await supabase
    .from("agent_activities")
    .select("agent_id, type, title")
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  // 2. Get new discoveries since last digest
  const { data: newDiscoveries } = await supabase
    .from("agent_discoveries")
    .select("agent_id, type, title, impact, suggested_action")
    .eq("status", "new")
    .gte("created_at", todayStart.toISOString())
    .order("impact", { ascending: false })
    .limit(10);

  // 3. Get key metrics
  const { count: leadsToday } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  const { count: contentGenerated } = await supabase
    .from("content")
    .select("id", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  const { count: proposalsToday } = await supabase
    .from("proposals")
    .select("id", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  // 4. Count activities by type
  const deliveries = (todayActivities || []).filter(a => a.type === "delivery").length;
  const alerts = (todayActivities || []).filter(a => a.type === "alert").length;
  const insights = (todayActivities || []).filter(a => a.type === "insight").length;
  const discoveries = (newDiscoveries || []).length;

  // 5. Build agent work summary
  const agentWork: Record<string, string[]> = {};
  for (const act of todayActivities || []) {
    if (!agentWork[act.agent_id]) agentWork[act.agent_id] = [];
    if (agentWork[act.agent_id].length < 3) {
      agentWork[act.agent_id].push(act.title);
    }
  }

  // 6. Format Telegram digest
  const hour = new Date().getUTCHours();
  const cycle = hour < 10 ? "manana" : hour < 16 ? "mediodia" : "tarde";

  let telegramMsg = `📊 <b>Digest ${cycle}</b>\n\n`;

  // Key numbers
  telegramMsg += `📈 Leads: ${leadsToday || 0} | Contenido: ${contentGenerated || 0} | Propuestas: ${proposalsToday || 0}\n`;
  telegramMsg += `✅ Entregas: ${deliveries} | 💡 Insights: ${insights}`;
  if (alerts > 0) telegramMsg += ` | ⚠️ Alertas: ${alerts}`;
  telegramMsg += "\n\n";

  // Agent highlights (top 5 most active)
  const activeAgents = Object.entries(agentWork)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  if (activeAgents.length > 0) {
    telegramMsg += "<b>Agentes:</b>\n";
    for (const [agent, tasks] of activeAgents) {
      telegramMsg += `• <b>${agent.toUpperCase()}</b>: ${tasks[0]}`;
      if (tasks.length > 1) telegramMsg += ` (+${tasks.length - 1} mas)`;
      telegramMsg += "\n";
    }
  }

  // Discoveries highlight
  if (discoveries > 0) {
    telegramMsg += `\n🔬 <b>${discoveries} descubrimiento${discoveries > 1 ? "s" : ""} nuevo${discoveries > 1 ? "s" : ""}:</b>\n`;
    for (const d of (newDiscoveries || []).slice(0, 3)) {
      const impactEmoji = d.impact === "critical" ? "🔴" : d.impact === "high" ? "🟠" : "🟢";
      telegramMsg += `${impactEmoji} ${d.title}\n`;
    }
    if (discoveries > 3) {
      telegramMsg += `...y ${discoveries - 3} mas en el dashboard.\n`;
    }
  }

  telegramMsg += "\n📱 Ver todo: pacameagencia.com/dashboard";

  // 7. Send Telegram digest
  await sendTelegram(telegramMsg);

  // 8. Send email digest (more detailed)
  const emailAgentLines = Object.entries(agentWork)
    .map(([agent, tasks]) => {
      const taskList = tasks.map(t => "  - " + t).join("\n");
      return agent.toUpperCase() + ":\n" + taskList;
    })
    .join("\n\n");

  const discoveryLines = (newDiscoveries || [])
    .map(d => {
      const label = d.impact === "critical" ? "[CRITICO]" : d.impact === "high" ? "[ALTO]" : "[MEDIO]";
      return label + " " + d.title + (d.suggested_action ? "\n  Accion: " + d.suggested_action : "");
    })
    .join("\n\n");

  const emailBody =
    `Resumen del ciclo de ${cycle}\n\n` +
    `METRICAS HOY:\n` +
    `- Leads nuevos: ${leadsToday || 0}\n` +
    `- Contenido generado: ${contentGenerated || 0}\n` +
    `- Propuestas: ${proposalsToday || 0}\n` +
    `- Entregas: ${deliveries}\n` +
    `- Alertas: ${alerts}\n\n` +
    (emailAgentLines ? `TRABAJO DE AGENTES:\n\n${emailAgentLines}\n\n` : "") +
    (discoveryLines ? `DESCUBRIMIENTOS NUEVOS:\n\n${discoveryLines}\n\n` : "") +
    `Revisa los detalles en el dashboard.`;

  await notifyPablo(
    "Digest " + cycle + ": " + deliveries + " entregas, " + discoveries + " descubrimientos",
    wrapEmailTemplate(emailBody, {
      cta: "Ver Dashboard",
      ctaUrl: "https://pacameagencia.com/dashboard/discoveries",
    })
  );

  return NextResponse.json({
    ok: true,
    cycle,
    stats: {
      leads: leadsToday,
      content: contentGenerated,
      proposals: proposalsToday,
      deliveries,
      alerts,
      discoveries,
    },
  });
}
