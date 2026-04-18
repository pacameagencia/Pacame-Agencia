import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { llmChat } from "@/lib/llm";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import { getLogger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/marketplace/upsell-cron
 *
 * Cron diario (09:00) que envia emails de upsell a clientes con pedidos
 * entregados entre D+7 y D+30, con mapping producto → siguiente paso logico.
 *
 * Inserta en `upsell_campaigns` para que no se repita (UNIQUE order_id).
 * Usa llm tier="economy" para personalizar subject line.
 */

interface UpsellMapping {
  targetSlugs: string[];
  campaign: string;
  hook: string;
  targetLabel: string;
}

const UPSELL_MAP: Record<string, UpsellMapping> = {
  "logo-express": {
    targetSlugs: ["landing-1page", "favicon-pack"],
    campaign: "logo_to_web_bundle",
    hook: "Un logo sin web es como una tarjeta sin telefono — te recomiendo cerrar el pack con una landing de 1 pagina + favicon para quedar redondo.",
    targetLabel: "landing 1 pagina + favicon pack",
  },
  "copy-hero-cta": {
    targetSlugs: ["landing-1page"],
    campaign: "copy_to_web",
    hook: "Ya tienes el copy del hero. Monta una landing 1 pagina con ese copy y empieza a convertir visitas en leads esta semana.",
    targetLabel: "landing 1 pagina",
  },
  "post-instagram": {
    targetSlugs: ["subscription-pro"],
    campaign: "post_to_subscription",
    hook: "Un post suelto esta bien. Publicar 3 veces por semana sin pensar, con el plan Pro mensual, es lo que de verdad mueve seguidores y ventas.",
    targetLabel: "plan mensual Pro",
  },
  "landing-1page": {
    targetSlugs: ["subscription-pro"],
    campaign: "landing_to_subscription",
    hook: "La landing ya convierte. Ahora toca que la web no se quede quieta: SEO + contenido + optimizaciones continuas con el plan Pro.",
    targetLabel: "plan mensual Pro",
  },
  "favicon-pack": {
    targetSlugs: ["logo-express"],
    campaign: "favicon_to_logo",
    hook: "Tienes el favicon. Si aun no tienes un logo profesional que case con el, este es el momento de cerrar el look.",
    targetLabel: "logo express",
  },
  "seo-audit-pdf": {
    targetSlugs: ["subscription-growth"],
    campaign: "audit_to_growth",
    hook: "La auditoria SEO te muestra el quien. El plan Growth es el como: ejecutamos nosotros las acciones recomendadas cada mes.",
    targetLabel: "plan mensual Growth",
  },
  // ── Productos nuevos (migracion 020) ──
  "bio-instagram": {
    targetSlugs: ["post-instagram"],
    campaign: "bio_to_post",
    hook: "Bio nueva + 0 posts nuevos = 0 engagement. Con un post publicado hoy empiezas a captar seguidores manana.",
    targetLabel: "1 post Instagram",
  },
  "post-tiktok": {
    targetSlugs: ["subscription-pro"],
    campaign: "tiktok_to_subscription",
    hook: "Un guion TikTok por semana es lo que marca la diferencia. Plan Pro te garantiza 4 posts al mes con consistencia.",
    targetLabel: "plan mensual Pro",
  },
  "post-linkedin": {
    targetSlugs: ["subscription-pro"],
    campaign: "linkedin_to_subscription",
    hook: "LinkedIn recompensa la constancia. Con el plan Pro publicas 4 posts/mes y empiezas a ser nombre en tu sector.",
    targetLabel: "plan mensual Pro",
  },
  "caption-optimization": {
    targetSlugs: ["post-instagram", "post-tiktok"],
    campaign: "caption_to_content",
    hook: "Optimizar caption esta bien. Crear contenido nuevo es lo que sube las metricas. Te recomiendo un post fresco.",
    targetLabel: "post IG o TikTok",
  },
  "thank-you-page": {
    targetSlugs: ["email-sequence-5"],
    campaign: "ty_to_sequence",
    hook: "La pagina gracias capta al usuario. La secuencia email de 5 pasos convierte su interes en venta durante el mes siguiente.",
    targetLabel: "secuencia email 5 pasos",
  },
  "404-page": {
    targetSlugs: ["landing-1page"],
    campaign: "404_to_landing",
    hook: "404 arreglada — ahora que la web no pierde usuarios, toca convertir a los que llegan. Landing 1 pagina optimizada.",
    targetLabel: "landing 1 pagina",
  },
  "color-palette": {
    targetSlugs: ["logo-express", "brand-guidelines-mini"],
    campaign: "colors_to_brand",
    hook: "Paleta lista. Cierra la identidad con logo + guidelines para que todo el equipo tire en la misma direccion.",
    targetLabel: "logo + brand guidelines",
  },
  "brand-guidelines-mini": {
    targetSlugs: ["landing-1page"],
    campaign: "brand_to_web",
    hook: "Tienes la marca. Ahora una web que refleje esa marca: landing 1 pagina con tu identidad aplicada.",
    targetLabel: "landing 1 pagina",
  },
  "meta-tags-optimization": {
    targetSlugs: ["schema-markup-setup", "subscription-growth"],
    campaign: "meta_to_schema",
    hook: "Meta tags + schema markup = combo perfecto para rich snippets y CTR. El plan Growth incluye ambos cada mes.",
    targetLabel: "schema markup o plan Growth",
  },
  "schema-markup-setup": {
    targetSlugs: ["seo-audit-pdf"],
    campaign: "schema_to_audit",
    hook: "Schema listo. Para subir el ranking falta auditoria SEO completa que te diga donde estan los bloqueos tecnicos.",
    targetLabel: "auditoria SEO",
  },
  "meta-pixel-setup": {
    targetSlugs: ["utm-strategy", "ga4-setup"],
    campaign: "pixel_to_tracking",
    hook: "Pixel Meta ya trackea. Te falta la estrategia UTM + GA4 para saber que canal trae cada euro. Paquete analytics completo.",
    targetLabel: "UTM + GA4 tracking",
  },
  "utm-strategy": {
    targetSlugs: ["ga4-setup"],
    campaign: "utm_to_ga4",
    hook: "UTMs listas. Ahora GA4 para leer esos datos — dashboard + conversiones + audiencias remarketing.",
    targetLabel: "setup GA4",
  },
  "whatsapp-button": {
    targetSlugs: ["contact-form-setup", "post-instagram"],
    campaign: "wa_to_funnel",
    hook: "Boton WhatsApp activo. Ahora formulario pro + contenido social para llenar ese WhatsApp.",
    targetLabel: "formulario + post",
  },
  "contact-form-setup": {
    targetSlugs: ["email-sequence-5"],
    campaign: "form_to_nurturing",
    hook: "Formulario captura leads. Secuencia email los convierte. 5 emails automaticos que venden mientras duermes.",
    targetLabel: "secuencia email 5 pasos",
  },
  "google-business-setup": {
    targetSlugs: ["subscription-pro"],
    campaign: "gbp_to_subscription",
    hook: "Ficha Google optimizada — pero necesitas resenas fresh cada mes para subir en maps. Plan Pro incluye gestion continua.",
    targetLabel: "plan mensual Pro",
  },
  "ga4-setup": {
    targetSlugs: ["subscription-growth"],
    campaign: "ga4_to_growth",
    hook: "GA4 instalado. El proximo paso es accionar esos datos mensualmente — informe + ads optimizadas = plan Growth.",
    targetLabel: "plan mensual Growth",
  },
  "email-sequence-5": {
    targetSlugs: ["newsletter-1-month", "subscription-pro"],
    campaign: "sequence_to_newsletter",
    hook: "Secuencia lista para autoplay. Complementa con newsletter mensual para mantener la lista caliente entre lanzamientos.",
    targetLabel: "newsletter mensual o plan Pro",
  },
  "newsletter-1-month": {
    targetSlugs: ["subscription-pro"],
    campaign: "newsletter_to_subscription",
    hook: "Una newsletter bien, pero 4 al mes es como se construye audiencia real. Plan Pro te garantiza consistencia.",
    targetLabel: "plan mensual Pro",
  },
};

interface OrderRow {
  id: string;
  order_number: string | null;
  customer_email: string | null;
  customer_name: string | null;
  client_id: string | null;
  service_slug: string;
  delivered_at: string | null;
  svc_slug: string | null;
}

export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const supabase = createServerSupabase();

  // Orders delivered entre D+7 y D+30, con email, sin upsell_campaigns aun
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: raw, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_email, customer_name, client_id, service_slug, delivered_at, service_catalog:service_catalog_id(slug)"
    )
    .eq("status", "delivered")
    .lt("delivered_at", sevenDaysAgo)
    .gt("delivered_at", thirtyDaysAgo)
    .not("customer_email", "is", null)
    .limit(100);

  if (error) {
    getLogger().error({ err: error }, "[upsell-cron] query fallo");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const candidates: OrderRow[] = (raw || []).map((r) => {
    const sc = (r as unknown as { service_catalog?: { slug?: string } | null }).service_catalog;
    return {
      id: r.id as string,
      order_number: (r.order_number as string | null) ?? null,
      customer_email: (r.customer_email as string | null) ?? null,
      customer_name: (r.customer_name as string | null) ?? null,
      client_id: (r.client_id as string | null) ?? null,
      service_slug: r.service_slug as string,
      delivered_at: (r.delivered_at as string | null) ?? null,
      svc_slug: sc?.slug || null,
    };
  });

  // Filtra los que ya tienen campaign y los que no tienen mapping
  const orderIds = candidates.map((c) => c.id);
  const { data: existing } = orderIds.length
    ? await supabase
        .from("upsell_campaigns")
        .select("order_id")
        .in("order_id", orderIds)
    : { data: [] as { order_id: string }[] };
  const sent = new Set((existing || []).map((r) => r.order_id as string));

  const toProcess = candidates
    .filter((o) => !sent.has(o.id))
    .filter((o) => {
      const key = o.svc_slug || o.service_slug;
      return !!UPSELL_MAP[key];
    })
    .slice(0, 50);

  const results: Array<{ order_id: string; sent: boolean; reason?: string }> = [];

  for (const order of toProcess) {
    try {
      const key = order.svc_slug || order.service_slug;
      const mapping = UPSELL_MAP[key];
      const firstName =
        (order.customer_name || "").split(" ")[0] ||
        (order.customer_email ? order.customer_email.split("@")[0] : "hola");

      // Subject line personalizado (tier economy → Gemma gratis → fallback)
      let subject = `${firstName}, siguiente paso tras tu ${order.service_slug}`;
      try {
        const llm = await llmChat(
          [
            {
              role: "system",
              content:
                "Eres un copywriter de PACAME. Escribes subject lines de email cortos (max 60 chars), tuteando, en espanol, directos, sin humo. Devuelve SOLO el subject, sin comillas ni explicacion.",
            },
            {
              role: "user",
              content:
                `Cliente: ${firstName}\n` +
                `Compro: ${order.service_slug}\n` +
                `Proximo paso que le recomendamos: ${mapping.targetLabel}\n` +
                `Hace: ~7 dias\n\n` +
                `Genera UN subject line para el email, tipo "Hola ${firstName}, despues de tu logo — ¿siguiente paso?". Maximo 60 chars. Solo el subject.`,
            },
          ],
          { tier: "economy", maxTokens: 40, temperature: 0.8 }
        );
        const trimmed = llm.content.replace(/^["'\s]+|["'\s]+$/g, "").split("\n")[0];
        if (trimmed && trimmed.length >= 8 && trimmed.length <= 80) {
          subject = trimmed;
        }
      } catch (err) {
        getLogger().warn({ err: err as Error }, "[upsell-cron] subject LLM fallo (uso fallback)");
      }

      const catalogUrl = `https://pacameagencia.com/servicios/${mapping.targetSlugs[0]}?code=UPSELL15&ref=upsell`;

      const body =
        `Hola ${firstName},\n\n` +
        `Hace unos dias cerramos tu ${order.service_slug.replace(/-/g, " ")} y queria seguir el hilo.\n\n` +
        `${mapping.hook}\n\n` +
        `Como ya eres cliente, te dejo un 15% en el primer mes con el codigo UPSELL15 (valido 7 dias).\n\n` +
        `Si encaja, dime y lo arrancamos esta semana. Si no es el momento, todo bien — seguimos aqui cuando lo necesites.\n\n` +
        `Pablo + equipo PACAME`;

      const html = wrapEmailTemplate(body, {
        cta: `Ver ${mapping.targetLabel}`,
        ctaUrl: catalogUrl,
        preheader: `Siguiente paso tras tu ${order.service_slug} — 15% off con UPSELL15`,
      });

      if (!order.customer_email) {
        results.push({ order_id: order.id, sent: false, reason: "no_email" });
        continue;
      }

      const emailId = await sendEmail({
        to: order.customer_email,
        subject,
        html,
        tags: [
          { name: "type", value: "upsell" },
          { name: "campaign", value: mapping.campaign },
          { name: "order_id", value: order.id },
        ],
      });

      // Registra campaign (unique order_id — si hay race, falla silente)
      const { error: insErr } = await supabase.from("upsell_campaigns").insert({
        order_id: order.id,
        campaign: mapping.campaign,
        target_service_slugs: mapping.targetSlugs,
        subject_line: subject,
        email_body: body.slice(0, 4000),
        sent_at: new Date().toISOString(),
      });
      if (insErr) {
        getLogger().error({ err: insErr }, "[upsell-cron] insert upsell_campaigns fallo");
      }

      results.push({ order_id: order.id, sent: !!emailId });
    } catch (err) {
      getLogger().error({ err, orderId: order.id }, "[upsell-cron] order fallo");
      results.push({ order_id: order.id, sent: false, reason: (err as Error).message.slice(0, 120) });
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    processed: results.length,
    sent: results.filter((r) => r.sent).length,
    results,
  });
}
