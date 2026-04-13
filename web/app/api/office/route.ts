import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

const supabase = createServerSupabase();

// GET: Retrieve agent states, activities, and tasks
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "overview"; // overview | activities | tasks
  const agentId = searchParams.get("agent");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (view === "overview") {
    // Get all agent states + recent activity counts
    const [statesRes, activitiesRes, tasksRes] = await Promise.all([
      supabase
        .from("agent_states")
        .select("*")
        .order("agent_id"),
      supabase
        .from("agent_activities")
        .select("agent_id, type, title, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("agent_tasks")
        .select("*")
        .in("status", ["pending", "in_progress"])
        .order("priority", { ascending: true })
        .limit(50),
    ]);

    return NextResponse.json({
      states: statesRes.data || [],
      recentActivities: activitiesRes.data || [],
      activeTasks: tasksRes.data || [],
    });
  }

  if (view === "activities") {
    let query = supabase
      .from("agent_activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (agentId) query = query.eq("agent_id", agentId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ activities: data });
  }

  if (view === "tasks") {
    let query = supabase
      .from("agent_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (agentId) query = query.eq("agent_id", agentId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tasks: data });
  }

  return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 });
}

// POST: Log an agent activity or update agent state
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { action } = body;

  // --- Log activity ---
  if (action === "log_activity") {
    const { agent_id, type, title, description, metadata } = body;
    if (!agent_id || !type || !title) {
      return NextResponse.json({ error: "agent_id, type, and title required" }, { status: 400 });
    }

    const { data, error } = await supabase.from("agent_activities").insert({
      agent_id,
      type,
      title,
      description: description || "",
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Also update agent state's last_activity
    await supabase.from("agent_states").upsert({
      agent_id,
      last_activity: new Date().toISOString(),
      status: type === "task_started" ? "working" : type === "task_completed" ? "idle" : undefined,
    }, { onConflict: "agent_id" });

    return NextResponse.json({ activity: data });
  }

  // --- Update agent status ---
  if (action === "update_status") {
    const { agent_id, status, current_task } = body;
    if (!agent_id || !status) {
      return NextResponse.json({ error: "agent_id and status required" }, { status: 400 });
    }

    const { error } = await supabase.from("agent_states").upsert({
      agent_id,
      status,
      current_task: current_task || null,
      last_activity: new Date().toISOString(),
    }, { onConflict: "agent_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // --- Create task ---
  if (action === "create_task") {
    const { agent_id, title, priority, client, due_date } = body;
    if (!agent_id || !title) {
      return NextResponse.json({ error: "agent_id and title required" }, { status: 400 });
    }

    const { data, error } = await supabase.from("agent_tasks").insert({
      agent_id,
      title,
      status: "pending",
      priority: priority || "medium",
      client: client || null,
      due_date: due_date || null,
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: data });
  }

  // --- Update task status ---
  if (action === "update_task") {
    const { task_id, status } = body;
    if (!task_id || !status) {
      return NextResponse.json({ error: "task_id and status required" }, { status: 400 });
    }

    const update: Record<string, unknown> = { status };
    if (status === "completed") update.completed_at = new Date().toISOString();

    const { error } = await supabase.from("agent_tasks").update(update).eq("id", task_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // --- Seed initial states (for bootstrap) ---
  if (action === "seed") {
    const agents = ["nova", "atlas", "nexus", "pixel", "core", "pulse", "sage", "copy", "lens", "dios"];
    const statuses = ["working", "idle", "reviewing", "idle", "working", "idle", "working", "idle", "idle", "idle"];
    const tasks = [
      "Rediseñando identidad visual cliente Restaurante Sol",
      null,
      "Revisando métricas campaña Meta Ads Q2",
      null,
      "Construyendo API de onboarding automático",
      null,
      "Analizando pipeline de leads semana 15",
      null,
      null,
      null,
    ];

    for (let i = 0; i < agents.length; i++) {
      await supabase.from("agent_states").upsert({
        agent_id: agents[i],
        status: statuses[i],
        current_task: tasks[i],
        tasks_today: Math.floor(Math.random() * 8) + 1,
        tasks_completed: Math.floor(Math.random() * 45) + 5,
        active_hours: Math.round((Math.random() * 6 + 2) * 10) / 10,
        last_activity: new Date().toISOString(),
      }, { onConflict: "agent_id" });
    }

    // Seed some activities
    const sampleActivities = [
      { agent_id: "sage", type: "insight", title: "Pipeline analysis Q2", description: "12 leads cualificados esta semana. 3 HOT (score >20). Recomiendo priorizar dentistas en Madrid y constructoras en Valencia." },
      { agent_id: "nova", type: "task_started", title: "Branding Restaurante Sol", description: "Comenzando diseño de identidad visual: logo, paleta, tipografía." },
      { agent_id: "atlas", type: "task_completed", title: "Auditoría SEO pacameagencia.com", description: "Score mejorado de 57 a 82/100. Schema markup implementado, meta descriptions corregidas." },
      { agent_id: "nexus", type: "update", title: "Meta Ads optimización", description: "CPL bajó de 8.50€ a 3.20€ en campaña de coaching. ROAS actual: 4.2x." },
      { agent_id: "pulse", type: "delivery", title: "Calendario editorial abril", description: "20 posts planificados: 8 reels, 5 carruseles, 4 posts, 3 stories interactivas." },
      { agent_id: "core", type: "task_completed", title: "API de pagos Stripe", description: "Checkout, webhooks y portal de cliente configurados. Tests pasando." },
      { agent_id: "pixel", type: "task_completed", title: "FAQ + Portfolio pages", description: "2 nuevas páginas desplegadas. Lighthouse 94/100." },
      { agent_id: "copy", type: "delivery", title: "Secuencia email nurturing", description: "4 emails de bienvenida redactados. Open rate estimado: 45%+ basado en benchmarks del sector." },
      { agent_id: "lens", type: "alert", title: "Alerta: bounce rate subió", description: "Bounce rate en /servicios subió 15% esta semana. Posible causa: tiempo de carga en mobile. Investigando." },
      { agent_id: "dios", type: "update", title: "Asignación semanal completada", description: "Tareas distribuidas a 8 agentes. 3 proyectos de cliente activos, 2 internos PACAME." },
    ];

    for (const a of sampleActivities) {
      await supabase.from("agent_activities").insert({
        ...a,
        metadata: {},
        created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      });
    }

    // Seed some tasks
    const sampleTasks = [
      { agent_id: "nova", title: "Branding completo Restaurante Sol", status: "in_progress", priority: "high", client: "Restaurante Sol" },
      { agent_id: "atlas", title: "SEO mensual pacameagencia.com", status: "in_progress", priority: "high", client: "PACAME" },
      { agent_id: "nexus", title: "Setup Google Ads captación", status: "pending", priority: "medium", client: "PACAME" },
      { agent_id: "pixel", title: "Landing page coach Barcelona", status: "pending", priority: "high", client: "Laura Coach" },
      { agent_id: "core", title: "Automatización onboarding email", status: "in_progress", priority: "medium", client: "PACAME" },
      { agent_id: "pulse", title: "Contenido Instagram semana 16", status: "in_progress", priority: "medium", client: "PACAME" },
      { agent_id: "sage", title: "Propuesta Clínica Salud Integral", status: "pending", priority: "high", client: "Clínica Salud" },
      { agent_id: "copy", title: "Emails outbound campaña dentistas", status: "pending", priority: "medium", client: "PACAME" },
      { agent_id: "lens", title: "Setup GA4 + dashboard KPIs", status: "pending", priority: "low", client: "PACAME" },
      { agent_id: "sage", title: "Diagnóstico constructora Valencia", status: "in_progress", priority: "high", client: "Const. Martínez" },
    ];

    for (const t of sampleTasks) {
      await supabase.from("agent_tasks").insert({
        ...t,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, seeded: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
