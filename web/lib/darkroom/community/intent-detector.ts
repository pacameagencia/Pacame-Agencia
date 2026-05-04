/**
 * Intent detector — clasifica un mensaje entrante en uno de los 8 intents
 * (`IntentType`) y rutea al agente apropiado.
 *
 * Estrategia híbrida (latencia + coste):
 *   1. Heurística rápida por keywords (≈3ms, 0€) cubre 60-70% de los casos.
 *   2. Si confidence < 0.65 → llama LLM `economy` (Gemma 4 e2b VPS, gratis).
 *   3. Para cualquier escalation crítica (legal/abuse/cancel) → marca
 *      `escalateToHuman=true` independiente de confidence.
 *
 * Plan §6 · Capa 3 · Coordinación entre los 3 agentes.
 */

import { llmChat, extractJSON } from "@/lib/llm";
import { getLogger } from "@/lib/observability/logger";
import { DR_BANNED_PATTERNS_REGEX } from "./voice";
import type { AgentName, IntentDetection, IntentType } from "./types";

interface KeywordRule {
  intent: IntentType;
  keywords: RegExp[];
  weight: number; // 0..1 confianza si match
  agent: AgentName;
  escalate?: boolean;
}

const RULES: KeywordRule[] = [
  // ─── Cancellation / refund / billing crítico → ESCALATE ───────────────
  {
    intent: "cancellation",
    keywords: [
      /\bquiero\s+cancelar\b/i,
      /\bdarme\s+de\s+baja\b/i,
      /\bbaja\s+(de\s+)?(la\s+)?suscripci/i,
      /\brefund\b/i,
      /\breembolso\b/i,
      /\bdevoluci[oó]n\b/i,
    ],
    weight: 0.92,
    agent: "iris",
    escalate: true,
  },
  // ─── Abuse / piracy chat → BAN + escalate ───────────────────────────
  {
    intent: "abuse",
    keywords: DR_BANNED_PATTERNS_REGEX as unknown as RegExp[],
    weight: 0.95,
    agent: "iris",
    escalate: true,
  },
  // ─── Support · cuentas/herramientas/credenciales ────────────────────
  {
    intent: "support",
    keywords: [
      /\b(no\s+me\s+(deja|funciona|carga))\b/i,
      /\bcredenciales\b/i,
      /\bpassword\s+(no|incorrec)/i,
      /\b(no\s+puedo\s+(entrar|acceder|usar))\b/i,
      /\bme\s+ha\s+suspendi/i,
      /\bcuenta\s+banead/i,
      /\bca[ií]d[ao]\b/i,
      /\bno\s+conecta\b/i,
      /\b(midjourney|claude|chatgpt|canva|figma|adobe|capcut|higgsfield|elevenlabs|minea|dropsip|pipiads|seedance)\b.*\b(no|fail|error|problema)/i,
    ],
    weight: 0.78,
    agent: "iris",
  },
  // ─── Lead · interés comercial pre-pago ──────────────────────────────
  {
    intent: "lead",
    keywords: [
      /\bcu[aá]nto\s+cuesta\b/i,
      /\bprecio\b/i,
      /\bplan(es)?\b/i,
      /\bsuscrip\w*\b/i,
      /\b(quiero|me\s+interesa|c[oó]mo)\s+(probar|empez|entrar)\b/i,
      /\b(14\s+d[ií]as)\s+gratis\b/i,
      /\btrial\b/i,
      /\bqu[eé]\s+incluye\b/i,
      /\balternativa\s+(a\s+)?adobe\b/i,
      /\b(stack|pack|bundle)\b.*\b(creator|ia|ai|dropship)\b/i,
      /\b(dropshipping|ecom|ecommerce|freelance|agencia)\b/i,
    ],
    weight: 0.7,
    agent: "vector",
  },
  // ─── Feedback · miembro pagado opina/sugiere ─────────────────────────
  {
    intent: "feedback",
    keywords: [
      /\b(sugerencia|sugiero|propongo|me\s+gustar[ií]a\s+que)\b/i,
      /\b(no\s+me\s+gusta|no\s+uso|no\s+sirve|aburrido)\b/i,
      /\bmejorar\b/i,
      /\bidea\b.*\b(producto|servicio|stack)\b/i,
    ],
    weight: 0.65,
    agent: "nimbo",
  },
  // ─── Showcase · subir trabajo ────────────────────────────────────────
  {
    intent: "showcase",
    keywords: [
      /\b(mira|os\s+ense[nñ]o|comparto|aqu[ií]\s+va)\b/i,
      /\b(mi\s+(work|trabajo|proyecto|video|reel|carrusel))\b/i,
    ],
    weight: 0.6,
    agent: "nimbo",
  },
  // ─── Social · saludo/charla ─────────────────────────────────────────
  {
    intent: "social",
    keywords: [
      /^\s*(hola|buenas|hey|holi|qu[eé]\s+tal|saludos)\b/i,
      /\b(c[oó]mo\s+est[aá]is|qu[eé]\s+pas[ao])\b/i,
    ],
    weight: 0.5,
    agent: "nimbo",
  },
];

interface DetectOptions {
  /** Saltar LLM y devolver heurística pura (tests/cron). */
  skipLLM?: boolean;
  /** callSite para llm_calls observability. */
  callSite?: string;
}

/** Heurística pura (regex). Devuelve la mejor regla matched, o null. */
function heuristic(text: string): { rule: KeywordRule; matched: string[] } | null {
  let best: { rule: KeywordRule; matched: string[]; score: number } | null = null;
  for (const rule of RULES) {
    const matched: string[] = [];
    for (const re of rule.keywords) {
      const m = text.match(re);
      if (m) matched.push(m[0]);
    }
    if (matched.length === 0) continue;
    const score = rule.weight * Math.min(1, matched.length / 2);
    if (!best || score > best.score) best = { rule, matched, score };
  }
  return best ? { rule: best.rule, matched: best.matched } : null;
}

/** Sistema prompt minimalista para Gemma — clasificación rápida. */
const LLM_CLASSIFY_PROMPT = `
Eres un clasificador de intent para una comunidad SaaS DarkRoom (membresía colectiva stack creativo + IA + ecom).

Clasifica el mensaje del usuario en exactamente UNA categoría:
- support · problema técnico, cuenta no funciona, herramienta caída
- lead · pre-pago, pregunta precio/plan/qué incluye, interés comercial
- feedback · opinión/sugerencia/queja constructiva (es miembro pagado)
- cancellation · quiere darse de baja, refund, anular
- abuse · piracy talk, cracked/keygen, amenazas, spam
- showcase · enseña su trabajo, sube ejemplo
- social · saludo, charla casual, off-topic
- unknown · no encaja

Devuelve SOLO JSON con este shape:
{"intent":"<categoria>","confidence":0.0-1.0,"keywords":["..."]}

Sin texto extra. Sin markdown.
`.trim();

export async function detectIntent(
  text: string,
  opts: DetectOptions = {},
): Promise<IntentDetection> {
  const trimmed = (text ?? "").trim();
  if (!trimmed) {
    return {
      intent: "unknown",
      confidence: 0,
      keywords: [],
      suggestedAgent: "nimbo",
      escalateToHuman: false,
    };
  }

  // 1. Heurística rápida
  const h = heuristic(trimmed);
  if (h && h.rule.weight >= 0.85) {
    return {
      intent: h.rule.intent,
      confidence: h.rule.weight,
      keywords: h.matched,
      suggestedAgent: h.rule.agent,
      escalateToHuman: !!h.rule.escalate,
    };
  }

  // 2. LLM si hay match débil o nada
  if (opts.skipLLM) {
    return h
      ? {
          intent: h.rule.intent,
          confidence: h.rule.weight,
          keywords: h.matched,
          suggestedAgent: h.rule.agent,
          escalateToHuman: !!h.rule.escalate,
        }
      : {
          intent: "unknown",
          confidence: 0,
          keywords: [],
          suggestedAgent: "nimbo",
          escalateToHuman: false,
        };
  }

  try {
    const res = await llmChat(
      [
        { role: "system", content: LLM_CLASSIFY_PROMPT },
        { role: "user", content: trimmed.slice(0, 1200) },
      ],
      {
        tier: "economy",
        temperature: 0.1,
        maxTokens: 120,
        callSite: opts.callSite ?? "darkroom/community/intent-detect",
        brainContext: false,
      },
    );
    const parsed = extractJSON<{
      intent: IntentType;
      confidence: number;
      keywords?: string[];
    }>(res.content);
    if (parsed?.intent) {
      const intent: IntentType = parsed.intent;
      const agent = pickAgentFromIntent(intent);
      const escalateToHuman = intent === "cancellation" || intent === "abuse";
      return {
        intent,
        confidence: clamp01(parsed.confidence ?? 0.6),
        keywords: parsed.keywords ?? h?.matched ?? [],
        suggestedAgent: agent,
        escalateToHuman,
      };
    }
  } catch (err) {
    getLogger().warn({ err }, "[dr-intent] LLM classify failed, fallback heuristic");
  }

  // 3. Fallback final
  if (h) {
    return {
      intent: h.rule.intent,
      confidence: h.rule.weight,
      keywords: h.matched,
      suggestedAgent: h.rule.agent,
      escalateToHuman: !!h.rule.escalate,
    };
  }
  return {
    intent: "unknown",
    confidence: 0,
    keywords: [],
    suggestedAgent: "nimbo",
    escalateToHuman: false,
  };
}

function pickAgentFromIntent(intent: IntentType): AgentName {
  switch (intent) {
    case "support":
    case "cancellation":
    case "abuse":
      return "iris";
    case "lead":
      return "vector";
    case "feedback":
    case "showcase":
    case "social":
      return "nimbo";
    default:
      return "nimbo";
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
