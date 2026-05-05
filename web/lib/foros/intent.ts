/**
 * Foros Intent Classifier · 6 intents Dark Room para foros públicos.
 *
 * Fork del patrón `web/lib/darkroom/community/intent-detector.ts` (intents
 * Discord interno). Misma arquitectura híbrida:
 *   1. Heurística regex (~3ms · 0€) cubre 60-70% casos
 *   2. Si confidence < 0.65 → LLM economy (Gemma VPS · gratis) fallback
 *
 * Output: ForoIntent + confidence 0..1. Items con intent='no_relevante'
 * se descartan (~70% del volumen scrapeado).
 */

import { llmChat, extractJSON } from "@/lib/llm";
import { getLogger } from "@/lib/observability/logger";

export type ForoIntent =
  | "pregunta_stack_tools"
  | "pregunta_alternativa_pago"
  | "pregunta_dropship_finder"
  | "pregunta_uso_ia"
  | "mencion_competidor"
  | "comparativa_pricing"
  | "no_relevante";

export interface IntentDetection {
  intent: ForoIntent;
  confidence: number;
  matched_rule?: string;
}

interface KeywordRule {
  intent: ForoIntent;
  patterns: RegExp[];
  weight: number;
  label: string;
}

const RULES: KeywordRule[] = [
  // ─── Mención competidor (alta prioridad · oportunidad educar) ────
  {
    intent: "mencion_competidor",
    label: "competidor_directo",
    patterns: [
      /\b(toolzbuy|tools?suite|allinai|seogb|softwareshare|sharesoft|sharetool|toolspedia|appsumo\s+deals?|grouptool)\b/i,
      /\bgroup\s*buy\s+(software|herramient|tool)/i,
      /\b(grupo\s+de\s+compra|compra\s+colectiva)\s+(software|herramient|tool|adobe|midjourney)/i,
    ],
    weight: 0.92,
  },

  // ─── Pregunta alternativa pago (cómo no pagar 200-300€/mes) ─────
  {
    intent: "pregunta_alternativa_pago",
    label: "alternativa_pago",
    patterns: [
      /\balternativa\s+(a\s+)?adobe\b/i,
      /\b(adobe|midjourney|chatgpt|canva|figma|capcut|elevenlabs)\s+(barat[ao]|gratis|cheap|free)/i,
      /\b(c[oó]mo|donde|d[oó]nde)\s+(ahorrar|conseguir)\s+(en\s+)?(suscrip|herramient|tool|software|adobe)/i,
      /\b(pago|pagas|pagamos|estoy\s+pagando)\s+(demasiado|much[oa]|\d+\s*€\s*\/?\s*mes)/i,
      /\bsuscripciones?\s+(caras|costosas|imposibles)/i,
      /\b(no\s+puedo\s+permitirme|no\s+me\s+da\s+el\s+presupuesto)\s+(adobe|midjourney|stack)/i,
      /\b(cheap(er)?|afford(able)?)\s+(adobe|midjourney|chatgpt|canva|stack)/i,
      /\bsave\s+(money|cost)\s+on\s+(subscriptions?|tools?|software)/i,
    ],
    weight: 0.85,
  },

  // ─── Pregunta dropship finder (Minea/PiPiAds/Dropsip) ───────────
  {
    intent: "pregunta_dropship_finder",
    label: "dropship_finder",
    patterns: [
      /\b(minea|pipiads|dropsip|dropispy|adspy|peeksta)\b/i,
      /\b(productos?|winning\s+products?|productos?\s+ganadores?)\s+(dropship|drop\s+ship|ecom)/i,
      /\b(donde|d[oó]nde|c[oó]mo)\s+(encontrar|buscar)\s+(productos?|winners?)\s+(para\s+)?(dropship|tienda|ecom)/i,
      /\b(spy\s+tools?|spy\s+ads?|product\s+research)\s+(dropship|ecom)/i,
      /\b(qu[eé]\s+(uso|recomendais|recomiendan)|recomendaci[oó]n)\s+(para\s+)?(encontrar\s+productos|dropship)/i,
    ],
    weight: 0.88,
  },

  // ─── Comparativa pricing (review tools premium) ──────────────────
  {
    intent: "comparativa_pricing",
    label: "comparativa",
    patterns: [
      /\b(chatgpt|claude|gpt-?4|claude\s+pro|gemini)\s+(vs|versus|o)\s+(claude|chatgpt|gpt|gemini|copilot)/i,
      /\b(midjourney|dall-?e|stable\s+diffusion|flux)\s+(vs|versus|o)\s+(midjourney|dall-?e|stable|flux)/i,
      /\b(canva|figma|adobe)\s+(pro\s+)?(vs|versus|o)\s+(canva|figma|adobe|sketch)/i,
      /\b(precio|pricing|coste|cu[aá]nto\s+cuesta|merece\s+la\s+pena)\s+(claude|chatgpt|midjourney|adobe|canva|figma|capcut|elevenlabs|minea|pipiads|higgsfield|seedance|kling|sora|runway)/i,
      /\b(review|opini[oó]n|experiencia\s+con|alguien\s+(usa|ha\s+probado))\s+(toolzbuy|toolsuite|allinai|midjourney|claude|chatgpt|adobe|canva|capcut|elevenlabs|minea|pipiads|higgsfield)/i,
    ],
    weight: 0.78,
  },

  // ─── Pregunta uso IA (cómo usar IA para X) ───────────────────────
  {
    intent: "pregunta_uso_ia",
    label: "uso_ia",
    patterns: [
      /\b(c[oó]mo|how\s+to)\s+(usar|use|crear|create|generar|generate)\s+.*(con|with)\s+(ia|ai|chatgpt|claude|midjourney|gemini)/i,
      /\b(prompts?|prompting)\s+(para|for)\s+(midjourney|chatgpt|claude|video|imagen|reel|carrusel)/i,
      /\b(workflow|flujo|pipeline)\s+(de\s+|para\s+|con\s+)?(ia|ai|chatgpt|midjourney|video|imagen)/i,
      /\b(automatizar|automate)\s+(con\s+|with\s+)?(ia|ai|chatgpt|claude|n8n|make|zapier)/i,
      /\b(c[oó]mo|how)\s+(empezar|start|aprender|learn)\s+(con\s+|with\s+)?(ia|ai|midjourney|chatgpt)/i,
    ],
    weight: 0.7,
  },

  // ─── Pregunta stack tools (qué stack/herramientas usar) ──────────
  {
    intent: "pregunta_stack_tools",
    label: "stack_tools",
    patterns: [
      /\b(qu[eé]\s+(stack|herramient|tools?|setup)|what\s+(stack|tools?|setup))/i,
      /\b(que\s+|qu[eé]\s+)(uso|usais|us[aá]is|usan|usar[ií]ais)\s+(para|de|en)/i,
      /\b(recomendaci[oó]n|recomiendan|recomend[aá]is|recommend(ation)?)\s+(de\s+|for\s+)?(herramient|tools?|stack|software)/i,
      /\b(mejor(es)?|best)\s+(herramient|tools?|software|app)s?\s+(para|for)\s+(creator|freelance|dropship|video|design|content)/i,
      /\b(setup|stack)\s+(de\s+|for\s+)?(creator|freelance|dropship|content|video|design)/i,
      /\b(empezando|starting|empez[oó]\s+como|just\s+started)\s+.*(creator|freelance|dropship|content)/i,
    ],
    weight: 0.7,
  },
];

// Filtros negativos (descarta items irrelevantes pre-clasificación)
const IRRELEVANT_PATTERNS: RegExp[] = [
  /^\s*\[(removed|deleted|borrado)\]\s*$/i,
  /^\s*\.{1,3}\s*$/i,
  /\b(porn|nsfw|adult|onlyfans)\b/i,
  /\b(gambling|casino|apuestas)\b/i,
];

/**
 * Heurística rápida · matcha primer rule con weight más alto.
 */
function classifyByRules(text: string): IntentDetection | null {
  if (!text || text.length < 12) return { intent: "no_relevante", confidence: 1 };
  for (const pattern of IRRELEVANT_PATTERNS) {
    if (pattern.test(text)) return { intent: "no_relevante", confidence: 1 };
  }
  const sorted = [...RULES].sort((a, b) => b.weight - a.weight);
  for (const rule of sorted) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        return { intent: rule.intent, confidence: rule.weight, matched_rule: rule.label };
      }
    }
  }
  return null; // sin match heurístico → escalate LLM
}

/**
 * LLM fallback · Gemma economy tier (gratis VPS).
 */
async function classifyByLLM(text: string): Promise<IntentDetection> {
  const log = getLogger();
  const prompt = `Clasifica este post de foro hispano (sin explicaciones) en UNO de los 7 intents:

INTENTS:
- pregunta_stack_tools: pregunta qué stack/herramientas usar
- pregunta_alternativa_pago: cómo no pagar 200-300€/mes en tools (Adobe, Midjourney, etc)
- pregunta_dropship_finder: cómo encontrar productos ganadores (Minea, PiPiAds, Dropsip)
- pregunta_uso_ia: cómo usar IA para crear contenido (prompts, workflows)
- mencion_competidor: menciona toolzbuy/toolsuite/allinai/seogb (group buy competidor)
- comparativa_pricing: review/comparativa de tools premium pagas
- no_relevante: nada de lo anterior

POST:
"""${text.slice(0, 1500)}"""

JSON: {"intent":"...","confidence":0..1}`;

  try {
    const res = await llmChat(
      [{ role: "user", content: prompt }],
      { tier: "economy", maxTokens: 80 }
    );
    const json = extractJSON(res.content) as { intent?: string; confidence?: number } | null;
    if (json?.intent && typeof json.confidence === "number") {
      const validIntents: ForoIntent[] = [
        "pregunta_stack_tools","pregunta_alternativa_pago","pregunta_dropship_finder",
        "pregunta_uso_ia","mencion_competidor","comparativa_pricing","no_relevante"
      ];
      const intent = (validIntents as string[]).includes(json.intent)
        ? (json.intent as ForoIntent)
        : "no_relevante";
      return { intent, confidence: Math.min(1, Math.max(0, json.confidence)) };
    }
  } catch (err) {
    log.warn({ err }, "[foros-intent] LLM fallback failed · defaulting no_relevante");
  }
  return { intent: "no_relevante", confidence: 0.5 };
}

/**
 * API pública · clasifica un texto (título + body o tweet completo).
 */
export async function classifyIntent(text: string): Promise<IntentDetection> {
  const heuristic = classifyByRules(text);
  if (heuristic && heuristic.confidence >= 0.65) return heuristic;
  return classifyByLLM(text);
}

/** Sync version (solo heurística · sin LLM fallback). Para batch grandes. */
export function classifyIntentSync(text: string): IntentDetection {
  return classifyByRules(text) ?? { intent: "no_relevante", confidence: 0.4 };
}
