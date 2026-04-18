import { BaseDelivery } from "../base";
import type { DeliveryContext, DeliveryResult } from "../types";

/**
 * Delivery: Copy Hero + CTA
 * Agent: Copy
 * Output: 3 variantes de hero (titular + subtitulo + CTA) + justificacion estrategica.
 * SLA: 30 min (en practica <1 min)
 */
export class CopyHeroCTADelivery extends BaseDelivery {
  readonly slug = "copy-hero-cta";
  readonly name = "Copy Hero + CTA";

  async execute(ctx: DeliveryContext): Promise<DeliveryResult> {
    await ctx.onProgress(10, "Copy esta analizando tu negocio...");

    const inputs = ctx.inputs as {
      business?: string;
      audience?: string;
      main_benefit?: string;
      current_copy?: string;
      tone?: string;
      avoid?: string;
    };

    const prompt = `Eres Copy, copywriter senior de PACAME. Escribe 3 variantes de copy para el hero principal de una web.

CONTEXTO DEL CLIENTE:
- Negocio: ${inputs.business || "(no especificado)"}
- Audiencia: ${inputs.audience || "(no especificado)"}
- Beneficio principal / transformacion: ${inputs.main_benefit || "(no especificado)"}
- Copy actual: ${inputs.current_copy || "(no tiene)"}
- Tono: ${inputs.tone || "profesional"}
- Que evitar: ${inputs.avoid || "(nada)"}

INSTRUCCIONES:
- Cada variante DEBE tener un angulo DIFERENTE (ej. dolor, aspiracion, contraste, prueba social, promesa directa).
- Titular corto (max 10 palabras) y memorable.
- Subtitulo clarifica la promesa en 1-2 frases (max 25 palabras).
- CTA especifico, verbo de accion (ej. "Contratar ahora", "Empezar gratis", "Hablar con Pablo").
- Explica en 2-3 frases por que funciona.
- Tono segun input. Si no especifica: cercano y directo. Tutea SIEMPRE.
- NO uses humo: "soluciones 360°", "experiencia unica", "sinergia". Habla claro.

FORMATO DE SALIDA (JSON estricto):
{
  "variants": [
    {
      "angle": "Nombre del angulo estrategico",
      "headline": "Titular corto",
      "subheadline": "Subtitulo 1-2 frases",
      "cta": "Texto CTA",
      "rationale": "Por que funciona (2-3 frases)"
    },
    ... (3 variantes en total)
  ],
  "recommendation": "Cual recomendarias y por que (1-2 frases)"
}

Responde SOLO JSON valido, sin texto antes ni despues.`;

    await ctx.onProgress(40, "Generando 3 variantes...");

    const { content, costUsd, tokensIn, tokensOut, model } = await this.chat(
      [{ role: "user", content: prompt }],
      "standard",
      { maxTokens: 1600, temperature: 0.85 }
    );

    await ctx.onProgress(80, "Finalizando entrega...");

    const parsed = this.safeJSON<{
      variants: Array<{
        angle: string;
        headline: string;
        subheadline: string;
        cta: string;
        rationale: string;
      }>;
      recommendation: string;
    }>(content);

    if (!parsed || !Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      throw new Error(
        `Copy delivery: LLM no devolvio JSON valido. Raw length=${content.length}`
      );
    }

    await ctx.onProgress(95, "Preparando entregable...");

    return {
      deliverables: [
        {
          kind: "text",
          title: "Copy Hero + CTA — 3 variantes",
          payload: parsed,
          meta: {
            model,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
            cost_usd: costUsd,
            variants_count: parsed.variants.length,
          },
        },
      ],
      summary: `3 variantes de copy generadas. Recomendacion: ${parsed.recommendation}`,
      costUsd,
    };
  }
}
