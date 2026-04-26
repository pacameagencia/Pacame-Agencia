/**
 * PromptForge enhancer — convierte prompt en bruto en N variantes
 * profesionales con análisis técnico, optimizadas para el target.
 *
 * Targets soportados (14 modelos):
 *   text:  claude · gpt · gemini · deepseek · llama · mistral
 *   image: midjourney · dalle · flux · sdxl · firefly · ideogram
 *   video: sora · veo · runway · kling · luma · pika
 *   audio: suno · elevenlabs
 *
 * Modelo: tier=titan (Claude Sonnet vía Nebius DeepSeek-V3.2 fallback) —
 * la calidad del prompt es lo que hace el producto, no comprometemos.
 */

import { llmChat, extractJSON } from "@/lib/llm";

export type Modality = "text" | "image" | "video" | "audio";
export type Target =
  | "claude" | "gpt" | "gemini" | "deepseek" | "llama" | "mistral"
  | "midjourney" | "dalle" | "flux" | "sdxl" | "firefly" | "ideogram"
  | "sora" | "veo" | "runway" | "kling" | "luma" | "pika"
  | "suno" | "elevenlabs"
  | "generic";

export interface EnhancerInput {
  raw_input: string;
  modality: Modality;
  target: Target;
  use_case?: string;          // 'marketing' | 'photo' | 'code' | ...
  variants_count?: number;    // 2-5
  context_notes?: string;     // info extra: audiencia, tono, restricciones
  language?: string;          // detección automática si null
}

export interface EnhancedVariant {
  title: string;              // "Variante A · cinemático" / "Variante B · minimalista"
  prompt: string;              // el prompt mejorado, listo para copiar
  why_it_works: string;        // 1-2 frases
  technique_tags: string[];    // ['camera-control', 'aspect-ratio', 'rim-light']
}

export interface PromptAnalysis {
  strengths_original: string[];   // 0-3 cosas que el original ya hacía bien
  gaps_detected: string[];        // 2-5 cosas que faltaban
  suggestions: string[];          // 1-3 mejoras opcionales para iterar
  detected_language: string;
  detected_intent: string;
}

export interface EnhancerResult {
  variants: EnhancedVariant[];
  analysis: PromptAnalysis;
  llm_provider: string;
  llm_model: string;
  tokens_used: number;
  cost_usd: number;
}

/**
 * Conocimiento profundo por target. Lo que diferencia un buen prompt
 * de uno mediocre depende del modelo destino. Aquí codificamos las
 * técnicas de cada uno.
 */
const TARGET_PLAYBOOKS: Record<Target, string> = {
  // ─── TEXT ──────────────────────────────────────────────────────────────
  claude: `Claude Sonnet/Opus prefiere:
- Rol claro al inicio + contexto del problema
- Estructura con XML tags <task>, <context>, <requirements>, <output_format>
- Chain-of-thought explícito: "Piensa paso a paso antes de responder"
- Output schema JSON cuando aplique
- Restricciones negativas claras ("NO uses X", "NUNCA inventes Y")
- Few-shot examples si la tarea es específica (1-3 max)
- Prompt caching aware: pon contenido estable arriba (>1024 tokens)`,

  gpt: `GPT-4o/4-turbo prefiere:
- System message corto y específico (rol)
- User message con instrucciones numeradas
- "Let's think step by step" para tareas complejas
- JSON mode con response_format si hay estructura
- Function calling explícito si hay tools
- Temperature según uso (0.2 análisis, 0.7 creativo)
- Token budget hint: "máximo X palabras"`,

  gemini: `Gemini 2.0 Flash prefiere:
- Multi-modal: si hay imagen, descripción primero
- Instrucciones claras separadas por bloque ## Heading
- Structured output via responseSchema
- Grounding hints si necesita facts ("usa búsqueda web si tienes")`,

  deepseek: `DeepSeek-V3.2 prefiere:
- Estructura tipo Anthropic (XML tags funcionan)
- Ejemplos few-shot cuando hay ambigüedad
- Lenguaje directo, sin floritura`,

  llama: `Llama 3.3-70B prefiere:
- Instrucciones cortas y directas
- Evitar prompt engineering excesivo (sobre-instrucción confunde)
- Formato output explícito al final`,

  mistral: `Mistral prefiere:
- Estilo conversacional natural
- Restricciones en bullets
- JSON mode si está disponible`,

  // ─── IMAGE ─────────────────────────────────────────────────────────────
  midjourney: `Midjourney v6.1 prefiere:
- Sintaxis: [sujeto], [descripción detallada], [iluminación], [cámara/lente], [estilo], [parámetros]
- Parámetros: --ar 16:9 / 4:5 / 9:16 / 1:1, --style raw para realismo, --v 6.1, --stylize 50-1000
- Lenguaje específico: "shot on Hasselblad", "f/1.8", "rim light", "magazine editorial"
- Evitar: "beautiful", "amazing", "ultra realistic" (vacíos)
- Negative prompts con --no [list]
- Image prompts (--cref) para consistencia de personaje
- Pesos: ::2 para reforzar, ::-1 para evitar`,

  dalle: `DALL-E 3 prefiere:
- Frases naturales, no listas con comas
- "A photo of...", "A digital painting of..."
- Detalles de composición integrados en la frase
- Texto en imagen requiere comillas: 'with text "PACAME"'`,

  flux: `Flux Schnell/Pro prefiere:
- Lenguaje natural detallado, no keywords sueltos
- "A photograph of [subject], [composition], [lighting], [style]"
- Excelente con texto en imagen
- Aspect ratio en el prompt: "wide landscape format"`,

  sdxl: `SDXL prefiere:
- Comma-separated keywords (estilo Stable Diffusion clásico)
- Token weights con (palabra:1.3) para reforzar
- Negative prompt OBLIGATORIO con blur, low quality, watermark
- Trigger words si hay LoRA específico`,

  firefly: `Adobe Firefly prefiere:
- Lenguaje descriptivo natural
- Estilos predefinidos referenciados ("photographic", "vector art")
- Composición integrada ("close-up", "wide shot")`,

  ideogram: `Ideogram 2.0 prefiere:
- Optimizado para texto en imagen (mejor que MJ/DALL-E para typography)
- "[subject] with text 'EXACT TEXT' in [font style] typography"
- Magic Prompt enabled mejora resultados sin sobre-instruir`,

  // ─── VIDEO ─────────────────────────────────────────────────────────────
  sora: `Sora prefiere:
- Shot list explícito: "Shot 1 (0-3s):...", "Shot 2 (3-8s):..."
- Cámara con lenguaje técnico: "dolly in", "tracking shot", "locked camera", "handheld"
- Lente y formato: "35mm anamorphic", "shallow DoF f/2.8"
- Sound design separado (audio prompt aparte)
- Duración máx 20s por gen, dividir en clips
- Movement subtle por defecto, especificar si quieres dinámico`,

  veo: `Veo 3 prefiere:
- Audio integrado en el prompt (soundscape, voiceover, music cues)
- Cinematografía con jerga: "anamorphic lens flare", "color graded teal-orange"
- Continuidad entre shots si son varios: "Shot 1...continuing in Shot 2..."
- Prompt en inglés rinde mejor (entrenamiento)
- 8s default, máx 60s con segmentación`,

  runway: `Runway Gen-3 prefiere:
- Camera movement explícito: "slow push-in", "orbit", "static"
- Style references si tienes imagen ref
- 10s clips, prompt corto y visual (no narrativo)
- Lighting y mood en pocas palabras`,

  kling: `Kling 1.6 prefiere:
- Motion strength 1-10 explícito
- Camera control comma-separated: "static, orbit, zoom-in"
- 5s o 10s, primer frame influye mucho
- Bilingüe: zh/en mezclados aceptados`,

  luma: `Luma Dream Machine prefiere:
- Prompt narrativo natural, no técnico
- 5s clips, énfasis en "smooth motion"
- Camera control más limitado (mejor para sujeto que para cámara)`,

  pika: `Pika 1.5 prefiere:
- Modificadores Pika Labs: "Pikaffects" (explode, dissolve, melt)
- Camera presets: "zoom_in", "pan_left"
- Negative motion para clips estáticos`,

  // ─── AUDIO ─────────────────────────────────────────────────────────────
  suno: `Suno v4 prefiere:
- Estructura tipo: [Intro], [Verse], [Chorus], [Bridge], [Outro]
- Style description al inicio: "Indie folk acoustic, melancholic, female vocal"
- Lyrics entre tags [Verse 1] ... [Verse 2]
- Tempo y key opcionales pero ayudan
- Idioma de las lyrics determina el idioma cantado`,

  elevenlabs: `ElevenLabs prefiere:
- Texto natural, prosodia con puntuación
- Pausas con [...] o silencios largos con —
- Énfasis con CAPITALIZACIÓN
- Velocidad con ... más espacios = más pausa
- No SSML XML (usar puntuación y espacios)`,

  generic: `Cualquier modelo:
- Rol + objetivo + restricciones + formato output
- Específico > genérico
- Ejemplos > instrucciones abstractas`,
};

const SYSTEM_PROMPT_BASE = `Eres PromptForge, un meta-prompt-engineer experto en convertir ideas crudas en prompts profesionales.

Tu output SIEMPRE es JSON válido (sin markdown fences, sin texto antes ni después) con esta estructura:

{
  "variants": [
    {
      "title": "Variante A · [estilo descriptivo en 2-4 palabras]",
      "prompt": "el prompt completo, listo para copiar al modelo destino",
      "why_it_works": "1-2 frases explicando qué técnica concreta aplica",
      "technique_tags": ["3-5 tags lowercase, kebab-case (ej: chain-of-thought, aspect-ratio, rim-light)"]
    }
    // ... N variants según se pida
  ],
  "analysis": {
    "strengths_original": ["0-3 cosas que el prompt original ya hacía bien"],
    "gaps_detected": ["2-5 cosas que faltaban o eran ambiguas"],
    "suggestions": ["1-3 sugerencias para iterar después"],
    "detected_language": "es | en | otro",
    "detected_intent": "1 frase con la intención real detectada"
  }
}

Reglas duras:
- Las variantes DEBEN ser distintas (no parafrasear). Cada una explora un ángulo: A más cinematográfico, B más minimalista, C más editorial, etc.
- Si el target es image/video, los prompts en INGLÉS rinden mejor (modelos entrenados con datos EN). Mantén el prompt en EN aunque el input sea ES, salvo que el user pida explícitamente otro idioma.
- Si el target es text (Claude/GPT/...), respeta el idioma del input.
- NO uses palabras vacías: "beautiful", "amazing", "stunning", "ultra realistic" sin contexto. Sustituir por términos técnicos.
- NO inventes parámetros que no existen en el modelo destino (ej: --no en Sora, no existe).
- Si el use_case es ambiguo, infiérelo del raw_input pero dilo en analysis.detected_intent.
- Si el modality y target no encajan (ej: target=midjourney pero modality=text), corrige y avisa en gaps_detected.

Solo JSON. Nada más.`;

function buildUserPrompt(input: EnhancerInput): string {
  const variants = Math.max(2, Math.min(5, input.variants_count ?? 3));
  const playbook = TARGET_PLAYBOOKS[input.target] ?? TARGET_PLAYBOOKS.generic;

  return `Genera ${variants} variantes profesionales de este prompt para target=${input.target} (modality=${input.modality}).

PLAYBOOK ESPECÍFICO DEL TARGET:
${playbook}

INPUT CRUDO DEL USUARIO:
"""
${input.raw_input}
"""

${input.context_notes ? `CONTEXTO ADICIONAL DEL USUARIO:\n${input.context_notes}\n` : ""}
${input.use_case ? `USE CASE DECLARADO: ${input.use_case}` : ""}
${input.language ? `IDIOMA PREFERIDO: ${input.language}` : ""}

Devuelve el JSON con ${variants} variantes + análisis. Solo JSON.`;
}

export async function enhancePrompt(input: EnhancerInput): Promise<EnhancerResult> {
  if (!input.raw_input?.trim()) {
    throw new Error("raw_input requerido");
  }
  if (input.raw_input.length > 4000) {
    throw new Error("raw_input máx 4000 caracteres");
  }

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT_BASE },
    { role: "user" as const, content: buildUserPrompt(input) },
  ];

  const result = await llmChat(messages, {
    tier: "titan",
    temperature: 0.6,
    maxTokens: 3000,
    agentId: "copy",
    source: "promptforge:enhance",
    metadata: {
      target: input.target,
      modality: input.modality,
      use_case: input.use_case,
    },
  });

  type RawJSON = {
    variants?: Array<Partial<EnhancedVariant>>;
    analysis?: Partial<PromptAnalysis>;
  };
  const parsed = extractJSON<RawJSON>(result.content);
  if (!parsed || !Array.isArray(parsed.variants) || parsed.variants.length === 0) {
    throw new Error("LLM no devolvió variantes válidas");
  }

  const variants: EnhancedVariant[] = parsed.variants
    .map((v) => ({
      title: typeof v.title === "string" ? v.title : "Variante sin título",
      prompt: typeof v.prompt === "string" ? v.prompt : "",
      why_it_works: typeof v.why_it_works === "string" ? v.why_it_works : "",
      technique_tags: Array.isArray(v.technique_tags) ? v.technique_tags.map(String) : [],
    }))
    .filter((v) => v.prompt);

  const analysis: PromptAnalysis = {
    strengths_original: Array.isArray(parsed.analysis?.strengths_original) ? parsed.analysis!.strengths_original.map(String) : [],
    gaps_detected: Array.isArray(parsed.analysis?.gaps_detected) ? parsed.analysis!.gaps_detected.map(String) : [],
    suggestions: Array.isArray(parsed.analysis?.suggestions) ? parsed.analysis!.suggestions.map(String) : [],
    detected_language: typeof parsed.analysis?.detected_language === "string" ? parsed.analysis.detected_language : "es",
    detected_intent: typeof parsed.analysis?.detected_intent === "string" ? parsed.analysis.detected_intent : "",
  };

  return {
    variants,
    analysis,
    llm_provider: result.provider,
    llm_model: result.model,
    tokens_used: result.tokensIn + result.tokensOut,
    cost_usd: 0, // se podría calcular con PRICING_USD_PER_1M de llm.ts si se requiere display
  };
}

/**
 * Lista de targets agrupados por modality, para poblar selectores en UI.
 */
export const TARGETS_BY_MODALITY: Record<Modality, { id: Target; label: string; pro?: boolean }[]> = {
  text: [
    { id: "claude", label: "Claude (Anthropic)" },
    { id: "gpt", label: "GPT (OpenAI)" },
    { id: "gemini", label: "Gemini (Google)" },
    { id: "deepseek", label: "DeepSeek" },
    { id: "llama", label: "Llama (Meta)" },
    { id: "mistral", label: "Mistral" },
  ],
  image: [
    { id: "midjourney", label: "Midjourney v6" },
    { id: "dalle", label: "DALL·E 3" },
    { id: "flux", label: "Flux (BFL)" },
    { id: "sdxl", label: "SDXL / Stable Diffusion" },
    { id: "firefly", label: "Adobe Firefly" },
    { id: "ideogram", label: "Ideogram (texto en imagen)" },
  ],
  video: [
    { id: "sora", label: "Sora (OpenAI)", pro: true },
    { id: "veo", label: "Veo 3 (Google)", pro: true },
    { id: "runway", label: "Runway Gen-3", pro: true },
    { id: "kling", label: "Kling 1.6", pro: true },
    { id: "luma", label: "Luma Dream Machine", pro: true },
    { id: "pika", label: "Pika 1.5", pro: true },
  ],
  audio: [
    { id: "suno", label: "Suno v4 (música)" },
    { id: "elevenlabs", label: "ElevenLabs (voz)" },
  ],
};
