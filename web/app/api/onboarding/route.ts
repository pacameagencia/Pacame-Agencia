import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";

const supabase = createServerSupabase();

// Default onboarding checklist items per service type
const ONBOARDING_TEMPLATES: Record<string, { category: string; items: string[] }[]> = {
  web: [
    {
      category: "Briefing",
      items: [
        "Formulario de briefing recibido y revisado",
        "Definir estructura de paginas (sitemap)",
        "Recopilar textos y contenido del cliente",
        "Recopilar imagenes y recursos visuales",
        "Definir paleta de colores y preferencias de diseno",
      ],
    },
    {
      category: "Diseno",
      items: [
        "Wireframes de paginas principales aprobados",
        "Diseno visual aprobado por el cliente",
        "Version mobile revisada y aprobada",
      ],
    },
    {
      category: "Desarrollo",
      items: [
        "Web construida en entorno de desarrollo",
        "Formularios de contacto funcionando",
        "SEO basico implementado (meta tags, schema, sitemap)",
        "Google Analytics / tracking configurado",
        "Test de rendimiento (Lighthouse 90+)",
        "Test responsive en 3+ dispositivos",
      ],
    },
    {
      category: "Lanzamiento",
      items: [
        "Dominio configurado y DNS apuntando",
        "SSL activo (HTTPS)",
        "Web en produccion y funcionando",
        "Email de bienvenida enviado al cliente",
        "Google Search Console configurado",
        "Backup inicial realizado",
      ],
    },
  ],
  seo: [
    {
      category: "Setup",
      items: [
        "Auditoria SEO inicial completada",
        "Keyword research y keyword map entregado",
        "Google Search Console vinculado",
        "Google Analytics configurado",
        "Benchmark de posiciones actual documentado",
      ],
    },
    {
      category: "Optimizacion",
      items: [
        "Meta titles y descriptions optimizados",
        "Schema markup implementado",
        "Estructura de headings corregida",
        "Internal linking optimizado",
        "Sitemap XML generado y enviado",
      ],
    },
    {
      category: "Contenido",
      items: [
        "Calendario editorial del primer mes creado",
        "Primeros 2 articulos publicados",
        "Estrategia de link building definida",
      ],
    },
  ],
  branding: [
    {
      category: "Discovery",
      items: [
        "Briefing de marca recibido",
        "Analisis competitivo completado",
        "Moodboard aprobado por cliente",
        "Definir personalidad y tono de voz",
      ],
    },
    {
      category: "Identidad",
      items: [
        "Logotipo principal aprobado",
        "Variantes de logo creadas (horizontal, icono, monocromo)",
        "Paleta de colores definida",
        "Tipografias seleccionadas",
        "Manual de marca entregado",
      ],
    },
    {
      category: "Aplicaciones",
      items: [
        "Templates de redes sociales creados",
        "Tarjeta de visita disenada",
        "Firma de email configurada",
      ],
    },
  ],
  social: [
    {
      category: "Setup",
      items: [
        "Acceso a cuentas de redes sociales obtenido",
        "Perfiles optimizados (bio, foto, links)",
        "Calendario editorial del primer mes creado",
        "Templates visuales creados",
        "Hashtag strategy definida",
      ],
    },
    {
      category: "Contenido",
      items: [
        "Primera semana de contenido programada",
        "Primer reel/video creado",
        "Community management activo",
      ],
    },
  ],
  ads: [
    {
      category: "Setup",
      items: [
        "Cuenta publicitaria verificada",
        "Pixel / Conversions API instalado",
        "Audiencias definidas (custom + lookalike)",
        "Landing page de campana lista",
        "Creativos disenados (3-5 variantes)",
      ],
    },
    {
      category: "Lanzamiento",
      items: [
        "Campana configurada y lanzada",
        "Presupuesto diario configurado",
        "Tracking verificado (eventos disparando)",
        "A/B test activo (creativos)",
      ],
    },
  ],
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // --- Initialize onboarding for a new client ---
  if (action === "initialize") {
    const { client_id, service_types } = body;
    if (!client_id || !service_types?.length) {
      return NextResponse.json({ error: "client_id and service_types required" }, { status: 400 });
    }

    const items: { client_id: string; item: string; category: string }[] = [];

    for (const serviceType of service_types) {
      const templates = ONBOARDING_TEMPLATES[serviceType];
      if (!templates) continue;

      for (const group of templates) {
        for (const item of group.items) {
          items.push({
            client_id,
            item,
            category: `${serviceType.toUpperCase()} — ${group.category}`,
          });
        }
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "No valid service types provided" }, { status: 400 });
    }

    const { error } = await supabase.from("onboarding_checklist").insert(items);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update client status
    await supabase.from("clients").update({
      status: "onboarding",
      onboarded_at: new Date().toISOString(),
    }).eq("id", client_id);

    // Log to Oficina
    logAgentActivity({
      agentId: "sage",
      type: "task_started",
      title: `Onboarding iniciado`,
      description: `Cliente ${client_id}: ${items.length} items en checklist. Servicios: ${service_types.join(", ")}`,
      metadata: { client_id, service_types, items_count: items.length },
    });

    // Notify Pablo
    await supabase.from("notifications").insert({
      type: "onboarding_started",
      priority: "high",
      title: "Nuevo onboarding iniciado",
      message: `${items.length} tareas de onboarding creadas para servicios: ${service_types.join(", ")}`,
      data: { client_id, service_types },
    });

    return NextResponse.json({ ok: true, items_created: items.length });
  }

  // --- Get onboarding progress ---
  if (action === "progress") {
    const { client_id } = body;
    if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

    const { data: items } = await supabase
      .from("onboarding_checklist")
      .select("*")
      .eq("client_id", client_id)
      .order("category")
      .order("created_at");

    const total = items?.length || 0;
    const completed = items?.filter((i) => i.completed).length || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Group by category
    const grouped: Record<string, typeof items> = {};
    for (const item of items || []) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category]!.push(item);
    }

    return NextResponse.json({ total, completed, progress, grouped });
  }

  // --- Toggle checklist item ---
  if (action === "toggle") {
    const { item_id, completed } = body;
    if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });

    const { error } = await supabase.from("onboarding_checklist").update({
      completed: completed ?? true,
      completed_at: completed ? new Date().toISOString() : null,
    }).eq("id", item_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // --- Check if onboarding is complete and activate client ---
  if (action === "check_complete") {
    const { client_id } = body;
    if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

    const { data: items } = await supabase
      .from("onboarding_checklist")
      .select("completed")
      .eq("client_id", client_id);

    const total = items?.length || 0;
    const completed = items?.filter((i) => i.completed).length || 0;

    if (total > 0 && completed === total) {
      // All done — activate client
      await supabase.from("clients").update({ status: "active" }).eq("id", client_id);

      logAgentActivity({
        agentId: "sage",
        type: "task_completed",
        title: `Onboarding completado`,
        description: `Cliente ${client_id}: ${total} tareas completadas. Cliente activado.`,
      });

      await supabase.from("notifications").insert({
        type: "onboarding_complete",
        priority: "high",
        title: "Onboarding completado",
        message: `Todas las ${total} tareas de onboarding completadas. Cliente activado.`,
        data: { client_id },
      });

      return NextResponse.json({ complete: true, activated: true });
    }

    return NextResponse.json({ complete: false, progress: total > 0 ? Math.round((completed / total) * 100) : 0 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
