import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

const supabase = createServerSupabase();

// Seed demo data — only works with correct password
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const { password } = await request.json();
  if (password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  // 1. Seed agent states
  const agentIds = ["sage", "nova", "atlas", "nexus", "pixel", "core", "pulse", "copy", "lens"];
  for (const agentId of agentIds) {
    await supabase.from("agent_states").upsert({
      agent_id: agentId,
      status: "idle",
      tasks_today: Math.floor(Math.random() * 5),
      tasks_completed: Math.floor(Math.random() * 50) + 10,
      active_hours: Math.round(Math.random() * 40 * 10) / 10,
      last_activity: new Date().toISOString(),
    }, { onConflict: "agent_id" });
  }
  results.agent_states = `${agentIds.length} agents seeded`;

  // 2. Seed leads
  const demoLeads = [
    {
      name: "Maria Garcia",
      email: "maria@clinicasalud.es",
      phone: "+34612345001",
      business_name: "Clinica Salud Integral",
      business_type: "Clinica medica",
      problem: "Web anticuada, sin presencia online. Pierdo pacientes frente a clinicas con mejor web.",
      budget: "1000-3000",
      source: "web",
      score: 5,
      status: "qualified",
      sage_analysis: { recommended_services: ["Web Corporativa", "SEO Local", "Google Business"], estimated_value_onetime: 1200, estimated_value_monthly: 400 },
    },
    {
      name: "Carlos Rodriguez",
      email: "carlos@reformasrodriguez.com",
      phone: "+34612345002",
      business_name: "Reformas Rodriguez",
      business_type: "Constructora",
      problem: "Necesito generar leads online, todo viene por boca a boca",
      budget: "500-1000",
      source: "web",
      score: 4,
      status: "proposal_sent",
      sage_analysis: { recommended_services: ["Landing Page", "Google Ads"], estimated_value_onetime: 300, estimated_value_monthly: 400 },
    },
    {
      name: "Laura Fernandez",
      email: "laura@laurafernandez.com",
      phone: "+34612345003",
      business_name: "Laura Fernandez Coaching",
      business_type: "Coaching",
      problem: "Vendo por DM en Instagram pero no tengo web ni embudo",
      budget: "2000-5000",
      source: "instagram",
      score: 5,
      status: "negotiating",
      sage_analysis: { recommended_services: ["Landing Page", "Embudo Completo", "Meta Ads", "Branding"], estimated_value_onetime: 2800, estimated_value_monthly: 400 },
    },
    {
      name: "Pedro Martinez",
      email: "pedro@despachopm.es",
      phone: "+34612345004",
      business_name: "Bufete Martinez & Asociados",
      business_type: "Abogados",
      problem: "Web obsoleta, quiero captar clientes por Google",
      budget: "3000-5000",
      source: "referral",
      score: 4,
      status: "new",
      sage_analysis: { recommended_services: ["Web Corporativa", "SEO", "Google Ads"], estimated_value_onetime: 1500, estimated_value_monthly: 800 },
    },
    {
      name: "Ana Lopez",
      email: "ana@tiendaartesana.com",
      phone: "+34612345005",
      business_name: "Tienda Artesana Valencia",
      business_type: "E-commerce",
      problem: "Vendo en Etsy con margenes bajos, quiero mi propia tienda",
      budget: "2000-5000",
      source: "web",
      score: 3,
      status: "contacted",
      sage_analysis: { recommended_services: ["E-commerce", "SEO", "Meta Ads"], estimated_value_onetime: 2000, estimated_value_monthly: 700 },
    },
  ];

  const { data: insertedLeads } = await supabase.from("leads").insert(demoLeads).select("id, name");
  results.leads = `${insertedLeads?.length || 0} leads seeded`;

  // 3. Seed clients
  const demoClients = [
    {
      name: "Javier Sanchez",
      business_name: "Gimnasio FitZone",
      email: "javier@fitzone.es",
      phone: "+34612345010",
      business_type: "Gimnasio",
      status: "active",
      plan: "Growth",
      monthly_fee: 697,
      notes: "Cliente desde febrero. Web + RRSS + SEO.",
    },
    {
      name: "Elena Torres",
      business_name: "Restaurante La Tasca",
      email: "elena@latasca.es",
      phone: "+34612345011",
      business_type: "Restaurante",
      status: "active",
      plan: "Starter",
      monthly_fee: 397,
      notes: "Web + Google Business. Muy contenta con resultados.",
    },
    {
      name: "Miguel Ruiz",
      business_name: "Inmobiliaria Ruiz",
      email: "miguel@inmoruiz.com",
      phone: "+34612345012",
      business_type: "Inmobiliaria",
      status: "onboarding",
      plan: "Scale",
      monthly_fee: 1200,
      notes: "Paquete completo: web, SEO, ads, RRSS. Empezamos esta semana.",
    },
  ];

  await supabase.from("clients").insert(demoClients);
  results.clients = `${demoClients.length} clients seeded`;

  // 4. Seed agent activities
  const activityTypes = ["task_completed", "delivery", "insight", "alert", "task_started"];
  const activities = [
    { agent_id: "sage", type: "delivery", title: "Propuesta generada: Clinica Salud Integral", description: "3 servicios. Total: 1200EUR + 400EUR/mes." },
    { agent_id: "atlas", type: "task_completed", title: "Auditoria SEO: fitzone.es", description: "Score 72/100. 14 mejoras identificadas. Implementando correciones on-page." },
    { agent_id: "pulse", type: "delivery", title: "Contenido semanal: Restaurante La Tasca", description: "4 posts Instagram + 2 stories. Engagement +23% vs semana anterior." },
    { agent_id: "nexus", type: "insight", title: "Meta Ads: CPA reducido 18%", description: "Campana FitZone optimizada. CPA: 4.20EUR (antes 5.12EUR). ROAS: 3.8x." },
    { agent_id: "pixel", type: "task_completed", title: "Web Inmobiliaria Ruiz finalizada", description: "12 paginas, listado propiedades, filtros, SEO. Lighthouse 96." },
    { agent_id: "nova", type: "delivery", title: "Branding: Laura Fernandez Coaching", description: "Logo, paleta, tipografias, manual de marca. 3 variantes presentadas." },
    { agent_id: "copy", type: "delivery", title: "Emails nurturing: secuencia welcome", description: "4 emails redactados y programados para leads nuevos." },
    { agent_id: "core", type: "task_completed", title: "API integrada: Stripe pagos recurrentes", description: "Checkout, portal de cliente, webhooks. Test OK en produccion." },
    { agent_id: "lens", type: "insight", title: "KPI Report semanal", description: "5 leads nuevos, 2 propuestas, 1 cliente ganado. Revenue: 697EUR/mes. Profit: +412EUR." },
    { agent_id: "sage", type: "alert", title: "Lead caliente: Laura Fernandez", description: "Score 5/5. Presupuesto 2-5K. Sector coaching. Recomendar embudo completo + ads." },
  ];

  await supabase.from("agent_activities").insert(
    activities.map((a, i) => ({
      ...a,
      created_at: new Date(Date.now() - i * 3600000 * 4).toISOString(),
    }))
  );
  results.activities = `${activities.length} activities seeded`;

  // 5. Seed finances
  const finances = [
    { type: "income", category: "servicio", description: "Web FitZone — pago inicial", amount: 800, date: "2026-03-15" },
    { type: "income", category: "recurrente", description: "FitZone — mensualidad Growth marzo", amount: 697, date: "2026-03-01" },
    { type: "income", category: "recurrente", description: "La Tasca — mensualidad Starter marzo", amount: 397, date: "2026-03-01" },
    { type: "income", category: "servicio", description: "Branding Laura Fernandez", amount: 500, date: "2026-03-20" },
    { type: "income", category: "recurrente", description: "FitZone — mensualidad Growth abril", amount: 697, date: "2026-04-01" },
    { type: "income", category: "recurrente", description: "La Tasca — mensualidad Starter abril", amount: 397, date: "2026-04-01" },
    { type: "income", category: "recurrente", description: "Inmobiliaria Ruiz — mensualidad Scale abril", amount: 1200, date: "2026-04-05" },
    { type: "expense", category: "herramientas", description: "Vercel Pro", amount: 20, date: "2026-04-01" },
    { type: "expense", category: "api", description: "Claude API — marzo", amount: 45, date: "2026-03-31" },
    { type: "expense", category: "api", description: "Claude API — abril", amount: 32, date: "2026-04-10" },
    { type: "expense", category: "herramientas", description: "Resend email", amount: 0, date: "2026-04-01" },
    { type: "expense", category: "herramientas", description: "Supabase Pro", amount: 25, date: "2026-04-01" },
    { type: "expense", category: "ads", description: "Meta Ads — FitZone marzo", amount: 300, date: "2026-03-31" },
    { type: "expense", category: "ads", description: "Meta Ads — FitZone abril", amount: 350, date: "2026-04-10" },
  ];

  await supabase.from("finances").insert(finances);
  results.finances = `${finances.length} transactions seeded`;

  // 6. Seed content
  const content = [
    { platform: "instagram", content_type: "carousel", title: "5 errores web que ahuyentan clientes", body: "Error 1: Web lenta...", status: "approved", client_id: null },
    { platform: "linkedin", content_type: "post", title: "Caso de exito: +640% trafico organico", body: "Cuando Construcciones Martinez...", status: "approved", client_id: null },
    { platform: "instagram", content_type: "reel_script", title: "Antes vs Despues: web restaurante", body: "HOOK: Tu web parece de 2010?...", status: "pending_review", client_id: null },
    { platform: "blog", content_type: "article", title: "Guia SEO Local para PYMEs 2026", body: "El 46% de las busquedas en Google...", status: "pending_review", client_id: null },
    { platform: "instagram", content_type: "post", title: "Nuevo cliente: Inmobiliaria Ruiz", body: "Bienvenido al equipo...", status: "draft", client_id: null },
  ];

  await supabase.from("content").insert(content);
  results.content = `${content.length} content items seeded`;

  // 7. Seed notifications
  const notifications = [
    { type: "new_lead", priority: "high", title: "Nuevo lead: Maria Garcia", message: "Clinica Salud Integral — maria@clinicasalud.es. Web + SEO + Google Business.", read: false },
    { type: "proposal_sent", priority: "high", title: "Propuesta enviada: Carlos Rodriguez", message: "Landing Page + Google Ads. 300EUR + 400EUR/mes.", read: true },
    { type: "payment_received", priority: "normal", title: "Pago recibido: FitZone", message: "697EUR mensualidad Growth abril. Stripe.", read: true },
    { type: "nurture_email", priority: "normal", title: "Email nurturing enviado", message: "Laura Fernandez — Secuencia welcome, email 2/4.", read: false },
    { type: "analytics_alert", priority: "high", title: "Lens: trafico organico +45%", message: "pacameagencia.com recibio 1.800 visitas esta semana (+45% vs anterior).", read: false },
  ];

  await supabase.from("notifications").insert(notifications);
  results.notifications = `${notifications.length} notifications seeded`;

  // 8. Seed agent_tasks (for metrics)
  const tasks = agentIds.flatMap((agentId) =>
    Array.from({ length: 3 }, (_, i) => ({
      agent_id: agentId,
      task_type: activityTypes[i % activityTypes.length],
      status: "completed",
      cost_usd: Math.round(Math.random() * 5 * 100) / 100,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
    }))
  );

  await supabase.from("agent_tasks").insert(tasks);
  results.agent_tasks = `${tasks.length} tasks seeded`;

  return NextResponse.json({ ok: true, results });
}
