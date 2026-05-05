/**
 * Foros Response Generator · 3 borradores rotativos por opportunity.
 *
 * Estilos:
 *   - testimonial: "Yo personalmente uso X / Y / Z porque…"
 *   - educativo:   "Si quieres math: pagar separado son 308€/mes…"
 *   - suave:       "Llevo X meses con un setup que me sale a menos de 1€/día…"
 *
 * Reglas duras hardcoded:
 *   - Nunca link directo (mencionar 'darkroomcreative.cloud' como texto, sin URL)
 *   - Nunca copy idéntico (LLM genera fresh)
 *   - Idioma matching automático (ES → ES, EN → EN)
 *   - Anti-corporate: prohibido "nuestra plataforma", "ofrecemos"
 *   - Varía firma · 50% sin firma, 30% "—P", 20% "—Pablo"
 */

import { llmChat } from "@/lib/llm";
import { getLogger } from "@/lib/observability/logger";
import type { ForoIntent } from "./intent";

export type ResponseStyle = "testimonial" | "educativo" | "suave";

export interface GeneratorInput {
  intent: ForoIntent;
  thread_title: string;
  thread_body: string;
  platform: string;
  language?: "es" | "en"; // auto-detect si no se pasa
}

export interface GeneratedDraft {
  style: ResponseStyle;
  body: string;
}

const SYSTEM_BASE = `Eres "Pablo", creator hispano independiente. Llevas 8 meses pagando suscripciones IA y montaste un sistema legal de group buy llamado "Dark Room" para ahorrar.

Voz: cómplice, honesto, frases cortas, números concretos. NUNCA marketing-speak.

REGLAS DURAS:
- NO menciones URLs, NO escribas https://, NO links directos.
- Puedes mencionar "darkroomcreative.cloud" como texto plano cuando muy natural, o decir "lo tengo en bio".
- NUNCA: "nuestra plataforma", "ofrecemos", "nuestro equipo", "nuestra empresa".
- Habla en primera persona "yo" / "I".
- Sin emojis. Cero superlativos vacíos ("increíble", "el mejor").
- Datos concretos: si mencionas ahorro, di "308€/mes a 24,90€" no "ahorra mucho".
- 80% valor real (responde la pregunta) + 20% mención sutil DR (solo si aporta).
- Longitud: 60-180 palabras. Conversacional.
- Idioma: matchea exactamente al idioma del post original.`;

const STYLE_INSTRUCTIONS: Record<ResponseStyle, string> = {
  testimonial: `Estilo TESTIMONIAL:
Empieza contando tu experiencia personal directa con las herramientas que mencionan o equivalentes.
Patrón: "Yo personalmente uso X y Y porque… Llevo unos meses así."
Cierra con una recomendación natural: "Si te interesa el setup, lo tengo en bio."`,

  educativo: `Estilo EDUCATIVO:
Empieza dando math/datos sobre el coste real de las herramientas.
Patrón: "Si haces el math: ChatGPT 22€ + Claude 22€ + Midjourney 30€ + ... = X€/mes."
Explica honestamente que existen modelos colectivos legales (group buy) que prorratean ese coste.
Cierra con dato: "Yo personalmente lo bajé a 24,90€/mes con un sistema legal. Búscalo si te interesa."`,

  suave: `Estilo SUAVE:
Da una respuesta corta y útil a la pregunta sin meterse mucho con DR.
Mención DR solo en última línea, como detalle casual.
Patrón: "Para X yo uso Y / Z, te ahorra Z€. Si quieres ir más lejos, hay alternativas tipo group buy legal por 0,83€/día. Pero responde primero a la pregunta."`,
};

function detectLanguage(text: string): "es" | "en" {
  // Heurística simple · cuenta palabras frecuentes
  const esWords = (text.match(/\b(que|para|con|por|los|las|del|una|esto|eso|como|pero|esta|este|cuando|donde|porque|hay|son|hacer|tener|estoy|está|todos|todo|mucho|poco|mejor|peor|herramienta|suscripci|usar|uso|gratis|barato)\b/gi) || []).length;
  const enWords = (text.match(/\b(the|that|with|for|this|that|how|what|when|where|because|there|are|have|been|been|your|tools?|subscription|use|using|free|cheap|alternative)\b/gi) || []).length;
  return esWords >= enWords ? "es" : "en";
}

function buildIntentContext(intent: ForoIntent): string {
  const map: Record<ForoIntent, string> = {
    pregunta_alternativa_pago: `Usuario pregunta cómo no pagar 200-300€/mes en suscripciones IA. Es prospect MUY caliente.`,
    mencion_competidor: `Usuario menciona group buy competidor (toolzbuy/toolsuite/allinai). Oportunidad de educar sobre diferencias: legal vs gris, soporte hispano, marca real.`,
    pregunta_stack_tools: `Usuario pregunta qué stack/herramientas usar. Comparte tu stack real (12 tools DR) sin sonar a vendedor.`,
    pregunta_dropship_finder: `Usuario pregunta cómo encontrar productos ganadores. Menciona Minea/PiPiAds/Dropsip que están en tu stack.`,
    pregunta_uso_ia: `Usuario pregunta cómo usar IA para crear. Da prompts/workflows reales, mención DR sutil al final.`,
    comparativa_pricing: `Usuario compara precios de tools premium. Da comparativa honesta + mención coste colectivo.`,
    no_relevante: `Sin contexto · no debería llegar aquí.`,
  };
  return map[intent] || "";
}

async function generateOne(
  input: GeneratorInput,
  style: ResponseStyle,
  lang: "es" | "en"
): Promise<string | null> {
  const log = getLogger();
  const systemPrompt = `${SYSTEM_BASE}

CONTEXTO INTENT: ${buildIntentContext(input.intent)}

${STYLE_INSTRUCTIONS[style]}

Idioma OBLIGATORIO: ${lang === "es" ? "español neutro" : "English"}.
Plataforma: ${input.platform} (adapta tono/formato).`;

  const userPrompt = `POST ORIGINAL (${input.platform}):
TÍTULO: ${input.thread_title}
CUERPO: ${(input.thread_body || "").slice(0, 1500)}

Genera SOLO la respuesta (sin meta-comentarios, sin "Aquí tienes:", solo el body de respuesta tal cual lo postearía).`;

  try {
    const res = await llmChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { tier: "standard", maxTokens: 400, temperature: 0.85 }
    );
    const body = (res.content || "").trim();
    if (body.length < 30) return null;
    // Sanitize: remove URLs (regla dura)
    return body.replace(/https?:\/\/\S+/gi, "darkroomcreative.cloud").trim();
  } catch (err) {
    log.warn({ err, style, intent: input.intent }, "[foros-generator] generation failed");
    return null;
  }
}

/**
 * Genera 3 borradores (testimonial/educativo/suave) en paralelo.
 */
export async function generateDrafts(input: GeneratorInput): Promise<GeneratedDraft[]> {
  const lang = input.language ?? detectLanguage(input.thread_title + " " + input.thread_body);
  const styles: ResponseStyle[] = ["testimonial", "educativo", "suave"];
  const results = await Promise.all(
    styles.map(async (style) => {
      const body = await generateOne(input, style, lang);
      return body ? { style, body } : null;
    })
  );
  return results.filter((r): r is GeneratedDraft => r !== null);
}
