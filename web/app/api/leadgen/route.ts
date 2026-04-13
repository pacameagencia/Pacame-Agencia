import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";

const supabase = createServerSupabase();

const APIFY_API_KEY = process.env.APIFY_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const APIFY_ACTOR = "nwua9Gu5YrADL7ZDj"; // Google Maps Scraper

// POST: Launch a new lead gen campaign
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, niche, city, maxResults = 50, runId } = body;

  // --- ACTION: SCRAPE ---
  if (action === "scrape") {
    if (!APIFY_API_KEY) {
      return NextResponse.json({ error: "APIFY_API_KEY not configured" }, { status: 500 });
    }

    const searchQuery = `${niche} en ${city}`;
    try {
      const res = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR}/runs?token=${APIFY_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchStringsArray: [searchQuery],
            maxCrawledPlacesPerSearch: maxResults,
            language: "es",
            includeWebResults: false,
          }),
        }
      );
      const data = await res.json();
      // Log to Oficina
      logAgentActivity({
        agentId: "sage",
        type: "task_started",
        title: `Campaña outbound: ${searchQuery}`,
        description: `Scraping Google Maps: ${searchQuery} (max ${maxResults} resultados)`,
        metadata: { runId: data.data?.id, niche, city },
      });

      return NextResponse.json({
        runId: data.data?.id,
        status: "running",
        query: searchQuery,
      });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // --- ACTION: RESULTS ---
  if (action === "results") {
    if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

    try {
      // Check run status first
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`
      );
      const statusData = await statusRes.json();

      if (statusData.data?.status !== "SUCCEEDED") {
        return NextResponse.json({
          status: statusData.data?.status || "UNKNOWN",
          message: "Scraping still in progress...",
        });
      }

      // Fetch results
      const res = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_KEY}`
      );
      const items = await res.json();

      const leads = items.map((item: Record<string, unknown>) => ({
        name: item.title || "",
        address: item.address || "",
        phone: item.phone || "",
        website: item.website || "",
        rating: item.totalScore || 0,
        reviews: item.reviewsCount || 0,
        category: item.categoryName || "",
        city: item.city || city || "",
        maps_url: item.url || "",
      }));

      return NextResponse.json({ status: "SUCCEEDED", leads, total: leads.length });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // --- ACTION: AUDIT ---
  if (action === "audit") {
    const { url } = body;
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

    try {
      const targetUrl = url.startsWith("http") ? url : `https://${url}`;
      const start = Date.now();
      const res = await fetch(targetUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "PACAME-Audit/1.0" },
      });
      const html = await res.text();
      const elapsed = Date.now() - start;
      const lower = html.toLowerCase();

      const issues: string[] = [];
      if (!targetUrl.startsWith("https")) issues.push("Sin SSL");
      if (!lower.includes("<title>")) issues.push("Sin title tag");
      if (!lower.includes('name="description"')) issues.push("Sin meta description");
      if (!lower.includes('name="viewport"')) issues.push("No mobile-friendly");
      if (elapsed > 3000) issues.push(`Carga lenta: ${elapsed}ms`);
      if (!lower.includes("<h1")) issues.push("Sin H1");
      if (!lower.includes("schema.org") && !lower.includes("application/ld+json")) issues.push("Sin schema markup");

      const checks = [
        targetUrl.startsWith("https"),
        lower.includes("<title>"),
        lower.includes('name="description"'),
        lower.includes('name="viewport"'),
        elapsed < 3000,
        lower.includes("<h1"),
        lower.includes("schema.org") || lower.includes("application/ld+json"),
      ];
      const score = Math.round(checks.filter(Boolean).length / checks.length * 100);

      return NextResponse.json({
        url: targetUrl,
        score,
        loadTime: elapsed,
        issues,
        opportunity: 100 - score,
      });
    } catch {
      return NextResponse.json({
        url: body.url,
        score: 0,
        loadTime: null,
        issues: ["Web no accesible"],
        opportunity: 100,
      });
    }
  }

  // --- ACTION: GENERATE OUTREACH ---
  if (action === "outreach") {
    if (!CLAUDE_API_KEY) {
      return NextResponse.json({ error: "CLAUDE_API_KEY not configured" }, { status: 500 });
    }

    const { lead, audit } = body;
    const issuesText = (audit?.issues || []).join(", ");

    const prompt = `Eres Copy, copywriter de PACAME, una agencia digital en Madrid.

Genera 3 emails de outreach frio para este negocio:

NEGOCIO: ${lead.name} (${lead.category})
UBICACION: ${lead.city}
WEB: ${lead.website || "No tiene"}
RATING: ${lead.rating}/5 (${lead.reviews} reseñas)
PROBLEMAS WEB: ${issuesText || "Web no existe"}
SCORE WEB: ${audit?.score || 0}/100

REGLAS:
- Tutea, tono cercano, sin ser agresivo
- Cada email < 120 palabras
- Hook menciona algo ESPECIFICO del negocio
- No mencionar "IA" ni "agentes" - hablar de resultados
- CTA: diagnostico gratuito en pacameagencia.com/contacto
- Firma: Pablo Calleja, PACAME

Responde SOLO JSON valido:
{"email_1": {"subject": "...", "body": "..."}, "email_2": {"subject": "...", "body": "..."}, "email_3": {"subject": "...", "body": "..."}}`;

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
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      let emails: Record<string, unknown> | null = null;
      if (jsonStart >= 0) {
        try { emails = JSON.parse(text.slice(jsonStart, jsonEnd)); } catch { /* AI devolvio JSON invalido */ }
      }

      return NextResponse.json({
        emails,
        tokens: data.usage?.output_tokens || 0,
      });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // --- ACTION: SAVE LEADS ---
  if (action === "save") {
    const { leads: leadsToSave, campaignName } = body;
    if (!leadsToSave?.length) return NextResponse.json({ error: "No leads to save" }, { status: 400 });

    const saved = [];
    for (const lead of leadsToSave) {
      const { error } = await supabase.from("leads").insert({
        name: lead.name,
        email: lead.email || null,
        phone: lead.phone || null,
        business_name: lead.name,
        business_type: lead.category || null,
        source: "outbound",
        status: "new",
        sage_analysis: {
          campaign: campaignName,
          website: lead.website,
          rating: lead.rating,
          reviews: lead.reviews,
          city: lead.city,
          audit_score: lead.auditScore,
          audit_issues: lead.auditIssues,
          outreach_emails: lead.emails,
          scraped_at: new Date().toISOString(),
        },
      });
      if (!error) saved.push(lead.name);
    }

    // Notify Pablo
    await supabase.from("notifications").insert({
      type: "leadgen_campaign",
      priority: "medium",
      title: `Campaña outbound: ${campaignName}`,
      message: `${saved.length} leads guardados de ${leadsToSave.length} scrapeados.`,
      data: { campaign: campaignName, saved_count: saved.length },
    });

    // Log to Oficina
    logAgentActivity({
      agentId: "sage",
      type: "task_completed",
      title: `Leads guardados: ${campaignName}`,
      description: `${saved.length}/${leadsToSave.length} leads guardados en CRM`,
      metadata: { campaign: campaignName, saved: saved.length },
    });

    return NextResponse.json({ saved: saved.length, total: leadsToSave.length });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
