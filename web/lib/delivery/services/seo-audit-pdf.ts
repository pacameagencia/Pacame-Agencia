import { BaseDelivery } from "../base";
import { createServerSupabase } from "@/lib/supabase/server";
import type { DeliveryContext, DeliveryResult } from "../types";
import type { SEOReportData, OnPageData } from "../pdf/SEOReport";

/**
 * Delivery: SEO Audit PDF
 * Agente: Atlas
 * Output: PDF profesional 10-15 paginas con auditoria completa + plan de accion.
 * SLA: 2h (en practica 2-4 min).
 */

type SEOInputs = {
  website_url?: string;
  main_keywords?: string;
  competitors?: string;
  main_goal?: string;
  target_location?: string;
};

const BUCKET = "deliverables";

export class SEOAuditPDFDelivery extends BaseDelivery {
  readonly slug = "seo-audit-pdf";
  readonly name = "SEO Audit PDF";

  async execute(ctx: DeliveryContext): Promise<DeliveryResult> {
    const inputs = (ctx.inputs || {}) as SEOInputs;
    const websiteUrl = (inputs.website_url || "").trim();
    if (!websiteUrl) {
      throw new Error("SEOAudit: website_url es obligatorio");
    }
    const normalizedUrl = this.normalizeUrl(websiteUrl);

    const mainKeywords = this.parseCSV(inputs.main_keywords);
    const competitors = this.parseCSV(inputs.competitors);

    await ctx.onProgress(10, `Analizando ${normalizedUrl}...`);

    // 1. Fetch HTML (con 1 reintento)
    const { html, fetchError } = await this.fetchHtmlWithRetry(normalizedUrl);

    // 2. Parse basico on-page
    const onPage = html
      ? this.parseOnPage(html)
      : ({ title: "(pagina no accesible)" } as OnPageData);

    await ctx.onProgress(35, "Generando plan de accion con IA...");

    // 3. Llamar LLM tier premium con los datos extraidos
    const llmPrompt = this.buildPrompt({
      url: normalizedUrl,
      onPage,
      mainKeywords,
      competitors,
      mainGoal: inputs.main_goal,
      targetLocation: inputs.target_location,
      fetchError,
      htmlSnippet: html ? html.substring(0, 6000) : "",
    });

    const { content, costUsd: llmCost, tokensIn, tokensOut, model } =
      await this.chat(
        [
          {
            role: "system",
            content:
              "Eres Atlas, SEO senior de PACAME. Analizas webs con rigor, tutean al cliente, y devuelves SOLO JSON valido cuando se te pide.",
          },
          { role: "user", content: llmPrompt },
        ],
        "premium",
        { maxTokens: 3500, temperature: 0.3 }
      );

    const parsed = this.safeJSON<{
      overall_score?: number;
      executive_summary?: string[];
      technical_findings?: SEOReportData["technical_findings"];
      on_page_findings?: SEOReportData["on_page_findings"];
      keyword_opportunities?: SEOReportData["keyword_opportunities"];
      competitive_insights?: string[];
      action_plan?: SEOReportData["action_plan"];
    }>(content);

    if (!parsed) {
      throw new Error(
        `SEOAudit: LLM no devolvio JSON valido. Raw length=${content.length}`
      );
    }

    const overallScore = this.clampScore(parsed.overall_score);

    const reportData: SEOReportData = {
      website_url: normalizedUrl,
      generated_at: new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      overall_score: overallScore,
      main_keywords: mainKeywords,
      competitors,
      target_location: inputs.target_location,
      on_page: onPage,
      executive_summary: parsed.executive_summary || [],
      technical_findings: parsed.technical_findings || [],
      on_page_findings: parsed.on_page_findings || [],
      keyword_opportunities: parsed.keyword_opportunities || [],
      competitive_insights: parsed.competitive_insights || [],
      action_plan: parsed.action_plan || [],
    };

    await ctx.onProgress(70, "Maquetando PDF...");

    // 4. Renderizar PDF
    const pdfBuffer = await this.renderPdf(reportData);

    // 5. Upload Supabase + signed URL 30 dias
    await ctx.onProgress(95, "Entregando...");
    const storagePath = `seo-audits/${ctx.orderId}.pdf`;
    const signedUrl = await this.uploadAndSign(storagePath, pdfBuffer);

    return {
      deliverables: [
        {
          kind: "pdf",
          title: `Auditoria SEO — ${normalizedUrl}`,
          fileUrl: signedUrl,
          storagePath,
          meta: {
            overall_score: overallScore,
            model,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
            cost_usd: llmCost,
            size_bytes: pdfBuffer.length,
            fetch_error: fetchError || null,
          },
        },
      ],
      summary: `Auditoria SEO lista. Score global: ${overallScore}/100. ${
        parsed.action_plan?.length || 0
      } acciones priorizadas en el plan.`,
      costUsd: llmCost,
    };
  }

  // ---------- helpers ----------

  private normalizeUrl(url: string): string {
    if (!/^https?:\/\//i.test(url)) return `https://${url}`;
    return url;
  }

  private parseCSV(s?: string): string[] {
    if (!s) return [];
    return s
      .split(/[,;\n]/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  private clampScore(n?: number): number {
    if (typeof n !== "number" || Number.isNaN(n)) return 60;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  /** Fetch HTML con 1 reintento y timeout 15s. */
  private async fetchHtmlWithRetry(
    url: string
  ): Promise<{ html: string | null; fetchError: string | null }> {
    const attempt = async (): Promise<string> => {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (PACAME-SEO-Bot)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15000),
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    };
    try {
      return { html: await attempt(), fetchError: null };
    } catch (err1) {
      try {
        return { html: await attempt(), fetchError: null };
      } catch (err2) {
        return {
          html: null,
          fetchError: (err2 as Error).message || (err1 as Error).message,
        };
      }
    }
  }

  /** Parser on-page basico via regex. No es cheerio — suficiente para auditoria inicial. */
  private parseOnPage(html: string): OnPageData {
    const lower = html.toLowerCase();

    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    const title = titleMatch?.[1]?.trim().replace(/\s+/g, " ").slice(0, 220);

    const metaDescMatch =
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i.exec(html) ||
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i.exec(html);
    const meta_description = metaDescMatch?.[1]?.trim().slice(0, 400);

    const h1_count = (html.match(/<h1[\s>]/gi) || []).length;
    const h2_count = (html.match(/<h2[\s>]/gi) || []).length;
    const imgTags = html.match(/<img\b[^>]*>/gi) || [];
    const img_count = imgTags.length;
    const img_without_alt = imgTags.filter(
      (t) => !/\balt\s*=\s*["'][^"']+["']/i.test(t)
    ).length;

    // Links: contar anchors con href
    const anchors = html.match(/<a\b[^>]*href=["']([^"']+)["']/gi) || [];
    let internal_links = 0;
    let external_links = 0;
    for (const a of anchors) {
      const m = /href=["']([^"']+)["']/i.exec(a);
      const href = m?.[1] || "";
      if (/^https?:\/\//i.test(href)) external_links++;
      else if (href && !href.startsWith("#") && !href.startsWith("mailto:"))
        internal_links++;
    }

    const canonicalMatch =
      /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(html);
    const canonical = canonicalMatch?.[1] || null;

    const ogImageMatch =
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(
        html
      );
    const og_image = ogImageMatch?.[1] || null;

    const schema_found = /application\/ld\+json/i.test(lower);

    return {
      title,
      meta_description,
      h1_count,
      h2_count,
      img_count,
      img_without_alt,
      internal_links,
      external_links,
      canonical,
      og_image,
      schema_found,
    };
  }

  /** Prompt para Atlas con los datos extraidos. */
  private buildPrompt(args: {
    url: string;
    onPage: OnPageData;
    mainKeywords: string[];
    competitors: string[];
    mainGoal?: string;
    targetLocation?: string;
    fetchError: string | null;
    htmlSnippet: string;
  }): string {
    const {
      url,
      onPage,
      mainKeywords,
      competitors,
      mainGoal,
      targetLocation,
      fetchError,
      htmlSnippet,
    } = args;

    return `Eres Atlas, SEO senior. Analiza esta web y devuelve un JSON con el plan de accion.

DATOS DE LA WEB (${url}):
- Fetch: ${fetchError ? `FALLO (${fetchError}) — asume que el sitio tiene problemas de accesibilidad` : "OK"}
- Title: ${onPage.title || "(no)"}
- Meta description: ${onPage.meta_description || "(no)"}
- H1 count: ${onPage.h1_count ?? "?"}
- H2 count: ${onPage.h2_count ?? "?"}
- Imagenes sin alt: ${onPage.img_without_alt ?? "?"} / ${onPage.img_count ?? "?"}
- Enlaces internos: ${onPage.internal_links ?? "?"}
- Enlaces externos: ${onPage.external_links ?? "?"}
- Canonical: ${onPage.canonical || "(no)"}
- OG image: ${onPage.og_image || "(no)"}
- Schema JSON-LD: ${onPage.schema_found ? "si" : "no"}

CONTEXTO CLIENTE:
- Keywords objetivo: ${mainKeywords.join(", ") || "(no especificadas)"}
- Competencia: ${competitors.join(", ") || "(no especificada)"}
- Objetivo principal: ${mainGoal || "(no especificado)"}
- Ubicacion geografica: ${targetLocation || "(no especificada)"}

${htmlSnippet ? `SNIPPET HTML (primeros 6k):\n${htmlSnippet}\n` : ""}

INSTRUCCIONES:
- Se concreto, sin humo. Cada hallazgo debe tener accion ejecutable.
- Severity: "high" (bloqueante), "medium" (mejora importante), "low" (optimizacion).
- 3-6 hallazgos tecnicos, 3-6 hallazgos on-page, 5-10 keywords, 5-10 acciones priorizadas.
- Priority en action_plan: "1", "2", "3"... (numero, ordenado por impacto/esfuerzo).
- Impact y effort: "alto" | "medio" | "bajo".
- Keyword difficulty: "baja" | "media" | "alta".
- executive_summary: exactamente 3 bullets con los hallazgos de MAS impacto.

FORMATO JSON ESTRICTO (devuelve SOLO este JSON, sin markdown ni texto extra):
{
  "overall_score": 0-100 (numero),
  "executive_summary": ["bullet 1", "bullet 2", "bullet 3"],
  "technical_findings": [{"severity":"high|medium|low","title":"...","description":"...","action":"..."}],
  "on_page_findings": [{"severity":"...","title":"...","description":"...","action":"..."}],
  "keyword_opportunities": [{"keyword":"...","opportunity":"...","difficulty":"baja|media|alta"}],
  "competitive_insights": ["bullet 1", "bullet 2", ...],
  "action_plan": [{"priority":"1","task":"...","impact":"alto|medio|bajo","effort":"alto|medio|bajo"}]
}`;
  }

  /** Renderiza el PDF con @react-pdf/renderer. */
  private async renderPdf(data: SEOReportData): Promise<Buffer> {
    let pdfLib: typeof import("@react-pdf/renderer");
    try {
      pdfLib = await import("@react-pdf/renderer");
    } catch (err) {
      throw new Error(
        `SEOAudit: @react-pdf/renderer no instalado — anade a package.json (${
          (err as Error).message
        })`
      );
    }
    const { renderToBuffer } = pdfLib;
    // Import dinamico del componente JSX para evitar que se cargue en entornos sin React PDF.
    const { SEOReport } = await import("../pdf/SEOReport");
    const element = (SEOReport as unknown as React.FC<{ data: SEOReportData }>)({
      data,
    });
    // renderToBuffer acepta un ReactElement
    // (createElement se evita porque SEOReport ya retorna el <Document>)
    const buf = await renderToBuffer(element as unknown as React.ReactElement);
    return buf as Buffer;
  }

  /** Sube el PDF al bucket y devuelve signed URL 30 dias. */
  private async uploadAndSign(storagePath: string, pdfBuffer: Buffer): Promise<string> {
    const supabase = createServerSupabase();

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      });
    if (upErr) {
      throw new Error(`SEOAudit: upload PDF fallo — ${upErr.message}`);
    }

    const { data: signed, error: sigErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 30);
    if (sigErr || !signed?.signedUrl) {
      throw new Error(
        `SEOAudit: signed URL fallo — ${sigErr?.message || "sin URL"}`
      );
    }
    return signed.signedUrl;
  }
}
