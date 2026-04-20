import { BaseDelivery } from "../base";
import { generateImage } from "@/lib/image-generation";
import type { DeliveryContext, DeliveryResult } from "../types";
import { getLogger } from "@/lib/observability/logger";

/**
 * Delivery: Post Instagram
 * Agent: Pulse
 * Output: imagen 1:1 + caption largo + hashtags + sugerencia hora publicacion.
 * SLA: 1h (en practica 1-2 min).
 */
export class PostInstagramDelivery extends BaseDelivery {
  readonly slug = "post-instagram";
  readonly name = "Post Instagram";

  async execute(ctx: DeliveryContext): Promise<DeliveryResult> {
    const inputs = ctx.inputs as {
      business_name?: string;
      topic?: string;
      goal?: string;
      tone?: string;
      include_image?: boolean;
      image_style?: string;
      brand_colors?: string;
      cta?: string;
    };

    await ctx.onProgress(10, "Pulse esta analizando el tema...");

    // 1. Generate caption + hashtags + image prompt via LLM
    const captionPrompt = `Eres Pulse, social media manager senior de PACAME. Crea un post completo de Instagram.

CONTEXTO:
- Negocio: ${inputs.business_name || "(no especificado)"}
- Tema: ${inputs.topic || "(no especificado)"}
- Objetivo: ${inputs.goal || "engagement"}
- Tono: ${inputs.tone || "cercano"}
- CTA: ${inputs.cta || "(libre)"}
- Colores de marca: ${inputs.brand_colors || "(libre)"}
- Estilo imagen: ${inputs.image_style || "fotografico"}

INSTRUCCIONES:
- Caption entre 120-220 palabras. Primera frase es un HOOK potente (gancho primeros 3 segundos).
- Parrafos CORTOS, maximo 2 lineas cada uno. Usa saltos de linea.
- Tutea siempre. Nada de "nosotros ofrecemos". Habla de tu a tu.
- 30 hashtags mezclando: branded (ej. #pacameagencia), tematicos (segun tema), nichos (menos competitivos).
- Sugiere mejor franja horaria para publicar (dia+hora en Espana).
- Describe el PROMPT de imagen en ingles tecnico (para generador IA): estilo, composicion, colores, objeto principal, mood. Max 80 palabras. No incluye texto en la imagen.

FORMATO DE SALIDA (JSON estricto):
{
  "caption": "Caption completo con saltos de linea \\n\\n entre parrafos",
  "hashtags": ["#tag1","#tag2", ...],
  "best_time": "Dia + hora (ej. 'Martes 19:00')",
  "rationale": "Por que este enfoque funciona (1-2 frases)",
  "image_prompt": "Prompt tecnico en ingles para generacion IA (sin texto en la imagen)"
}

Responde SOLO JSON valido.`;

    const { content, costUsd: llmCost, tokensIn, tokensOut, model } = await this.chat(
      [{ role: "user", content: captionPrompt }],
      "standard",
      { maxTokens: 1400, temperature: 0.9 }
    );

    const parsed = this.safeJSON<{
      caption: string;
      hashtags: string[];
      best_time: string;
      rationale: string;
      image_prompt: string;
    }>(content);

    if (!parsed || !parsed.caption) {
      throw new Error(
        `PostInstagram delivery: LLM no devolvio JSON valido. Raw length=${content.length}`
      );
    }

    await ctx.onProgress(50, "Generando imagen con IA...");

    let imageUrl: string | null = null;
    let imageCost = 0;
    const wantsImage = inputs.include_image !== false;

    if (wantsImage && parsed.image_prompt) {
      try {
        imageUrl = await generateImage(parsed.image_prompt, "instagram");
        // Rough cost estimate: Freepik Mystic ~0.02€, DALL-E 0.04€, Pollinations gratis.
        // Estimamos 0.02 USD si llego imagen.
        if (imageUrl) imageCost = 0.02;
      } catch (err) {
        getLogger().warn({ err }, "[post-instagram] image generation failed");
        // Continue without image — deliver text+hashtags and let client re-request
      }
    }

    await ctx.onProgress(90, "Empaquetando post final...");

    const totalCost = llmCost + imageCost;

    return {
      deliverables: [
        {
          kind: "json",
          title: "Post Instagram — caption + imagen + hashtags",
          payload: {
            caption: parsed.caption,
            hashtags: parsed.hashtags || [],
            hashtags_line: (parsed.hashtags || []).join(" "),
            best_time: parsed.best_time,
            rationale: parsed.rationale,
            image_url: imageUrl,
            image_prompt: parsed.image_prompt,
          },
          fileUrl: imageUrl || undefined,
          previewUrl: imageUrl || undefined,
          meta: {
            model,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
            llm_cost_usd: llmCost,
            image_cost_usd: imageCost,
            cost_usd: totalCost,
            image_generated: !!imageUrl,
          },
        },
      ],
      summary: imageUrl
        ? `Post listo con imagen + caption + 30 hashtags. Mejor hora: ${parsed.best_time}.`
        : `Post listo con caption + 30 hashtags (imagen pendiente). Mejor hora: ${parsed.best_time}.`,
      costUsd: totalCost,
    };
  }
}
