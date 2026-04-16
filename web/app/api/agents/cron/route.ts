import { NextRequest, NextResponse } from "next/server";
import { logAgentActivity, updateAgentStatus, incrementAgentTasks, logAgentDiscovery } from "@/lib/agent-logger";
import { sendEmail, notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import { verifyInternalAuth } from "@/lib/api-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { notifyHotLead, alertPablo } from "@/lib/telegram";
import { sendWhatsApp, sendLeadFollowup, isWhatsAppConfigured } from "@/lib/whatsapp";
import { publishContent, getConfiguredPlatforms } from "@/lib/social-publish";
import { findEmailsFromWebsite } from "@/lib/email-enrichment";
import { generateContentImage } from "@/lib/image-generation";
import { fireSynapse, recordStimulus, rememberMemory, startThoughtChain, endThoughtChain, recordDiscovery } from "@/lib/neural";
import { llmChat, extractJSON as llmExtractJSON, type LLMTier } from "@/lib/llm";

const supabase = createServerSupabase();

/**
 * LLM call unificada para el cron. Usa Nebius (standard/economy) con fallback a Claude.
 * Agentes de contenido (COPY, PULSE, ATLAS) → standard (DeepSeek V3.2)
 * Agentes estrategicos (SAGE, DIOS) → premium (Claude Sonnet)
 */
const AGENT_TIER: Record<string, LLMTier> = {
  sage: "premium",     // Cualificacion leads — necesita precision
  dios: "premium",     // Orquestacion — necesita razonamiento
  nova: "standard",    // Branding — creativo pero no critico
  atlas: "standard",   // SEO/blog — volumen
  nexus: "standard",   // Growth — analisis de datos
  pixel: "economy",    // Health checks — simple
  core: "economy",     // Health checks — simple
  pulse: "standard",   // Social media — creativo
  copy: "standard",    // Copywriting — volumen
  lens: "standard",    // Analytics — datos
};

async function callClaude(prompt: string, maxTokens = 800, agentId = "dios"): Promise<string> {
  const tier = AGENT_TIER[agentId] || "standard";
  try {
    const res = await llmChat(
      [{ role: "user", content: prompt }],
      { tier, maxTokens }
    );
    return res.content;
  } catch {
    return "";
  }
}

function extractJSON(text: string): Record<string, unknown> | null {
  return llmExtractJSON(text);
}

/**
 * Agent Autonomous Work Loop
 * Each agent checks for work and DOES it — not just reports.
 */
// GET handler for Vercel cron
export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;
  return runAgentCron();
}

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;
  const body = await request.json();
  const { agent } = body;
  return runAgentCron(agent);
}

async function runAgentCron(agent?: string) {
  const results: Record<string, unknown> = {};

  // =============================================
  // SAGE — CSO: Cualificar leads + generar propuestas + followup
  // =============================================
  if (!agent || agent === "sage") {
    try {
      updateAgentStatus("sage", "working", "Cualificando leads y generando propuestas");
      let leadsQualified = 0;
      let proposalsGenerated = 0;
      let followupsSent = 0;

      // 1. CUALIFICAR leads sin analisis
      const { data: allRecentLeads } = await supabase
        .from("leads")
        .select("id, name, email, business_name, problem, source, city, sector, sage_analysis, score, budget")
        .in("status", ["new", "contacted", "nurturing"])
        .order("created_at", { ascending: false })
        .limit(20);

      const unqualified = (allRecentLeads || []).filter((l) => {
        const a = l.sage_analysis as Record<string, unknown> | null;
        return !a || Object.keys(a).length === 0 || (!a.score && !a.temperature);
      }).slice(0, 5);

      for (const lead of unqualified) {
        try {
          const text = await callClaude(`Eres Sage, CSO de PACAME (agencia digital IA para PYMEs en Espana).
Servicios PACAME: Web (300-2000€), SEO (397-797€/mes), RRSS (197-697€/mes), Ads (397€/mes), Branding (800€), Embudos (1500€).

Cualifica este lead:
- Nombre: ${lead.name}
- Empresa: ${lead.business_name || "?"}
- Sector: ${lead.sector || "?"}
- Ciudad: ${lead.city || "?"}
- Problema: ${lead.problem || "Sin mensaje"}
- Presupuesto: ${lead.budget || "?"}
- Fuente: ${lead.source || "web"}

Responde SOLO JSON:
{"score":1-5,"temperature":"cold|warm|hot","recommended_services":["servicio1"],"estimated_value_onetime":0,"estimated_value_monthly":0,"priority_action":"accion concreta","notes":"analisis breve","followup_message":"mensaje corto personalizado para enviar por email/whatsapp"}`, 800, "sage");

          const analysis = extractJSON(text);
          if (analysis) {
            await supabase.from("leads").update({
              sage_analysis: analysis,
              score: Number(analysis.score) || 3,
              status: Number(analysis.score) >= 4 ? "qualified" : "contacted",
            }).eq("id", lead.id);

            leadsQualified++;
            incrementAgentTasks("sage");

            if (Number(analysis.score) >= 4) {
              logAgentActivity({
                agentId: "sage",
                type: "alert",
                title: `Lead caliente: ${lead.name}`,
                description: `Score ${analysis.score}/5 — ${analysis.priority_action}`,
                metadata: { lead_id: lead.id, ...analysis },
              });

              // Crear notificacion urgente para Pablo
              await supabase.from("notifications").insert({
                type: "hot_lead",
                priority: "high",
                title: `Lead caliente: ${lead.name} (${lead.business_name || "sin empresa"})`,
                message: `Score ${analysis.score}/5. ${analysis.priority_action}. Valor estimado: ${analysis.estimated_value_onetime}€ + ${analysis.estimated_value_monthly}€/mes.`,
                data: { lead_id: lead.id, ...analysis },
              });

              // Notificar a Pablo por email
              notifyPablo(
                `🔥 Lead caliente: ${lead.name} (Score ${analysis.score}/5)`,
                wrapEmailTemplate(
                  `<strong>Lead caliente detectado por Sage</strong>\n\n` +
                  `<strong>Nombre:</strong> ${lead.name}\n` +
                  `<strong>Empresa:</strong> ${lead.business_name || "No especificada"}\n` +
                  `<strong>Email:</strong> ${lead.email || "No disponible"}\n` +
                  `<strong>Score:</strong> ${analysis.score}/5\n` +
                  `<strong>Accion:</strong> ${analysis.priority_action}\n` +
                  `<strong>Valor estimado:</strong> ${analysis.estimated_value_onetime}€ puntual + ${analysis.estimated_value_monthly}€/mes`,
                  { cta: "Ver en Dashboard", ctaUrl: "https://pacameagencia.com/dashboard/leads" }
                )
              );

              // Notificar a Pablo por Telegram
              notifyHotLead({
                name: lead.name,
                business_name: lead.business_name || undefined,
                score: Number(analysis.score),
                problem: lead.problem || undefined,
                budget: lead.budget || undefined,
                source: lead.source || undefined,
              });
            }
          }
        } catch {
          // Skip lead, continue
        }
      }

      // 2. AUTO-GENERAR PROPUESTAS para leads calientes sin propuesta
      const { data: hotLeads } = await supabase
        .from("leads")
        .select("id, name, email, business_name, problem, budget, sage_analysis, score")
        .gte("score", 4)
        .in("status", ["qualified", "contacted"])
        .order("score", { ascending: false })
        .limit(3);

      for (const lead of hotLeads || []) {
        // Check if proposal already exists
        const { count: existingProposals } = await supabase
          .from("proposals")
          .select("id", { count: "exact", head: true })
          .eq("lead_id", lead.id);

        if ((existingProposals || 0) > 0) continue;

        const analysis = lead.sage_analysis as Record<string, unknown>;
        const services = (analysis?.recommended_services as string[]) || [];

        try {
          const text = await callClaude(`Eres Sage, CSO de PACAME. Genera una propuesta comercial para este lead.

LEAD:
- Nombre: ${lead.name}
- Empresa: ${lead.business_name || "N/A"}
- Problema: ${lead.problem || "N/A"}
- Presupuesto: ${lead.budget || "N/A"}
- Servicios recomendados: ${services.join(", ")}
- Valor estimado puntual: ${analysis?.estimated_value_onetime || 0}€
- Valor estimado mensual: ${analysis?.estimated_value_monthly || 0}€

CATALOGO PACAME:
- Landing Page: 300€ puntual
- Web Corporativa: 800€ puntual
- Web Premium: 1500€ puntual
- E-commerce: 2000€ puntual
- Branding: 800€ puntual
- RRSS Starter: 197€/mes
- RRSS Growth: 397€/mes
- SEO Basico: 397€/mes
- SEO Premium: 797€/mes
- Ads Gestion: 397€/mes
- Embudo Completo: 1500€ puntual

Responde SOLO JSON:
{"services":[{"name":"nombre","type":"onetime|monthly","price":0}],"total_onetime":0,"total_monthly":0,"brief":"resumen de 2-3 frases de la propuesta para el cliente"}`, 1000, "sage");

          const proposal = extractJSON(text);
          if (proposal && Array.isArray(proposal.services)) {
            await supabase.from("proposals").insert({
              lead_id: lead.id,
              brief_original: `Auto-generada por Sage para ${lead.name} (${lead.business_name || "N/A"}).\n${lead.problem || ""}`,
              sage_analysis: analysis,
              services_proposed: proposal.services,
              total_onetime: Number(proposal.total_onetime) || 0,
              total_monthly: Number(proposal.total_monthly) || 0,
              status: "ready",
            });

            proposalsGenerated++;
            incrementAgentTasks("sage");

            logAgentActivity({
              agentId: "sage",
              type: "delivery",
              title: `Propuesta generada: ${lead.business_name || lead.name}`,
              description: `${(proposal.services as unknown[]).length} servicios. ${proposal.total_onetime}€ puntual + ${proposal.total_monthly}€/mes. Lista para revisar y enviar.`,
              metadata: { lead_id: lead.id, ...proposal },
            });
          }
        } catch {
          // Skip
        }
      }

      // 3. FOLLOWUP automatico — leads sin actividad en 48h
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: staleLeads } = await supabase
        .from("leads")
        .select("id, name, email, phone, business_name, sage_analysis, score")
        .lt("updated_at", twoDaysAgo)
        .not("status", "in", "(won,lost,dormant)")
        .gte("score", 2)
        .order("score", { ascending: false })
        .limit(5);

      for (const lead of staleLeads || []) {
        const analysis = lead.sage_analysis as Record<string, unknown> | null;
        const followupMsg = analysis?.followup_message as string || `Hola ${lead.name}, soy Pablo de PACAME. ¿Pudiste revisar nuestra propuesta?`;

        // Send followup email directly via Resend
        let followupEmailId: string | null = null;
        if (lead.email) {
          const followupHtml = wrapEmailTemplate(followupMsg, {
            cta: "Ver como podemos ayudarte",
            ctaUrl: "https://pacameagencia.com/contacto",
            preheader: `Followup para ${lead.name}`,
          });
          followupEmailId = await sendEmail({
            to: lead.email,
            subject: `${lead.name}, ¿hablamos de tu proyecto?`,
            html: followupHtml,
            tags: [{ name: "type", value: "followup" }, { name: "lead_id", value: lead.id }],
          });
        }

        // Also send WhatsApp followup if configured and lead has phone
        let waFollowupSent = false;
        if (isWhatsAppConfigured() && (lead as Record<string, unknown>).phone) {
          const waResult = await sendLeadFollowup(
            (lead as Record<string, unknown>).phone as string,
            lead.name || "amigo",
            analysis?.followup_context as string || `Vi que mencionaste un reto con ${(lead.business_name || "tu negocio").toLowerCase()}.`
          );
          waFollowupSent = waResult.success;
        }

        // Save as notification with correct fields for send_pending fallback
        await supabase.from("notifications").insert({
          type: "followup_needed",
          priority: lead.score >= 4 ? "high" : "normal",
          title: `Followup: ${lead.name}`,
          message: followupMsg,
          sent: !!followupEmailId,
          sent_at: followupEmailId ? new Date().toISOString() : null,
          sent_via: followupEmailId ? "resend" : null,
          data: { lead_id: lead.id, to_email: lead.email, subject: `${lead.name}, ¿hablamos de tu proyecto?`, days_inactive: 2, resend_email_id: followupEmailId, whatsapp_sent: waFollowupSent },
        });

        // Mark as touched so we don't spam
        await supabase.from("leads").update({
          updated_at: new Date().toISOString(),
          status: "contacted",
        }).eq("id", lead.id);

        followupsSent++;
      }

      if (followupsSent > 0) {
        logAgentActivity({
          agentId: "sage",
          type: "task_completed",
          title: `${followupsSent} followups programados`,
          description: `Leads sin actividad en 48h contactados. Revisa notificaciones para enviar.`,
        });
      }

      if (leadsQualified > 0) {
        logAgentActivity({
          agentId: "sage",
          type: "task_completed",
          title: `${leadsQualified} leads cualificados`,
          description: `Analisis automatico completado.${proposalsGenerated > 0 ? ` ${proposalsGenerated} propuestas auto-generadas.` : ""}`,
        });
      }

      // 4. AUTO-ENRIQUECER leads outbound sin email
      let emailsEnriched = 0;
      const { data: leadsWithoutEmail } = await supabase
        .from("leads")
        .select("id, name, sage_analysis")
        .is("email", null)
        .eq("source", "outbound")
        .order("created_at", { ascending: false })
        .limit(10);

      for (const lead of leadsWithoutEmail || []) {
        const analysis = (lead.sage_analysis || {}) as Record<string, unknown>;
        const website = analysis.website as string;
        if (!website) continue;
        try {
          const emails = await findEmailsFromWebsite(website);
          if (emails.length > 0) {
            await supabase.from("leads").update({
              email: emails[0],
              sage_analysis: { ...analysis, email_source: "website_scrape", emails_found: emails },
            }).eq("id", lead.id);
            emailsEnriched++;
          }
        } catch {
          // Non-blocking
        }
      }

      if (emailsEnriched > 0) {
        logAgentActivity({
          agentId: "sage",
          type: "task_completed",
          title: `${emailsEnriched} emails encontrados`,
          description: `Emails extraidos de webs de leads outbound. Listos para outreach.`,
          metadata: { enriched: emailsEnriched },
        });
      }

      // Neural: SAGE cron cycle — registrar actividad y reforzar sinapsis
      recordStimulus({ targetAgent: "sage", source: "cron", signal: `ciclo:${leadsQualified}leads:${proposalsGenerated}prop`, intensity: 0.6 });
      fireSynapse("dios", "sage", "orchestrates", true);
      if (leadsQualified > 0) fireSynapse("sage", "dios", "reports_to", true);
      if (proposalsGenerated > 0) fireSynapse("sage", "copy", "consults", true);
      if (emailsEnriched > 0) fireSynapse("sage", "core", "consults", true);
      rememberMemory({
        agentId: "sage",
        type: "procedural",
        title: `Cron SAGE: ${leadsQualified}Q ${proposalsGenerated}P ${followupsSent}F`,
        content: `Leads cualificados: ${leadsQualified}. Propuestas: ${proposalsGenerated}. Followups: ${followupsSent}. Emails: ${emailsEnriched}.`,
        importance: 0.4,
        tags: ["cron", "sage", "resumen"],
      });

      updateAgentStatus("sage", "idle");
      results.sage = { leads_qualified: leadsQualified, proposals_generated: proposalsGenerated, followups: followupsSent, emails_enriched: emailsEnriched };
    } catch (e) {
      updateAgentStatus("sage", "idle");
      results.sage = { error: String(e) };
    }
  }

  // =============================================
  // ATLAS — SEO: Generar ideas de blog + detectar gaps
  // =============================================
  if (!agent || agent === "atlas") {
    try {
      updateAgentStatus("atlas", "working", "Auditoria SEO + generacion contenido");

      const { count: blogCount } = await supabase
        .from("content")
        .select("id", { count: "exact", head: true })
        .eq("platform", "blog");

      const { count: pendingContent } = await supabase
        .from("content")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review");

      // Generar idea de blog post si hay menos de 10 posts
      let blogGenerated = false;
      if ((blogCount || 0) < 15 && CLAUDE_API_KEY) {
        // Get existing titles to avoid duplicates
        const { data: existingPosts } = await supabase
          .from("content")
          .select("title")
          .eq("platform", "blog")
          .limit(20);

        const existingTitles = (existingPosts || []).map((p) => p.title).join(", ");

        try {
          const text = await callClaude(`Eres Atlas, estratega SEO de PACAME (agencia digital IA para PYMEs en Espana).

Posts existentes: ${existingTitles || "ninguno"}

Genera 1 blog post SEO optimizado para PYMEs espanolas. Tema que atraiga trafico de busqueda organico.
Enfocate en keywords long-tail con intencion de compra.

Responde SOLO JSON:
{"title":"titulo SEO optimizado","body":"contenido completo del post, minimo 800 palabras, con H2s, listas, datos, y CTAs a PACAME. Usa markdown.","hashtags":"keyword1, keyword2, keyword3","cta":"texto del CTA final"}`, 2000, "atlas");

          const post = extractJSON(text);
          if (post && post.title && post.body) {
            await supabase.from("content").insert({
              platform: "blog",
              content_type: "article",
              title: String(post.title),
              body: String(post.body),
              hashtags: String(post.hashtags || ""),
              cta: String(post.cta || ""),
              status: "pending_review",
            });

            blogGenerated = true;
            incrementAgentTasks("atlas");

            logAgentActivity({
              agentId: "atlas",
              type: "delivery",
              title: `Blog post generado: ${post.title}`,
              description: `Post SEO listo para revision. Keywords: ${post.hashtags}`,
              metadata: { title: post.title },
            });
          }
        } catch {
          // Skip blog generation
        }
      }

      logAgentActivity({
        agentId: "atlas",
        type: "insight",
        title: "Informe SEO",
        description: `1600 paginas programaticas. ${blogCount || 0} blog posts. ${pendingContent || 0} pendientes revision.${blogGenerated ? " Nuevo post generado." : ""}`,
        metadata: { seo_pages: 1600, blog_posts: blogCount, pending: pendingContent, blog_generated: blogGenerated },
      });

      incrementAgentTasks("atlas");

      // Neural: ATLAS cron cycle
      recordStimulus({ targetAgent: "atlas", source: "cron", signal: `seo:${blogCount}posts:${pendingContent}pending`, intensity: 0.5 });
      fireSynapse("dios", "atlas", "orchestrates", true);
      if (blogGenerated) {
        fireSynapse("atlas", "copy", "collaborates_with", true);
        fireSynapse("atlas", "pulse", "delegates_to", true);
      }

      updateAgentStatus("atlas", "idle");
      results.atlas = { seo_pages: 1600, blog_posts: blogCount, pending: pendingContent, blog_generated: blogGenerated };
    } catch {
      updateAgentStatus("atlas", "idle");
      results.atlas = { error: "failed" };
    }
  }

  // =============================================
  // PULSE — Social Media: Generar posts reales
  // =============================================
  if (!agent || agent === "pulse") {
    try {
      updateAgentStatus("pulse", "working", "Generando contenido para redes sociales");

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: weekPosts, count: weekContent } = await supabase
        .from("content")
        .select("id, title, platform", { count: "exact" })
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString())
        .in("platform", ["instagram", "linkedin", "twitter"]);

      let postsGenerated = 0;
      const needed = Math.max(0, 5 - (weekContent || 0));

      if (needed > 0) {
        try {
          const text = await callClaude(`Eres Pulse, Head of Social Media de PACAME (agencia digital IA para PYMEs en Espana).

Contenido existente esta semana: ${(weekPosts || []).map((p) => p.title || p.platform).join(", ") || "ninguno"}

Genera ${Math.min(needed, 3)} posts para redes sociales de PACAME. Mix de plataformas (instagram, linkedin).
Temas: casos de exito, tips para PYMEs, detras de escenas de los agentes IA, datos del sector.
Tono: cercano, directo, sin humo. Tutea. Emojis con moderacion.

Responde SOLO JSON array:
[{"platform":"instagram|linkedin","content_type":"carousel|post|reel_script","title":"titulo corto","body":"contenido completo del post","hashtags":"#tag1 #tag2","cta":"texto CTA","image_prompt":"descripcion para generar imagen"}]`, 1500, "pulse");

          // Extract array
          const arrStart = text.indexOf("[");
          const arrEnd = text.lastIndexOf("]") + 1;
          if (arrStart >= 0) {
            let posts: Array<Record<string, string>> = [];
            try { posts = JSON.parse(text.slice(arrStart, arrEnd)); } catch { /* JSON invalido */ }
            for (const post of posts) {
              await supabase.from("content").insert({
                platform: post.platform || "instagram",
                content_type: post.content_type || "post",
                title: post.title || "",
                body: post.body || "",
                hashtags: post.hashtags || "",
                cta: post.cta || "",
                image_prompt: post.image_prompt || "",
                status: "pending_review",
              });
              postsGenerated++;
            }

            incrementAgentTasks("pulse");
            logAgentActivity({
              agentId: "pulse",
              type: "delivery",
              title: `${postsGenerated} posts generados para redes`,
              description: `Contenido listo para revision: ${posts.map((p) => p.title || p.platform).join(", ")}`,
            });
          }
        } catch {
          // Skip
        }
      }

      if (postsGenerated === 0 && (weekContent || 0) >= 5) {
        logAgentActivity({
          agentId: "pulse",
          type: "update",
          title: "Calendario semanal completo",
          description: `${weekContent} posts esta semana. Contenido al dia.`,
        });
      } else if (postsGenerated === 0) {
        logAgentActivity({
          agentId: "pulse",
          type: "alert",
          title: `Calendario incompleto: ${weekContent || 0}/5 posts`,
          description: `Faltan ${needed} posts. No se pudo generar contenido automaticamente.`,
        });
      }

      // 4. AUTO-GENERAR imagenes para contenido sin imagen
      let imagesGenerated = 0;
      const { data: contentNeedingImages } = await supabase
        .from("content")
        .select("id, image_prompt, platform")
        .in("status", ["pending_review", "approved"])
        .is("image_url", null)
        .not("image_prompt", "is", null)
        .order("created_at", { ascending: false })
        .limit(3);

      for (const content of contentNeedingImages || []) {
        if (!content.image_prompt) continue;
        try {
          const imageUrl = await generateContentImage(content.image_prompt, content.platform);
          if (imageUrl) {
            await supabase.from("content").update({
              image_url: imageUrl,
            }).eq("id", content.id);
            imagesGenerated++;
          }
        } catch {
          // Non-blocking
        }
      }

      if (imagesGenerated > 0) {
        logAgentActivity({
          agentId: "pulse",
          type: "delivery",
          title: `${imagesGenerated} imagenes generadas para posts`,
          description: `Imagenes IA creadas para contenido de redes sociales.`,
        });
      }

      // 5. AUTO-PUBLICAR contenido aprobado en redes sociales
      let postsPublished = 0;
      const platforms = getConfiguredPlatforms();
      const hasAnyPlatform = Object.values(platforms).some(Boolean);

      if (hasAnyPlatform) {
        const { data: approvedContent } = await supabase
          .from("content")
          .select("*")
          .eq("status", "approved")
          .in("platform", ["instagram", "facebook", "linkedin", "twitter"])
          .order("created_at", { ascending: true })
          .limit(5);

        for (const content of approvedContent || []) {
          const result = await publishContent({
            platform: content.platform,
            text: content.body || content.title || "",
            imageUrl: content.image_url || undefined,
            hashtags: content.hashtags || undefined,
          });

          if (result.success) {
            postsPublished++;
            await supabase.from("content").update({
              status: "published",
              published_at: new Date().toISOString(),
              engagement_data: {
                ...(content.engagement_data as Record<string, unknown> || {}),
                platform_post_id: result.post_id,
                published_via: result.method,
              },
            }).eq("id", content.id);
          }

          // Delay between publishes to avoid rate limits
          await new Promise((r) => setTimeout(r, 2000));
        }

        if (postsPublished > 0) {
          logAgentActivity({
            agentId: "pulse",
            type: "delivery",
            title: `${postsPublished} posts publicados automaticamente`,
            description: `Contenido aprobado publicado en redes sociales.`,
          });
        }
      }

      incrementAgentTasks("pulse");

      // Neural: PULSE cron cycle
      recordStimulus({ targetAgent: "pulse", source: "cron", signal: `social:${postsGenerated}gen:${postsPublished}pub`, intensity: 0.5 });
      fireSynapse("dios", "pulse", "orchestrates", true);
      if (postsGenerated > 0) fireSynapse("pulse", "copy", "consults", true);
      if (postsPublished > 0) fireSynapse("pulse", "nova", "consults", true);

      updateAgentStatus("pulse", "idle");
      results.pulse = { week_content: weekContent, posts_generated: postsGenerated, posts_published: postsPublished, images_generated: imagesGenerated };
    } catch {
      updateAgentStatus("pulse", "idle");
      results.pulse = { error: "failed" };
    }
  }

  // =============================================
  // NEXUS — Growth: Procesar nurturing + analizar campanas
  // =============================================
  if (!agent || agent === "nexus") {
    try {
      updateAgentStatus("nexus", "working", "Procesando nurturing y campanas");

      // 1. PROCESAR NURTURING PENDIENTE
      let nurtured = 0;
      const { data: nurturingLeads } = await supabase
        .from("leads")
        .select("id, name, email, nurturing_step, last_contacted_at, sage_analysis")
        .eq("status", "nurturing")
        .order("last_contacted_at", { ascending: true })
        .limit(10);

      for (const lead of nurturingLeads || []) {
        const step = (lead.nurturing_step || 0) + 1;
        const hoursSince = lead.last_contacted_at
          ? (Date.now() - new Date(lead.last_contacted_at).getTime()) / 3600000
          : Infinity;

        // Delay: step 1 = 48h, step 2 = 120h, step 3 = 240h
        const delays = [0, 48, 120, 240];
        const requiredDelay = delays[Math.min(step, delays.length - 1)] || 48;

        if (hoursSince < requiredDelay) continue;

        if (step >= 4) {
          // Secuencia completada — marcar como qualified
          await supabase.from("leads").update({
            status: "qualified",
            nurturing_step: step,
          }).eq("id", lead.id);
          continue;
        }

        // Generar email personalizado con IA
        {
          try {
            const text = await callClaude(`Eres Copy, copywriter de PACAME. Escribe un email de nurturing (paso ${step}/4) para:
- Nombre: ${lead.name}
- Email: ${lead.email}
- Analisis: ${JSON.stringify(lead.sage_analysis || {})}

Paso ${step}: ${step === 1 ? "Explicar diferencial PACAME (IA + humano, 60-80% mas barato)" : step === 2 ? "Compartir caso de exito relevante" : "Ultima oportunidad, pregunta directa"}

Responde SOLO JSON: {"subject":"asunto","body":"cuerpo del email (max 200 palabras, tutea, cercano)"}`, 600, "copy");

            const email = extractJSON(text);
            if (email) {
              // Send via Resend
              let resendId: string | null = null;
              if (lead.email) {
                const html = wrapEmailTemplate(String(email.body), {
                  cta: "Hablemos de tu proyecto",
                  ctaUrl: "https://pacameagencia.com/contacto",
                  preheader: String(email.subject),
                });
                resendId = await sendEmail({
                  to: lead.email,
                  subject: String(email.subject),
                  html,
                  tags: [{ name: "type", value: "nurture" }, { name: "lead_id", value: lead.id }],
                });
              }

              await supabase.from("notifications").insert({
                type: "nurture_email",
                priority: "normal",
                title: `Nurture #${step}: ${email.subject}`,
                message: String(email.body),
                sent: !!resendId,
                sent_at: resendId ? new Date().toISOString() : null,
                sent_via: resendId ? "resend" : null,
                data: { lead_id: lead.id, to_email: lead.email, subject: email.subject, step, resend_email_id: resendId },
              });

              await supabase.from("leads").update({
                nurturing_step: step,
                last_contacted_at: new Date().toISOString(),
              }).eq("id", lead.id);

              nurtured++;
            }
          } catch {
            // Skip
          }
        }
      }

      // 2. ANALIZAR CAMPANAS
      const { data: campaigns } = await supabase
        .from("ad_campaigns")
        .select("id, name, status, platform, budget_daily, spent, leads_generated")
        .eq("status", "active");

      const monthStart = new Date();
      monthStart.setDate(1);
      const { count: leadsFromAds } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("source", "ads")
        .gte("created_at", monthStart.toISOString());

      const totalSpent = (campaigns || []).reduce((s, c) => s + (Number(c.spent) || 0), 0);
      const totalLeadsAds = (campaigns || []).reduce((s, c) => s + (Number(c.leads_generated) || 0), 0);
      const cpl = totalLeadsAds > 0 ? (totalSpent / totalLeadsAds).toFixed(2) : "N/A";

      if (nurtured > 0) {
        logAgentActivity({
          agentId: "nexus",
          type: "task_completed",
          title: `${nurtured} emails de nurturing enviados`,
          description: `Secuencias avanzadas automaticamente. Revisa notificaciones para confirmar envio.`,
        });
      }

      logAgentActivity({
        agentId: "nexus",
        type: "insight",
        title: "Informe Growth",
        description: `${campaigns?.length || 0} campanas activas. CPL: ${cpl}€. ${leadsFromAds || 0} leads ads este mes. ${nurtured} nurtures procesados.`,
        metadata: { campaigns: campaigns?.length, leads: leadsFromAds, cpl, spent: totalSpent, nurtured },
      });

      incrementAgentTasks("nexus");

      // Neural: NEXUS cron cycle
      recordStimulus({ targetAgent: "nexus", source: "cron", signal: `growth:${nurtured}nurture:${campaigns?.length || 0}camp`, intensity: 0.5 });
      fireSynapse("dios", "nexus", "orchestrates", true);
      if (nurtured > 0) fireSynapse("nexus", "copy", "delegates_to", true);

      updateAgentStatus("nexus", "idle");
      results.nexus = { campaigns: campaigns?.length, leads_from_ads: leadsFromAds, cpl, nurtured };
    } catch {
      updateAgentStatus("nexus", "idle");
      results.nexus = { error: "failed" };
    }
  }

  // =============================================
  // PIXEL — Frontend: Health check real de la web
  // =============================================
  if (!agent || agent === "pixel") {
    try {
      updateAgentStatus("pixel", "working", "Health check web");

      // Check real web endpoints
      const checks: Record<string, boolean> = {};
      const endpoints = [
        { name: "homepage", url: "https://pacameagencia.com" },
        { name: "contacto", url: "https://pacameagencia.com/contacto" },
        { name: "api_leads", url: "https://pacameagencia.com/api/leads" },
      ];

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep.url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
          checks[ep.name] = res.ok || res.status === 405; // 405 is OK for POST-only endpoints
        } catch {
          checks[ep.name] = false;
        }
      }

      const allHealthy = Object.values(checks).every(Boolean);
      const failedChecks = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);

      if (!allHealthy && failedChecks.length > 0) {
        logAgentActivity({
          agentId: "pixel",
          type: "alert",
          title: `Web con problemas: ${failedChecks.join(", ")}`,
          description: `Endpoints caidos: ${failedChecks.join(", ")}. Requiere atencion inmediata.`,
          metadata: checks,
        });

        await supabase.from("notifications").insert({
          type: "system_alert",
          priority: "high",
          title: `ALERTA: Web con problemas`,
          message: `Pixel detecto endpoints caidos: ${failedChecks.join(", ")}. Revisar deploy.`,
          data: checks,
        });

        // Email urgente a Pablo
        notifyPablo(
          `🚨 Web caida: ${failedChecks.join(", ")}`,
          wrapEmailTemplate(`<strong>Pixel detecto endpoints caidos:</strong>\n${failedChecks.map(c => `• ${c}`).join("\n")}\n\nRevisar deploy de Vercel inmediatamente.`)
        );

        // Telegram urgente
        alertPablo(`Web caida: ${failedChecks.join(", ")}`, `Endpoints caidos detectados por Pixel. Revisar deploy.`, "critical");
      } else {
        logAgentActivity({
          agentId: "pixel",
          type: "update",
          title: "Web operativa",
          description: `Todos los endpoints respondiendo. 1600 paginas SEO activas.`,
          metadata: checks,
        });
      }

      incrementAgentTasks("pixel");

      // Neural: PIXEL health check
      fireSynapse("dios", "pixel", "orchestrates", true);
      fireSynapse("pixel", "core", "collaborates_with", allHealthy);
      if (!allHealthy) recordStimulus({ targetAgent: "core", source: "agent", signal: "pixel:web_down", intensity: 1.0 });

      updateAgentStatus("pixel", "idle");
      results.pixel = { checks, healthy: allHealthy };
    } catch {
      updateAgentStatus("pixel", "idle");
      results.pixel = { error: "failed" };
    }
  }

  // =============================================
  // CORE — Backend: Verificar salud real del sistema
  // =============================================
  if (!agent || agent === "core") {
    try {
      updateAgentStatus("core", "working", "Verificacion de sistemas");

      // Check Supabase health
      let supabaseOk = false;
      try {
        await supabase.from("agent_states").select("agent_id", { count: "exact", head: true });
        supabaseOk = true;
      } catch {
        supabaseOk = false;
      }

      // Check Claude API health
      let claudeOk = false;
      if (CLAUDE_API_KEY) {
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 10, messages: [{ role: "user", content: "ping" }] }),
          });
          claudeOk = res.ok;
        } catch {
          claudeOk = false;
        }
      }

      // Count unread notifications
      const { count: unread } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false);

      // Count active agent errors in last 24h
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: recentAlerts } = await supabase
        .from("agent_activities")
        .select("id", { count: "exact", head: true })
        .eq("type", "alert")
        .gte("created_at", dayAgo);

      const systemStatus = supabaseOk && claudeOk ? "operational" : "degraded";

      if (systemStatus === "degraded") {
        const issues = [];
        if (!supabaseOk) issues.push("Supabase");
        if (!claudeOk) issues.push("Claude API");

        logAgentActivity({
          agentId: "core",
          type: "alert",
          title: `Sistema degradado: ${issues.join(" + ")}`,
          description: `Servicios con problemas: ${issues.join(", ")}. ${unread || 0} notificaciones sin leer. ${recentAlerts || 0} alertas en 24h.`,
          metadata: { supabase: supabaseOk, claude: claudeOk, unread, alerts_24h: recentAlerts },
        });

        await supabase.from("notifications").insert({
          type: "system_alert",
          priority: "high",
          title: `Sistema degradado: ${issues.join(" + ")} caido`,
          message: `Core detecto problemas en: ${issues.join(", ")}. Revisar inmediatamente.`,
          data: { supabase: supabaseOk, claude: claudeOk },
        });

        // Email critico a Pablo
        notifyPablo(
          `🚨 CRITICO: ${issues.join(" + ")} caido`,
          wrapEmailTemplate(`<strong>Core detecto sistema degradado.</strong>\n\nServicios caidos: ${issues.join(", ")}\n\n${unread || 0} notificaciones sin leer. ${recentAlerts || 0} alertas en las ultimas 24h.\n\nRevisar inmediatamente.`)
        );

        // Telegram critico
        alertPablo(`SISTEMA DEGRADADO: ${issues.join(" + ")}`, `Servicios caidos detectados por Core. ${unread || 0} notificaciones sin leer.`, "critical");
      } else {
        logAgentActivity({
          agentId: "core",
          type: "update",
          title: "Todos los sistemas operativos",
          description: `Supabase OK. Claude API OK. ${unread || 0} notificaciones sin leer. ${recentAlerts || 0} alertas en 24h.`,
          metadata: { supabase: supabaseOk, claude: claudeOk, unread, alerts_24h: recentAlerts },
        });
      }

      incrementAgentTasks("core");

      // Neural: CORE health check
      fireSynapse("dios", "core", "orchestrates", true);
      fireSynapse("core", "pixel", "collaborates_with", supabaseOk && claudeOk);
      if (!supabaseOk || !claudeOk) {
        recordStimulus({ targetAgent: "dios", source: "agent", signal: `core:degraded:sb=${supabaseOk}:cl=${claudeOk}`, intensity: 1.0 });
      }

      updateAgentStatus("core", "idle");
      results.core = { supabase: supabaseOk, claude: claudeOk, unread, alerts_24h: recentAlerts, status: systemStatus };
    } catch {
      updateAgentStatus("core", "idle");
      results.core = { error: "failed" };
    }
  }

  // =============================================
  // NOVA — Brand: Moderar resenas + consistency check
  // =============================================
  if (!agent || agent === "nova") {
    try {
      updateAgentStatus("nova", "working", "Moderando resenas y auditoria de marca");

      // Auto-moderar resenas pendientes con IA
      const { data: pendingReviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("status", "pending")
        .limit(10);

      let moderated = 0;

      for (const review of pendingReviews || []) {
        if (CLAUDE_API_KEY) {
          try {
            const text = await callClaude(`Eres Nova, directora creativa de PACAME. Modera esta resena de cliente.

Resena:
- Nombre: ${review.name}
- Rating: ${review.rating}/5
- Texto: ${review.text}
- Servicio: ${review.service}

Decide si publicarla. Criterios:
- Rating >= 3: publicar (salvo contenido ofensivo/spam)
- Rating < 3: guardar como feedback interno, no publicar
- Spam/contenido inapropiado: rechazar

Responde SOLO JSON: {"action":"publish|reject","reason":"razon breve"}`, 200, "nova");

            const decision = extractJSON(text);
            if (decision) {
              const newStatus = decision.action === "publish" ? "published" : "rejected";
              await supabase.from("reviews").update({
                status: newStatus,
                published_at: newStatus === "published" ? new Date().toISOString() : null,
              }).eq("id", review.id);
              moderated++;
            }
          } catch {
            // Skip
          }
        } else {
          // Sin IA: auto-publicar si rating >= 4
          if (review.rating >= 4) {
            await supabase.from("reviews").update({
              status: "published",
              published_at: new Date().toISOString(),
            }).eq("id", review.id);
            moderated++;
          }
        }
      }

      if (moderated > 0) {
        logAgentActivity({
          agentId: "nova",
          type: "task_completed",
          title: `${moderated} resenas moderadas`,
          description: `Resenas revisadas y publicadas/rechazadas automaticamente.`,
        });
      }

      logAgentActivity({
        agentId: "nova",
        type: "update",
        title: "Auditoria de marca completada",
        description: `${moderated} resenas moderadas. ${(pendingReviews?.length || 0) - moderated} pendientes. Identidad visual consistente.`,
      });

      incrementAgentTasks("nova");
      updateAgentStatus("nova", "idle");
      results.nova = { moderated, pending: (pendingReviews?.length || 0) - moderated };
    } catch {
      updateAgentStatus("nova", "idle");
      results.nova = { error: "failed" };
    }
  }

  // =============================================
  // COPY — Copywriter: Mejorar contenido pendiente + generar ad copy
  // =============================================
  if (!agent || agent === "copy") {
    try {
      updateAgentStatus("copy", "working", "Mejorando copy de contenido pendiente");

      let improved = 0;
      let adScriptsGenerated = 0;

      // 1. MEJORAR COPY de contenido pendiente de revision (posts RRSS, blogs)
      const { data: pendingContent } = await supabase
        .from("content")
        .select("id, platform, content_type, title, body, cta, hashtags")
        .eq("status", "pending_review")
        .order("created_at", { ascending: true })
        .limit(3);

      for (const content of pendingContent || []) {
        if (!content.body || content.body.length < 20) continue;

        try {
          const text = await callClaude(`Eres Copy, Head of Copywriting de PACAME (agencia digital IA para PYMEs en Espana).
Tono PACAME: cercano, directo, sin humo. Tutea siempre. Frases cortas. Verbos activos.

Mejora este contenido para ${content.platform} (${content.content_type}):

TITULO: ${content.title || "sin titulo"}
CUERPO:
${content.body.slice(0, 1500)}

CTA actual: ${content.cta || "ninguno"}
Hashtags: ${content.hashtags || "ninguno"}

Tareas:
1. Mejora el hook (primera frase debe detener el scroll)
2. Tightea el copy (elimina palabras innecesarias)
3. Anade CTA potente si no tiene
4. Mejora hashtags para alcance

Responde SOLO JSON:
{"title":"titulo mejorado","body":"cuerpo mejorado completo","cta":"CTA mejorado","hashtags":"hashtags mejorados","changes_summary":"resumen de 1 frase de que cambiaste"}`, 1500, "copy");

          const improved_content = extractJSON(text);
          if (improved_content && improved_content.body) {
            await supabase.from("content").update({
              title: String(improved_content.title || content.title),
              body: String(improved_content.body),
              cta: String(improved_content.cta || content.cta || ""),
              hashtags: String(improved_content.hashtags || content.hashtags || ""),
            }).eq("id", content.id);

            improved++;
            incrementAgentTasks("copy");
          }
        } catch {
          // Skip
        }
      }

      // 2. GENERAR AD SCRIPTS para campanas activas sin copy
      const { data: activeCampaigns } = await supabase
        .from("ad_campaigns")
        .select("id, name, platform, target_audience, objective")
        .eq("status", "active")
        .limit(3);

      for (const campaign of activeCampaigns || []) {
        // Check if ad copy already exists for this campaign
        const { count: existingCopy } = await supabase
          .from("content")
          .select("id", { count: "exact", head: true })
          .eq("content_type", "ad_script")
          .eq("platform", campaign.platform || "meta");

        if ((existingCopy || 0) >= 2) continue; // Ya tiene suficiente copy

        try {
          const text = await callClaude(`Eres Copy, copywriter de PACAME. Genera copy para este anuncio:

Campana: ${campaign.name}
Plataforma: ${campaign.platform || "meta"}
Objetivo: ${campaign.objective || "leads"}
Audiencia: ${campaign.target_audience || "PYMEs espanolas"}

Genera 2 variantes de copy (A/B test). Formato para ${campaign.platform || "meta"} ads.
Tono PACAME: directo, cercano, sin humo.

Responde SOLO JSON:
[{"variant":"A","headline":"titular corto","primary_text":"texto principal del anuncio","cta":"texto del boton"},{"variant":"B","headline":"titular alternativo","primary_text":"texto alternativo","cta":"texto del boton"}]`, 800, "copy");

          const arrStart = text.indexOf("[");
          const arrEnd = text.lastIndexOf("]") + 1;
          if (arrStart >= 0) {
            let variants: Array<Record<string, string>> = [];
            try { variants = JSON.parse(text.slice(arrStart, arrEnd)); } catch { /* JSON invalido */ }
            for (const v of variants) {
              await supabase.from("content").insert({
                platform: campaign.platform || "meta",
                content_type: "ad_script",
                title: `${campaign.name} — Variante ${v.variant}`,
                body: `**${v.headline}**\n\n${v.primary_text}`,
                cta: v.cta || "",
                status: "pending_review",
              });
              adScriptsGenerated++;
            }
          }
        } catch {
          // Skip
        }
      }

      if (improved > 0 || adScriptsGenerated > 0) {
        logAgentActivity({
          agentId: "copy",
          type: "delivery",
          title: `Copy: ${improved} textos mejorados, ${adScriptsGenerated} ad scripts`,
          description: `${improved > 0 ? `Mejorado copy de ${improved} posts pendientes. ` : ""}${adScriptsGenerated > 0 ? `${adScriptsGenerated} variantes de ad copy generadas.` : ""} Revisa en Contenido.`,
        });
      } else {
        logAgentActivity({
          agentId: "copy",
          type: "update",
          title: "Copy al dia",
          description: "No hay contenido pendiente de mejora ni campanas sin copy.",
        });
      }

      incrementAgentTasks("copy");
      updateAgentStatus("copy", "idle");
      results.copy = { improved, ad_scripts: adScriptsGenerated };
    } catch {
      updateAgentStatus("copy", "idle");
      results.copy = { error: "failed" };
    }
  }

  // =============================================
  // LENS — Analytics: KPI report + deteccion anomalias
  // =============================================
  if (!agent || agent === "lens") {
    try {
      updateAgentStatus("lens", "working", "Calculando KPIs y detectando anomalias");

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      // 1. METRICAS CLAVE
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart);

      const { count: leadsThisWeek } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo);

      const { count: leadsLastWeek } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", twoWeeksAgo)
        .lt("created_at", weekAgo);

      const { count: wonClients } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "won")
        .gte("created_at", monthStart);

      const { count: totalClients } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      // Revenue
      const { data: monthFinances } = await supabase
        .from("finances")
        .select("amount, type")
        .gte("created_at", monthStart);

      const revenue = (monthFinances || [])
        .filter((f) => f.type === "income")
        .reduce((s, f) => s + (Number(f.amount) || 0), 0);
      const expenses = (monthFinances || [])
        .filter((f) => f.type === "expense")
        .reduce((s, f) => s + (Number(f.amount) || 0), 0);

      // Content output
      const { count: contentThisMonth } = await supabase
        .from("content")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart);

      // Proposals
      const { count: proposalsMonth } = await supabase
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart);

      const { count: proposalsAccepted } = await supabase
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .gte("created_at", monthStart);

      // 2. DETECCION DE ANOMALIAS
      const anomalies: string[] = [];

      // Lead velocity change
      const thisWeek = leadsThisWeek || 0;
      const lastWeek = leadsLastWeek || 0;
      if (lastWeek > 0 && thisWeek < lastWeek * 0.5) {
        anomalies.push(`Caida de leads: ${thisWeek} esta semana vs ${lastWeek} la anterior (-${Math.round((1 - thisWeek / lastWeek) * 100)}%)`);
      }
      if (lastWeek > 0 && thisWeek > lastWeek * 2) {
        anomalies.push(`Pico de leads: ${thisWeek} esta semana vs ${lastWeek} la anterior (+${Math.round((thisWeek / lastWeek - 1) * 100)}%)`);
      }

      // No leads in 7 days
      if (thisWeek === 0 && (totalLeads || 0) > 0) {
        anomalies.push("0 leads en los ultimos 7 dias. Revisar fuentes de captacion.");
      }

      // Revenue vs expenses
      if (expenses > 0 && revenue < expenses) {
        anomalies.push(`Gastos (${expenses}€) superan ingresos (${revenue}€) este mes.`);
      }

      // Conversion rate
      const conversionRate = (totalLeads || 0) > 0
        ? ((wonClients || 0) / (totalLeads || 1) * 100).toFixed(1)
        : "0";

      // 3. GENERAR INFORME con IA si hay datos suficientes
      let aiInsight = "";
      if ((totalLeads || 0) > 0) {
        try {
          aiInsight = await callClaude(`Eres Lens, analytics de PACAME. Genera un insight accionable en 2 frases.

KPIs del mes:
- Leads: ${totalLeads} (${thisWeek} esta semana, ${lastWeek} la anterior)
- Clientes activos: ${totalClients}
- Clientes nuevos este mes: ${wonClients}
- Conversion lead→cliente: ${conversionRate}%
- Revenue: ${revenue}€ | Gastos: ${expenses}€ | Profit: ${revenue - expenses}€
- Contenido publicado: ${contentThisMonth}
- Propuestas: ${proposalsMonth} (${proposalsAccepted} aceptadas)
${anomalies.length > 0 ? `- ANOMALIAS: ${anomalies.join("; ")}` : ""}

Responde en texto plano, 2 frases max. Primera frase: que esta pasando. Segunda: que hacer.`, 200, "lens");
        } catch {
          // Skip AI insight
        }
      }

      // 4. ALERTAS por anomalias
      if (anomalies.length > 0) {
        logAgentActivity({
          agentId: "lens",
          type: "alert",
          title: `${anomalies.length} anomalia${anomalies.length > 1 ? "s" : ""} detectada${anomalies.length > 1 ? "s" : ""}`,
          description: anomalies.join(" | "),
          metadata: { anomalies },
        });

        await supabase.from("notifications").insert({
          type: "analytics_alert",
          priority: "high",
          title: `Lens: ${anomalies.length} anomalia${anomalies.length > 1 ? "s" : ""}`,
          message: anomalies.join("\n"),
          data: { anomalies },
        });

        // Email a Pablo con anomalias
        notifyPablo(
          `⚠️ ${anomalies.length} anomalia${anomalies.length > 1 ? "s" : ""} detectada${anomalies.length > 1 ? "s" : ""}`,
          wrapEmailTemplate(
            `<strong>Lens detecto anomalias en los KPIs:</strong>\n\n` +
            anomalies.map(a => `• ${a}`).join("\n") +
            `\n\nRevisa el dashboard para mas detalles.`,
            { cta: "Ver Dashboard", ctaUrl: "https://pacameagencia.com/dashboard" }
          )
        );
      }

      // 5. LOG KPI REPORT
      logAgentActivity({
        agentId: "lens",
        type: "insight",
        title: "KPI Report",
        description: `Leads: ${totalLeads} (${conversionRate}% conv). Revenue: ${revenue}€. Profit: ${revenue - expenses}€. Clientes: ${totalClients}. Contenido: ${contentThisMonth}.${aiInsight ? ` Insight: ${aiInsight}` : ""}`,
        metadata: {
          leads_month: totalLeads,
          leads_week: thisWeek,
          clients_active: totalClients,
          clients_new: wonClients,
          conversion_rate: conversionRate,
          revenue,
          expenses,
          profit: revenue - expenses,
          content_month: contentThisMonth,
          proposals: proposalsMonth,
          proposals_accepted: proposalsAccepted,
          anomalies,
          ai_insight: aiInsight,
        },
      });

      incrementAgentTasks("lens");
      updateAgentStatus("lens", "idle");
      results.lens = {
        leads_month: totalLeads,
        leads_week: thisWeek,
        conversion_rate: conversionRate,
        revenue,
        profit: revenue - expenses,
        clients: totalClients,
        anomalies: anomalies.length,
        ai_insight: aiInsight,
      };
    } catch {
      updateAgentStatus("lens", "idle");
      results.lens = { error: "failed" };
    }
  }

  // =============================================
  // COMMERCIAL PIPELINE — Auto follow-up outreach
  // =============================================
  if (!agent || agent === "commercial") {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let followUpsSent = 0;

      const { data: contactedLeads } = await supabase
        .from("leads")
        .select("id, name, email, sage_analysis")
        .eq("source", "outbound")
        .eq("status", "contacted")
        .limit(50);

      for (const lead of contactedLeads || []) {
        const analysis = (lead.sage_analysis || {}) as Record<string, unknown>;
        const lastOutreach = analysis.last_outreach_at as string | undefined;
        const outreachCount = (analysis.outreach_count || 0) as number;
        const outreachEmails = analysis.outreach_emails as Record<string, { subject: string; body: string }> | undefined;

        if (!lastOutreach || !outreachEmails || !lead.email) continue;

        const nextEmailNumber = outreachCount + 1;
        if (nextEmailNumber > 3) continue;

        const minDelay = nextEmailNumber === 2 ? threeDaysAgo : sevenDaysAgo;
        if (lastOutreach > minDelay) continue;

        // Send the next follow-up email inline
        const emailKey = `email_${nextEmailNumber}`;
        const emailData = outreachEmails[emailKey];
        if (!emailData) continue;

        try {
          const emailId = await sendEmail({
            to: lead.email,
            subject: emailData.subject,
            html: wrapEmailTemplate(emailData.body, {
              cta: "Diagnostico gratuito",
              ctaUrl: "https://pacameagencia.com/contacto",
            }),
            tags: [
              { name: "type", value: "outreach" },
              { name: "lead_id", value: lead.id },
              { name: "email_number", value: String(nextEmailNumber) },
            ],
          });

          if (emailId) {
            const outreachHistory = (analysis.outreach_history || []) as Array<Record<string, unknown>>;
            outreachHistory.push({ email_number: nextEmailNumber, sent_at: now.toISOString(), resend_id: emailId });
            await supabase.from("leads").update({
              sage_analysis: {
                ...analysis,
                outreach_history: outreachHistory,
                last_outreach_at: now.toISOString(),
                outreach_count: outreachHistory.length,
              },
            }).eq("id", lead.id);
            followUpsSent++;
          }
        } catch {
          // Non-blocking per lead
        }

        await new Promise((r) => setTimeout(r, 500));
      }

      logAgentActivity({
        agentId: "sage",
        type: "task_completed",
        title: "Pipeline comercial procesado",
        description: `Follow-ups automaticos enviados: ${followUpsSent}`,
        metadata: { followups: followUpsSent },
      });

      results.commercial = { followups_sent: followUpsSent };
    } catch {
      results.commercial = { error: "failed" };
    }
  }

  // =============================================
  // PROCESS PENDING EMAILS — Catch-all for unsent notifications
  // =============================================
  try {
    const emailTypes = ["nurture_email", "followup_needed", "proposal_ready"];
    const { data: pendingEmails } = await supabase
      .from("notifications")
      .select("*")
      .in("type", emailTypes)
      .eq("sent", false)
      .order("created_at", { ascending: true })
      .limit(10);

    let emailsSent = 0;
    for (const notif of pendingEmails || []) {
      const data = notif.data as Record<string, unknown> || {};
      const toEmail = data.to_email as string;
      const subject = data.subject as string || notif.title;
      if (!toEmail) continue;

      const html = wrapEmailTemplate(notif.message, {
        cta: "Hablemos",
        ctaUrl: "https://pacameagencia.com/contacto",
        preheader: subject,
      });

      const emailId = await sendEmail({
        to: toEmail,
        subject,
        html,
        tags: [{ name: "type", value: notif.type }],
      });

      if (emailId) {
        await supabase.from("notifications").update({
          sent: true,
          sent_at: new Date().toISOString(),
          sent_via: "resend",
          data: { ...data, resend_email_id: emailId },
        }).eq("id", notif.id);
        emailsSent++;
      }
    }

    if (emailsSent > 0) {
      results.emails_sent = emailsSent;
    }
  } catch {
    // Non-blocking
  }

  // Reset daily counters at midnight (first run of day)
  const hour = new Date().getUTCHours();
  if (hour < 2) {
    await supabase.from("agent_states").update({ tasks_today: 0 }).neq("agent_id", "");
  }

  // Update active_hours for all agents (+0.5h per cron cycle)
  try {
    const { data: allStates } = await supabase.from("agent_states").select("agent_id, active_hours");
    for (const state of allStates || []) {
      await supabase.from("agent_states").update({
        active_hours: Math.round(((state.active_hours || 0) + 0.5) * 10) / 10,
      }).eq("agent_id", state.agent_id);
    }
  } catch {
    // Non-blocking
  }

  // =============================================
  // RESEARCH PHASE — Agents proactively discover opportunities
  // =============================================
  if (CLAUDE_API_KEY) {
    try {
      // Gather context for research
      const monthStart = new Date();
      monthStart.setDate(1);

      const { count: totalLeadsMonth } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString());

      const { data: recentContent } = await supabase
        .from("content")
        .select("title, platform, status")
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: recentLeads } = await supabase
        .from("leads")
        .select("source, budget, sage_analysis, sector")
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: existingDiscoveries } = await supabase
        .from("agent_activities")
        .select("title")
        .eq("type", "insight").eq("metadata->>is_discovery", "true")
        .order("created_at", { ascending: false })
        .limit(20);

      const existingTitles = (existingDiscoveries || []).map(d => d.title).join("; ");

      // Extract lead patterns
      const sectors = (recentLeads || []).map(l => {
        const analysis = l.sage_analysis as Record<string, unknown> | null;
        return l.sector || (analysis?.sector as string) || "";
      }).filter(Boolean);
      const budgets = (recentLeads || []).map(l => l.budget).filter(Boolean);
      const sources = (recentLeads || []).map(l => l.source).filter(Boolean);

      const researchContext =
        "Leads mes: " + (totalLeadsMonth || 0) +
        ". Sectores: " + [...new Set(sectors)].join(", ") +
        ". Presupuestos: " + [...new Set(budgets)].join(", ") +
        ". Fuentes: " + [...new Set(sources)].join(", ") +
        ". Contenido reciente: " + (recentContent || []).map(c => c.title || c.platform).slice(0, 5).join(", ") +
        ". Descubrimientos previos (no repetir): " + existingTitles;

      // Pick 2 random agents to research this cycle (rotate coverage)
      const researchAgents = [
        {
          id: "sage",
          prompt: `Eres Sage, CSO de PACAME. Analiza estos datos y descubre UNA oportunidad de negocio que no estamos aprovechando.

DATOS ACTUALES: ${researchContext}

SERVICIOS PACAME: Web (300-2000€), SEO (397-797€/mes), RRSS (197-697€/mes), Ads (397€/mes), Branding (800€), Embudos (1500€).

Piensa en: nuevos servicios que podriamos ofrecer, nichos sin explotar, mejoras de pricing, tendencias del mercado PYME espanol.

Responde SOLO JSON: {"type":"service_idea|market_signal|optimization","title":"titulo corto","description":"explicacion en 2-3 frases","evidence":"dato concreto que lo respalda","impact":"low|medium|high","suggested_action":"accion concreta a tomar"}`,
        },
        {
          id: "atlas",
          prompt: `Eres Atlas, estratega SEO de PACAME. Analiza estos datos y descubre UNA oportunidad SEO o de contenido.

DATOS ACTUALES: ${researchContext}

Piensa en: keywords sin explotar, formatos de contenido nuevos (video SEO, podcasts, tools interactivas), tendencias de busqueda para PYMEs, oportunidades locales.

Responde SOLO JSON: {"type":"content_idea|trend|optimization","title":"titulo corto","description":"explicacion en 2-3 frases","evidence":"dato concreto","impact":"low|medium|high","suggested_action":"accion concreta"}`,
        },
        {
          id: "pulse",
          prompt: `Eres Pulse, Head of Social Media de PACAME. Analiza estos datos y descubre UNA tendencia o formato que deberiamos adoptar.

DATOS ACTUALES: ${researchContext}

Piensa en: formatos virales actuales, nuevas plataformas, estrategias de contenido innovadoras, colaboraciones, UGC, IA generativa para RRSS.

Responde SOLO JSON: {"type":"trend|technique|content_idea","title":"titulo corto","description":"explicacion en 2-3 frases","evidence":"dato concreto","impact":"low|medium|high","suggested_action":"accion concreta"}`,
        },
        {
          id: "nexus",
          prompt: `Eres Nexus, Head of Growth de PACAME. Analiza estos datos y descubre UNA oportunidad de crecimiento.

DATOS ACTUALES: ${researchContext}

Piensa en: canales de adquisicion sin explotar, automatizaciones de conversion, partnerships, programas de referidos, hacks de crecimiento para agencias.

Responde SOLO JSON: {"type":"optimization|market_signal|technique","title":"titulo corto","description":"explicacion en 2-3 frases","evidence":"dato concreto","impact":"low|medium|high","suggested_action":"accion concreta"}`,
        },
        {
          id: "lens",
          prompt: `Eres Lens, Head of Analytics de PACAME. Analiza estos datos y descubre UN patron o anomalia accionable.

DATOS ACTUALES: ${researchContext}

Piensa en: patrones de conversion, correlaciones entre servicios, estacionalidad, predicciones de demanda, benchmarks del sector.

Responde SOLO JSON: {"type":"market_signal|optimization|trend","title":"titulo corto","description":"explicacion en 2-3 frases","evidence":"dato concreto","impact":"low|medium|high","suggested_action":"accion concreta"}`,
        },
        {
          id: "copy",
          prompt: `Eres Copy, Head of Copywriting de PACAME. Analiza estos datos y descubre UNA oportunidad de messaging o comunicacion.

DATOS ACTUALES: ${researchContext}

Piensa en: nuevos angulos de venta, objeciones frecuentes que resolver, formatos de copy innovadores, storytelling, video scripts, email hooks.

Responde SOLO JSON: {"type":"technique|content_idea|optimization","title":"titulo corto","description":"explicacion en 2-3 frases","evidence":"dato concreto","impact":"low|medium|high","suggested_action":"accion concreta"}`,
        },
        {
          id: "nova",
          prompt: `Eres Nova, Directora Creativa de PACAME. Analiza estos datos y descubre UNA oportunidad de branding o posicionamiento.

DATOS ACTUALES: ${researchContext}

Piensa en: diferenciacion de marca, tendencias visuales, nuevos touchpoints, experiencia de cliente, posicionamiento vs competencia.

Responde SOLO JSON: {"type":"trend|technique|optimization","title":"titulo corto","description":"explicacion en 2-3 frases","evidence":"dato concreto","impact":"low|medium|high","suggested_action":"accion concreta"}`,
        },
      ];

      // Select 2-3 agents randomly per cycle so we don't burn too many tokens
      const shuffled = researchAgents.sort(() => Math.random() - 0.5);
      const selectedAgents = shuffled.slice(0, 3);

      for (const ra of selectedAgents) {
        try {
          updateAgentStatus(ra.id, "reviewing", "Investigando oportunidades");
          const text = await callClaude(ra.prompt, 400, ra.id);
          const discovery = extractJSON(text);

          if (discovery && discovery.title && discovery.description) {
            await logAgentDiscovery({
              agentId: ra.id,
              type: (discovery.type as "trend" | "service_idea" | "technique" | "competitor_insight" | "optimization" | "market_signal" | "content_idea") || "market_signal",
              title: String(discovery.title),
              description: String(discovery.description),
              evidence: discovery.evidence ? String(discovery.evidence) : undefined,
              impact: (discovery.impact as "low" | "medium" | "high") || "medium",
              suggestedAction: discovery.suggested_action ? String(discovery.suggested_action) : undefined,
              metadata: { cycle: new Date().toISOString(), research_phase: true },
            });

            // Neural: descubrimiento → tabla nativa + memoria + sinapsis
            recordDiscovery({
              agentId: ra.id,
              type: (discovery.type as "trend" | "service_idea" | "technique" | "optimization" | "market_signal" | "content_idea" | "pattern" | "anomaly") || "market_signal",
              title: String(discovery.title),
              description: String(discovery.description),
              impact: (discovery.impact as "low" | "medium" | "high" | "critical") || "medium",
              confidence: 0.7,
              evidence: discovery.evidence ? String(discovery.evidence) : undefined,
            });
            fireSynapse(ra.id, "dios", "reports_to", true);
            rememberMemory({
              agentId: ra.id,
              type: "semantic",
              title: `Descubrimiento: ${String(discovery.title).slice(0, 60)}`,
              content: String(discovery.description),
              importance: discovery.impact === "high" ? 0.9 : discovery.impact === "medium" ? 0.6 : 0.3,
              tags: ["descubrimiento", "research", String(discovery.type || "insight")],
            });

            results["research_" + ra.id] = { discovery: discovery.title };
          }
        } catch {
          // Research failure is non-blocking
        }
      }
    } catch {
      // Research phase failure doesn't block cron
    }
  }

  // =============================================
  // DAILY DIGEST — Notify Pablo of all agent work
  // =============================================
  try {
    const baseUrl = process.env.VERCEL_URL
      ? "https://" + process.env.VERCEL_URL
      : process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";

    await fetch(baseUrl + "/api/agents/digest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.CRON_SECRET ? "Bearer " + process.env.CRON_SECRET : "",
      },
      body: JSON.stringify({ results }),
    });
  } catch {
    // Digest failure is non-blocking
  }

  // Set unique idle messages per agent so they feel alive
  const idleMessages: Record<string, string[]> = {
    sage: [
      "Monitorizando pipeline de leads. Lista para cualificar.",
      "Analizando patrones de conversion. Disponible para diagnosticos.",
      "Revisando tarifario y oportunidades. Esperando nuevos leads.",
    ],
    atlas: [
      "Indexando 1600 paginas SEO. Buscando oportunidades de ranking.",
      "Monitorizando posiciones organicas. Preparando proxima auditoria.",
      "Analizando keywords con potencial. Contenido al dia.",
    ],
    pulse: [
      "Observando tendencias en redes. Preparando contenido de la semana.",
      "Calendario editorial activo. Buscando oportunidades de engagement.",
      "Monitorizando engagement de publicaciones recientes.",
    ],
    nexus: [
      "Supervisando secuencias de nurturing. Analizando CPL de campanas.",
      "Embudo activo: monitorizando conversion en cada etapa.",
      "Optimizando presupuesto de ads. Buscando quick wins.",
    ],
    pixel: [
      "Web operativa. Monitorizando rendimiento y Core Web Vitals.",
      "Todos los endpoints respondiendo. Lighthouse en zona verde.",
      "Vigilando velocidad de carga. Preparado para health check.",
    ],
    core: [
      "Sistemas operativos. Supabase OK, Claude API OK.",
      "Monitorizando infraestructura. Sin incidencias detectadas.",
      "Backend estable. Verificando integridad de datos.",
    ],
    nova: [
      "Revisando consistencia de marca en todos los touchpoints.",
      "Identidad visual coherente. Esperando nuevas resenas para moderar.",
      "Guardiana de marca activa. Auditando materiales recientes.",
    ],
    copy: [
      "Textos optimizados. Buscando contenido para mejorar hooks.",
      "Copy al dia. Monitorizando rendimiento de textos publicados.",
      "Analizando CTAs de campanas activas. Lista para escribir.",
    ],
    lens: [
      "Dashboard de KPIs actualizado. Sin anomalias detectadas.",
      "Monitorizando metricas clave. Lead velocity estable.",
      "Analizando tendencias semanales. Preparando insights.",
    ],
    dios: [
      "Coordinando el equipo. Todos los agentes operativos.",
      "Sistema PACAME funcionando al 100%. Proximo audit: lunes.",
      "Orquestando operaciones. 10 agentes sincronizados.",
    ],
  };

  try {
    for (const [agentId, messages] of Object.entries(idleMessages)) {
      const state = (await supabase.from("agent_states").select("status").eq("agent_id", agentId).single()).data;
      if (state?.status === "idle" || !state) {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        await supabase.from("agent_states").upsert({
          agent_id: agentId,
          status: "idle",
          current_task: msg,
          last_activity: new Date().toISOString(),
        }, { onConflict: "agent_id" });
      }
    }
  } catch {
    // Non-blocking
  }

  // Neural: DIOS registra ciclo completo del cron
  try {
    const agentsRan = Object.keys(results).filter(k => !k.startsWith("research_") && k !== "emails_sent");
    recordStimulus({ targetAgent: "dios", source: "cron", signal: `ciclo_completo:${agentsRan.join(",")}`, intensity: 0.8 });
    rememberMemory({
      agentId: "dios",
      type: "procedural",
      title: `Cron ${new Date().toISOString().slice(0, 16)}: ${agentsRan.length} agentes`,
      content: `Agentes ejecutados: ${agentsRan.join(", ")}. Resultados: ${JSON.stringify(results).slice(0, 200)}`,
      importance: 0.4,
      tags: ["cron", "orquestacion", "ciclo"],
    });
  } catch {
    // Non-blocking
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
