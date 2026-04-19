/**
 * Enrichment heuristico de LinkedIn URL para leads outreach.
 *
 * Esto es BEST-EFFORT: construye una URL candidata a partir del business_name
 * con confidence 0.3 y la guarda en lead_channel_preferences.
 * Un humano o un scraper posterior puede validar/corregir.
 *
 * TODO: integrar Google CSE / SerpAPI para validar que el company page existe
 * antes de persistir una URL con confianza > 0.3.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

/** Normaliza un nombre de negocio a slug estilo LinkedIn. */
function slugify(businessName: string): string {
  return businessName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export interface EnrichResult {
  skipped: boolean;
  reason?: string;
  linkedin_url?: string;
  confidence?: number;
}

/**
 * Intenta rellenar lead_channel_preferences.linkedin_url con un candidate URL.
 * No hace requests externos — solo heuristica sobre el business_name.
 */
export async function enrichLeadLinkedin(leadId: string): Promise<EnrichResult> {
  const supabase = createServerSupabase();

  try {
    // 1. Ya tenemos pref guardada?
    const { data: existing } = await supabase
      .from("lead_channel_preferences")
      .select("linkedin_url")
      .eq("lead_id", leadId)
      .maybeSingle();

    if (existing?.linkedin_url) {
      return {
        skipped: true,
        reason: "already_enriched",
        linkedin_url: existing.linkedin_url as string,
      };
    }

    // 2. Carga el lead
    const { data: lead, error: leadErr } = await supabase
      .from("outreach_leads")
      .select("id, business_name, website")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) {
      return { skipped: true, reason: "lead_not_found" };
    }

    const businessName = (lead.business_name as string) || "";
    if (!businessName) {
      return { skipped: true, reason: "no_business_name" };
    }

    const slug = slugify(businessName);
    if (!slug) {
      return { skipped: true, reason: "slug_empty" };
    }

    const candidateUrl = `https://www.linkedin.com/company/${slug}`;
    const confidence = 0.3;

    // 3. Upsert preferencia
    const { error: upsertErr } = await supabase
      .from("lead_channel_preferences")
      .upsert(
        {
          lead_id: leadId,
          linkedin_url: candidateUrl,
          linkedin_confidence: confidence,
          enrichment_sources: ["heuristic"],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "lead_id" }
      );

    if (upsertErr) {
      getLogger().warn(
        { err: upsertErr, leadId },
        "[enrichment] upsert lead_channel_preferences failed"
      );
      return { skipped: true, reason: "upsert_failed" };
    }

    return {
      skipped: false,
      linkedin_url: candidateUrl,
      confidence,
    };
  } catch (err) {
    getLogger().warn({ err, leadId }, "[enrichment] unexpected error");
    return {
      skipped: true,
      reason: err instanceof Error ? err.message : "unknown_error",
    };
  }
}
