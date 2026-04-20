/**
 * Outreach engine — invocado por /api/marketplace/outreach-cron.
 *
 * Flujo:
 *  1. Pick nicho del dia (rotativo)
 *  2. Scrape Google Maps via Apify (5-10 businesses)
 *  3. Por cada: enriquecer email (si hay website) + dedupe contra outreach_leads + unsubscribe list
 *  4. Copy: email personalizado mencionando producto entry del nicho
 *  5. Send via Resend (o log si dry_run) + insert outreach_touches
 *  6. Update campaign metrics
 *
 * Modo DRY_RUN por defecto (env OUTREACH_DRY_RUN=true).
 * Los primeros 7 dias se loggea lo que se enviaria sin enviar.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import { llmChat, extractJSON } from "@/lib/llm";
import { findEmailsFromWebsite } from "@/lib/email-enrichment";
import { auditLog } from "@/lib/security/audit";
import { createHash, randomBytes } from "node:crypto";
import { Niche } from "./niches";
import { scrapeGoogleMaps, normalizeBusinessRecord } from "./apify-client";

const DEFAULT_TARGET_COUNT = 5;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://pacameagencia.com";

export interface EngineOptions {
  niche: Niche;
  dryRun?: boolean;
  targetCount?: number;
}

export interface EngineResult {
  campaignId: string;
  scraped: number;
  enriched: number;
  sent: number;
  errors: string[];
}

export async function runOutreachCampaign(opts: EngineOptions): Promise<EngineResult> {
  const log = getLogger({ niche: opts.niche.slug });
  const supabase = createServerSupabase();
  const dryRun = opts.dryRun ?? process.env.OUTREACH_DRY_RUN !== "false";
  const targetCount = opts.targetCount ?? DEFAULT_TARGET_COUNT;
  const errors: string[] = [];

  // 1. Crear campaign row
  const { data: campaign, error: campaignErr } = await supabase
    .from("outreach_campaigns")
    .insert({
      niche_slug: opts.niche.slug,
      niche_label: opts.niche.label,
      location: opts.niche.location,
      status: "scraping",
      target_product_slugs: opts.niche.targetProductSlugs,
      target_count: targetCount,
      dry_run: dryRun,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (campaignErr || !campaign) {
    log.error({ err: campaignErr }, "outreach campaign insert failed");
    throw new Error(`Campaign insert failed: ${campaignErr?.message}`);
  }
  const campaignId = campaign.id as string;

  let scraped = 0;
  let enriched = 0;
  let sent = 0;

  try {
    // 2. Scrape
    const businesses = await scrapeGoogleMaps(
      opts.niche.searchQuery,
      opts.niche.location,
      targetCount * 3 // sobre-scrape, luego filtrado
    );
    scraped = businesses.length;
    log.info({ campaignId, scraped }, "outreach scrape done");

    await supabase
      .from("outreach_campaigns")
      .update({ status: "enriching", scraped_count: scraped })
      .eq("id", campaignId);

    if (scraped === 0) {
      await supabase
        .from("outreach_campaigns")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", campaignId);
      return { campaignId, scraped, enriched, sent, errors };
    }

    // 3. Enrich + dedupe
    const leadIds: string[] = [];
    for (const raw of businesses.slice(0, targetCount * 2)) {
      try {
        const norm = normalizeBusinessRecord(raw);

        // Dedupe por place_id
        if (norm.google_place_id) {
          const { data: existing } = await supabase
            .from("outreach_leads")
            .select("id, status")
            .eq("google_place_id", norm.google_place_id)
            .maybeSingle();
          if (existing) {
            log.info({ placeId: norm.google_place_id }, "skip: already in outreach_leads");
            continue;
          }
        }

        // Enriquecer email
        let email: string | null = null;
        if (norm.website) {
          try {
            const emails = await findEmailsFromWebsite(norm.website);
            email = emails[0] || null;
          } catch (err) {
            log.warn({ website: norm.website, err }, "email enrichment failed");
          }
        }

        if (!email) {
          log.info({ business: norm.business_name }, "skip: no email extracted");
          continue;
        }

        // Check unsubscribes
        const emailHash = sha256Lower(email);
        const { data: unsub } = await supabase
          .from("outreach_unsubscribes")
          .select("id")
          .eq("email_hash", emailHash)
          .maybeSingle();
        if (unsub) {
          log.info({}, "skip: email unsubscribed");
          continue;
        }

        // Dedupe por email tambien
        const { data: existingEmail } = await supabase
          .from("outreach_leads")
          .select("id")
          .eq("email", email.toLowerCase())
          .maybeSingle();
        if (existingEmail) {
          log.info({}, "skip: email already targeted");
          continue;
        }

        // Insert lead
        const { data: leadRow, error: leadErr } = await supabase
          .from("outreach_leads")
          .insert({
            campaign_id: campaignId,
            niche_slug: opts.niche.slug,
            business_name: norm.business_name,
            website: norm.website,
            email: email.toLowerCase(),
            phone: norm.phone,
            address: norm.address,
            city: norm.city,
            google_place_id: norm.google_place_id,
            rating: norm.rating,
            review_count: norm.review_count,
            sector: opts.niche.sector,
            status: "enriched",
            signals: {
              has_website: !!norm.website,
              rating: norm.rating,
              review_count: norm.review_count,
            },
          })
          .select("id")
          .single();

        if (leadErr || !leadRow) {
          log.warn({ err: leadErr }, "lead insert failed");
          continue;
        }

        leadIds.push(leadRow.id as string);
        enriched++;
        if (leadIds.length >= targetCount) break;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    await supabase
      .from("outreach_campaigns")
      .update({ status: "sending", enriched_count: enriched })
      .eq("id", campaignId);

    // 4. Write + send emails
    for (const leadId of leadIds) {
      try {
        const composed = await composeOutreachEmail(leadId, opts.niche, campaignId);
        if (!composed) continue;

        const { subject, body, email, unsubscribeToken } = composed;

        if (dryRun) {
          log.info({ leadId, subject, email }, "outreach email DRY RUN");
        } else {
          // Inline GDPR footer en el body (wrapEmailTemplate no tiene opcion footer)
          const unsubUrl = `${BASE_URL}/api/outreach/unsubscribe?t=${unsubscribeToken}`;
          const bodyWithFooter =
            body +
            `\n\n---\n\nSi no quieres recibir mas correos de PACAME, [darte de baja aqui](${unsubUrl}).\n\nPACAME Agencia · pacameagencia.com · Responsable: Pablo Calleja (LOPD)`;

          const resendId = await sendEmail({
            to: email,
            subject,
            html: wrapEmailTemplate(bodyWithFooter, {
              preheader: subject,
              cta: `Ver ${opts.niche.entryProductSlug.replace(/-/g, " ")}`,
              ctaUrl: `${BASE_URL}/servicios/${opts.niche.entryProductSlug}?utm_source=outreach&utm_medium=email&utm_campaign=${opts.niche.slug}&utm_content=touch1`,
            }),
            tags: [
              { name: "type", value: "outreach" },
              { name: "niche", value: opts.niche.slug },
              { name: "campaign", value: campaignId },
              { name: "touch", value: "1" },
            ],
          });

          // Record touch
          await supabase.from("outreach_touches").insert({
            lead_id: leadId,
            campaign_id: campaignId,
            touch_number: 1,
            channel: "email",
            direction: "outbound",
            subject,
            body,
            resend_email_id: resendId,
            sent_at: resendId ? new Date().toISOString() : null,
            metadata: { unsubscribe_token: unsubscribeToken },
          });

          if (resendId) sent++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(msg);
        log.error({ err, leadId }, "outreach send failed");
      }
    }

    // 5. Close campaign
    await supabase
      .from("outreach_campaigns")
      .update({
        status: "completed",
        sent_count: sent,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    await auditLog({
      actor: { type: "system", id: "outreach-cron" },
      action: dryRun ? "outreach.dry_run" : "outreach.campaign_sent",
      resource: { type: "outreach_campaigns", id: campaignId },
      metadata: {
        niche: opts.niche.slug,
        scraped,
        enriched,
        sent,
        dry_run: dryRun,
      },
    });

    return { campaignId, scraped, enriched, sent, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("outreach_campaigns")
      .update({
        status: "failed",
        error: msg,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaignId);
    throw err;
  }
}

/** Compose personalized outreach email via LLM. */
async function composeOutreachEmail(
  leadId: string,
  niche: Niche,
  campaignId: string
): Promise<{
  subject: string;
  body: string;
  email: string;
  unsubscribeToken: string;
} | null> {
  const supabase = createServerSupabase();
  const { data: lead } = await supabase
    .from("outreach_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead || !lead.email) return null;

  const { data: product } = await supabase
    .from("service_catalog")
    .select("name, tagline, price_cents")
    .eq("slug", niche.entryProductSlug)
    .maybeSingle();

  const prompt = `Eres Copy, senior cold-email writer de PACAME (agencia digital con IA para PYMEs en Espana).

LEAD:
- Nombre: ${lead.business_name}
- Sector: ${niche.label}
- Web: ${lead.website || "(sin web visible)"}
- Ciudad: ${lead.city || niche.location}
- Rating Google: ${lead.rating || "s/d"} (${lead.review_count || 0} resenas)

PRODUCTO A OFRECER (el mas urgente para este nicho):
- ${product?.name || niche.entryProductSlug} — ${product?.tagline || ""} — ${product?.price_cents ? product.price_cents / 100 : ""}€

DOLORES TIPICOS DEL NICHO:
${niche.painPoints.map((p) => `- ${p}`).join("\n")}

OBJETIVO: Cold email B2B corto (60-100 palabras) que:
- Empieza con UNA observacion especifica del lead (no "espero que estes bien")
- Menciona UN dolor de los tipicos con naturalidad
- Ofrece el producto como solucion ("tenemos este producto desde X€ que...")
- Cierra con pregunta simple ("¿te interesa un ejemplo de como quedaria?")
- Tuteo espanol, tono cercano pro, no comercial, sin emojis
- NO uses "transformacion", "digitalizacion", "potenciar" ni clichs

FORMATO (JSON estricto):
{"subject":"max 55 chars sin emoji","body":"texto cold email con \\n\\n entre parrafos"}

Responde SOLO JSON.`;

  try {
    const result = await llmChat([{ role: "user", content: prompt }], {
      tier: "premium",
      maxTokens: 800,
      temperature: 0.85,
      callSite: "outreach/cold_email",
    });
    const parsed = extractJSON<{ subject: string; body: string }>(result.content);
    if (!parsed?.subject || !parsed?.body) {
      getLogger().warn({ leadId }, "outreach email JSON parse failed");
      return null;
    }

    const unsubscribeToken = randomBytes(24).toString("hex");

    // Persist unsub token to lead metadata for later verify
    await supabase
      .from("outreach_leads")
      .update({
        signals: {
          ...(lead.signals || {}),
          unsubscribe_token: unsubscribeToken,
        },
      })
      .eq("id", leadId);

    return {
      subject: parsed.subject.slice(0, 90),
      body: parsed.body,
      email: lead.email as string,
      unsubscribeToken,
    };
  } catch (err) {
    getLogger().error({ err, leadId }, "compose email failed");
    return null;
  }
}

function sha256Lower(s: string): string {
  return createHash("sha256").update(s.toLowerCase()).digest("hex");
}

/** Composer follow-up (touch 2/3). Usado por outreach-followup-cron. */
export async function composeFollowupEmail(
  leadId: string,
  touchNumber: 2 | 3
): Promise<{ subject: string; body: string; email: string } | null> {
  const supabase = createServerSupabase();
  const { data: lead } = await supabase
    .from("outreach_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead || !lead.email) return null;

  const isLastTouch = touchNumber === 3;
  const prompt = `Eres Copy, senior cold-email writer. Follow-up ${touchNumber}/3 a ${lead.business_name} (${lead.niche_slug}).

${isLastTouch ? 'ULTIMO TOUCH — tono "bump, cerramos el tema" honesto. Max 40 palabras. Pregunta si quiere que paremos de escribir.' : 'TOUCH 2 — aporta valor (1 insight especifico del sector) y reengaga sin suplicar. Max 60 palabras.'}

FORMATO JSON: {"subject":"max 50 chars","body":"texto"}. SOLO JSON.`;

  try {
    const result = await llmChat([{ role: "user", content: prompt }], {
      tier: "premium",
      maxTokens: 500,
      temperature: 0.8,
      callSite: "outreach/followup",
    });
    const parsed = extractJSON<{ subject: string; body: string }>(result.content);
    if (!parsed?.subject || !parsed?.body) return null;
    return { subject: parsed.subject, body: parsed.body, email: lead.email as string };
  } catch {
    return null;
  }
}
