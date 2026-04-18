import { llmChat, extractJSON, type LLMTier } from "@/lib/llm";
import { generateImage } from "@/lib/image-generation";
import { getLogger } from "@/lib/observability/logger";
import type {
  DeliveryContext,
  DeliveryResult,
  ServiceDelivery,
} from "../types";
import { renderTemplate, sanitizeUserInput } from "./template";

export type RunnerType =
  | "llm_text"
  | "llm_structured"
  | "llm_image"
  | "llm_image_multi"
  | "pdf_render"
  | "html_zip_render"
  | "pipeline"
  | "custom";

export interface RunnerConfig {
  tier?: LLMTier;
  maxTokens?: number;
  temperature?: number;
  prompt_template?: string;
  variants_count?: number;
  platform?: string;
  include_image?: boolean;
  image_platform?: string;
  image_prompt_template?: string;
  template?: string;
  [key: string]: unknown;
}

/** Rough LLM cost estimate per tier */
function estimateLLMCost(tier: LLMTier, tokensIn: number, tokensOut: number): number {
  const rates: Record<LLMTier, { in: number; out: number }> = {
    titan: { in: 0.003, out: 0.009 },
    premium: { in: 0.001, out: 0.003 },
    standard: { in: 0.0003, out: 0.0009 },
    economy: { in: 0.00005, out: 0.00015 },
  };
  const r = rates[tier];
  return (tokensIn / 1000) * r.in + (tokensOut / 1000) * r.out;
}

/** Build a sanitized data object for template substitution */
function sanitizeInputs(inputs: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(inputs)) {
    if (typeof v === "string") clean[k] = sanitizeUserInput(v);
    else clean[k] = v;
  }
  return clean;
}

/**
 * GenericRunner: executes a service via declarative runner_config.
 * Instantiated per-order by the orchestrator when runner_type != 'custom'.
 */
export class GenericRunner implements ServiceDelivery {
  readonly slug: string;
  readonly name: string;
  readonly runnerType: RunnerType;
  readonly config: RunnerConfig;

  constructor(slug: string, name: string, runnerType: RunnerType, config: RunnerConfig) {
    this.slug = slug;
    this.name = name;
    this.runnerType = runnerType;
    this.config = config;
  }

  async execute(ctx: DeliveryContext): Promise<DeliveryResult> {
    switch (this.runnerType) {
      case "llm_text":
        return this.runLLMText(ctx);
      case "llm_structured":
        return this.runLLMStructured(ctx);
      case "llm_image":
        return this.runLLMImage(ctx);
      case "llm_image_multi":
        return this.runLLMImageMulti(ctx);
      case "html_zip_render":
        return this.runHTMLZip(ctx);
      case "pdf_render":
        throw new Error(
          `Runner 'pdf_render' disponible en Sprint 3 Fase B. Producto ${this.slug} debe usar custom por ahora.`
        );
      default:
        throw new Error(`Runner type '${this.runnerType}' no implementado`);
    }
  }

  // ─── LLM TEXT ─────────────────────────────────────────
  private async runLLMText(ctx: DeliveryContext): Promise<DeliveryResult> {
    const template = this.config.prompt_template;
    if (!template) throw new Error("llm_text requires runner_config.prompt_template");

    const tier: LLMTier = this.config.tier || "standard";
    const data = sanitizeInputs(ctx.inputs);
    const prompt = renderTemplate(template, data);

    await ctx.onProgress(20, "Generando contenido...");
    const result = await llmChat(
      [{ role: "user", content: prompt }],
      {
        tier,
        maxTokens: this.config.maxTokens ?? 1200,
        temperature: this.config.temperature ?? 0.7,
      }
    );
    await ctx.onProgress(90, "Finalizando...");

    const costUsd = estimateLLMCost(tier, result.tokensIn, result.tokensOut);

    return {
      deliverables: [
        {
          kind: "text",
          title: this.name,
          payload: { text: result.content },
          meta: {
            model: result.model,
            tokens_in: result.tokensIn,
            tokens_out: result.tokensOut,
            cost_usd: costUsd,
          },
        },
      ],
      summary: `Texto generado (${result.content.length} caracteres)`,
      costUsd,
    };
  }

  // ─── LLM STRUCTURED (JSON + optional image) ───────────
  private async runLLMStructured(ctx: DeliveryContext): Promise<DeliveryResult> {
    const template = this.config.prompt_template;
    if (!template) throw new Error("llm_structured requires runner_config.prompt_template");

    const tier: LLMTier = this.config.tier || "standard";
    const data = sanitizeInputs(ctx.inputs);
    const prompt = renderTemplate(template, data);

    await ctx.onProgress(15, "Pensando la estructura...");
    const result = await llmChat(
      [{ role: "user", content: prompt }],
      {
        tier,
        maxTokens: this.config.maxTokens ?? 1400,
        temperature: this.config.temperature ?? 0.85,
      }
    );

    const parsed = extractJSON<Record<string, unknown>>(result.content);
    if (!parsed) {
      throw new Error(
        `Runner ${this.slug}: LLM no devolvio JSON valido (length=${result.content.length})`
      );
    }

    let imageUrl: string | null = null;
    let imageCost = 0;

    const wantsImage =
      this.config.include_image === true &&
      (ctx.inputs.include_image !== false) &&
      typeof parsed.image_prompt === "string";

    if (wantsImage) {
      await ctx.onProgress(55, "Generando imagen...");
      try {
        imageUrl = await generateImage(
          parsed.image_prompt as string,
          this.config.image_platform || "instagram"
        );
        if (imageUrl) imageCost = 0.02;
      } catch (err) {
        getLogger().warn({ err, slug: this.slug }, "[runner] image gen failed");
      }
    }

    await ctx.onProgress(92, "Empaquetando entregable...");

    const llmCost = estimateLLMCost(tier, result.tokensIn, result.tokensOut);
    const totalCost = llmCost + imageCost;

    const payload: Record<string, unknown> = { ...parsed };
    if (imageUrl) {
      payload.image_url = imageUrl;
    }
    if (Array.isArray(parsed.hashtags)) {
      payload.hashtags_line = (parsed.hashtags as string[]).join(" ");
    }

    return {
      deliverables: [
        {
          kind: imageUrl ? "json" : "text",
          title: this.name,
          payload,
          fileUrl: imageUrl || undefined,
          previewUrl: imageUrl || undefined,
          meta: {
            model: result.model,
            tokens_in: result.tokensIn,
            tokens_out: result.tokensOut,
            llm_cost_usd: llmCost,
            image_cost_usd: imageCost,
            cost_usd: totalCost,
            image_generated: !!imageUrl,
          },
        },
      ],
      summary: this.summarizeStructured(parsed, !!imageUrl),
      costUsd: totalCost,
    };
  }

  private summarizeStructured(parsed: Record<string, unknown>, hasImage: boolean): string {
    if (Array.isArray(parsed.variants)) {
      const variants = parsed.variants as Array<Record<string, unknown>>;
      return `${variants.length} variantes generadas${parsed.recommendation ? ". Recomendacion: " + parsed.recommendation : "."}`;
    }
    if (parsed.caption) {
      return hasImage
        ? `Post listo con imagen + caption + hashtags.`
        : `Post listo con caption + hashtags (imagen pendiente).`;
    }
    return `Entregable generado`;
  }

  // ─── LLM IMAGE (single) ───────────────────────────────
  private async runLLMImage(ctx: DeliveryContext): Promise<DeliveryResult> {
    const template = this.config.prompt_template;
    if (!template) throw new Error("llm_image requires runner_config.prompt_template");

    const data = sanitizeInputs(ctx.inputs);
    const imagePrompt = renderTemplate(template, data);

    await ctx.onProgress(30, "Generando imagen...");
    const url = await generateImage(imagePrompt, this.config.platform || "instagram");
    if (!url) throw new Error(`Runner ${this.slug}: generacion de imagen fallo en los 3 fallbacks`);

    await ctx.onProgress(95, "Entregando...");

    return {
      deliverables: [
        {
          kind: "image",
          title: this.name,
          fileUrl: url,
          previewUrl: url,
          meta: { prompt: imagePrompt, cost_usd: 0.02 },
        },
      ],
      summary: `Imagen generada`,
      costUsd: 0.02,
    };
  }

  // ─── LLM IMAGE MULTI (variants in parallel) ───────────
  private async runLLMImageMulti(ctx: DeliveryContext): Promise<DeliveryResult> {
    const template = this.config.prompt_template;
    if (!template) throw new Error("llm_image_multi requires runner_config.prompt_template");

    const variantsCount = this.config.variants_count ?? 3;
    const platform = this.config.platform || "instagram";
    const data = sanitizeInputs(ctx.inputs);
    const basePrompt = renderTemplate(template, data);

    // Variants: add stylistic modifier per variant
    const modifiers = [
      "classic balanced composition",
      "bold modern minimalist",
      "elegant refined",
      "playful distinctive",
      "corporate clean",
    ];

    await ctx.onProgress(15, `Generando ${variantsCount} variantes en paralelo...`);

    const prompts = Array.from({ length: variantsCount }, (_, i) =>
      `${basePrompt}. Style variant: ${modifiers[i % modifiers.length]}`
    );

    const results = await Promise.allSettled(
      prompts.map((p) => generateImage(p, platform))
    );

    const urls: string[] = [];
    const failures: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) urls.push(r.value);
      else failures.push(`variant ${i + 1}: ${r.status === "rejected" ? r.reason : "null"}`);
    });

    if (urls.length === 0) {
      throw new Error(
        `Runner ${this.slug}: todas las variantes fallaron. ${failures.join("; ")}`
      );
    }

    await ctx.onProgress(92, `${urls.length}/${variantsCount} variantes listas...`);

    const deliverables = urls.map((url, i) => ({
      kind: "image" as const,
      title: `${this.name} — Variante ${i + 1}`,
      fileUrl: url,
      previewUrl: url,
      meta: {
        variant: i + 1,
        prompt: prompts[i],
        cost_usd: 0.02,
      },
    }));

    return {
      deliverables,
      summary: `${urls.length} variantes generadas${urls.length < variantsCount ? ` (${variantsCount - urls.length} fallaron)` : ""}`,
      costUsd: urls.length * 0.02,
    };
  }

  // ─── HTML ZIP RENDER ──────────────────────────────────
  private async runHTMLZip(ctx: DeliveryContext): Promise<DeliveryResult> {
    const template = this.config.prompt_template;
    if (!template) throw new Error("html_zip_render requires runner_config.prompt_template");

    const tier: LLMTier = this.config.tier || "premium";
    const data = sanitizeInputs(ctx.inputs);
    const prompt = renderTemplate(template, data);

    await ctx.onProgress(20, "Pixel disenando tu landing...");
    const result = await llmChat(
      [{ role: "user", content: prompt }],
      {
        tier,
        maxTokens: this.config.maxTokens ?? 6000,
        temperature: this.config.temperature ?? 0.6,
      }
    );

    const parsed = extractJSON<{ html: string; css_extra?: string; readme?: string }>(
      result.content
    );
    if (!parsed || !parsed.html) {
      throw new Error(`Runner ${this.slug}: LLM no devolvio HTML valido`);
    }

    await ctx.onProgress(80, "Empaquetando HTML...");

    // For v1: store HTML inline + no zip upload (zip upload needs Supabase Storage).
    // Sprint 3 Fase B: integrar jszip + upload a bucket deliverables.
    const cost = estimateLLMCost(tier, result.tokensIn, result.tokensOut);

    return {
      deliverables: [
        {
          kind: "html",
          title: this.name,
          payload: {
            html: parsed.html,
            css_extra: parsed.css_extra || "",
            readme: parsed.readme || "",
            // Data URL for quick download
            data_url: `data:text/html;charset=utf-8,${encodeURIComponent(parsed.html)}`,
          },
          meta: {
            model: result.model,
            tokens_in: result.tokensIn,
            tokens_out: result.tokensOut,
            cost_usd: cost,
            size_bytes: parsed.html.length,
          },
        },
      ],
      summary: `Landing HTML generada (${Math.round(parsed.html.length / 1024)}KB)`,
      costUsd: cost,
    };
  }
}

/**
 * Factory: construye el runner apropiado segun runner_type.
 * Para 'custom', el orquestador usa el DELIVERY_REGISTRY en paralelo.
 */
export function buildRunner(
  slug: string,
  name: string,
  runnerType: string,
  runnerConfig: Record<string, unknown>
): GenericRunner | null {
  const validTypes: RunnerType[] = [
    "llm_text",
    "llm_structured",
    "llm_image",
    "llm_image_multi",
    "pdf_render",
    "html_zip_render",
    "pipeline",
  ];
  if (!validTypes.includes(runnerType as RunnerType)) return null;
  return new GenericRunner(slug, name, runnerType as RunnerType, runnerConfig as RunnerConfig);
}
