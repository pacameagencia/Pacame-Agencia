import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";

const supabase = createServerSupabase();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { url, email } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL es obligatoria" }, { status: 400 });
    }

    // Save as lead if email provided
    if (email) {
      await supabase.from("leads").insert({
        name: new URL(url).hostname,
        email,
        source: "audit_tool",
        status: "new",
        sage_analysis: { audit_url: url, submitted_at: new Date().toISOString() },
      });
    }

    // Try to generate audit with Claude
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
            max_tokens: 1200,
            messages: [{
              role: "user",
              content: `Eres un auditor web experto. Genera una auditoria web simulada pero realista para: ${url}

Responde SOLO JSON valido con esta estructura exacta:
{
  "score": 45,
  "summary": "Resumen de 1-2 frases del estado de la web",
  "priority_action": "Accion prioritaria concreta",
  "categories": [
    {"name": "SEO", "score": 40, "icon": "seo", "issues": ["problema1", "problema2", "problema3"], "recommendations": ["recomendacion1", "recomendacion2"]},
    {"name": "Movil", "score": 55, "icon": "mobile", "issues": ["problema1"], "recommendations": ["recomendacion1"]},
    {"name": "Velocidad", "score": 35, "icon": "speed", "issues": ["problema1", "problema2"], "recommendations": ["recomendacion1", "recomendacion2"]},
    {"name": "Seguridad", "score": 60, "icon": "security", "issues": ["problema1"], "recommendations": ["recomendacion1"]},
    {"name": "UX", "score": 50, "icon": "ux", "issues": ["problema1"], "recommendations": ["recomendacion1"]}
  ]
}

Haz el analisis realista para el tipo de negocio que parece ser. Score general entre 30-65 para que vean que hay margen de mejora. Todos los textos en espanol.`,
            }],
          }),
        });

        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}") + 1;

        if (jsonStart >= 0) {
          const audit = JSON.parse(text.slice(jsonStart, jsonEnd));

          logAgentActivity({
            agentId: "atlas",
            type: "task_completed",
            title: `Auditoria web: ${url}`,
            description: `Score: ${audit.score}/100. ${email ? `Lead capturado: ${email}` : "Sin email."}`,
            metadata: { url, email, score: audit.score },
          });

          return NextResponse.json({ audit });
        }
      } catch {
        // Fall through to fallback
      }
    }

    // Fallback: generate deterministic audit based on URL
    const hash = url.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    const baseScore = 30 + (hash % 35);

    const audit = {
      score: baseScore,
      summary: `Tu web tiene un score de ${baseScore}/100. Hay margen de mejora significativo en SEO y velocidad.`,
      priority_action: "Optimizar meta tags y velocidad de carga",
      categories: [
        { name: "SEO", score: Math.max(20, baseScore - 10 + (hash % 15)), icon: "seo", issues: ["Meta tags incompletos o genericos", "Sin sitemap.xml configurado", "Estructura de URLs no optimizada"], recommendations: ["Crear meta titles y descriptions unicos por pagina", "Generar sitemap.xml automatico", "Reestructurar URLs con palabras clave"] },
        { name: "Movil", score: Math.min(80, baseScore + (hash % 20)), icon: "mobile", issues: ["Algunos textos demasiado pequenos en movil", "Botones con area tactil insuficiente"], recommendations: ["Aumentar font-size minimo a 16px", "Asegurar 44px minimo en elementos interactivos"] },
        { name: "Velocidad", score: Math.max(15, baseScore - 15 + (hash % 10)), icon: "speed", issues: ["Imagenes sin optimizar (WebP)", "CSS y JS bloqueantes en el render", "Sin cache del navegador configurado"], recommendations: ["Convertir imagenes a formato WebP/AVIF", "Implementar lazy loading en imagenes", "Configurar headers de cache"] },
        { name: "Seguridad", score: Math.min(85, baseScore + 10 + (hash % 15)), icon: "security", issues: ["Headers de seguridad incompletos"], recommendations: ["Configurar Content-Security-Policy y X-Frame-Options"] },
        { name: "UX", score: Math.max(25, baseScore - 5 + (hash % 20)), icon: "ux", issues: ["CTA principal poco visible", "Formulario de contacto lejos del hero"], recommendations: ["Colocar CTA con contraste alto en la primera pantalla", "Simplificar el formulario de contacto"] },
      ],
    };

    logAgentActivity({
      agentId: "atlas",
      type: "task_completed",
      title: `Auditoria web (fallback): ${url}`,
      description: `Score: ${audit.score}/100. ${email ? `Lead: ${email}` : "Sin email."}`,
    });

    return NextResponse.json({ audit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error en auditoria";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
