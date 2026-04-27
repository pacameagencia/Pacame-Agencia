/**
 * PACAME Studio — orchestrator (Sprint 28)
 *
 * Convierte un brief de PYME en un mockup interactivo:
 *   1. Claude interpreta intent (sector, secciones, paleta, tono)
 *   2. Atlas Cloud genera 3-4 imágenes hero con Flux Schnell ($0.003/img · ~2s)
 *   3. Devuelve JSON estructurado: secciones + textos + imágenes
 *
 * Coste por generación: ~$0.012-0.015 (3-4 imgs Flux Schnell + 1k tokens Claude Haiku)
 */

import { generateAtlasImage } from "@/lib/atlas-image";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY?.trim();
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
// Claude Haiku 4.5 = rápido + barato (~$0.001/k input, $0.005/k output)
const CLAUDE_MODEL = "claude-haiku-4-5";

export interface StudioBrief {
  /** Lo que escribe el visitor: "web para clínica dental en Madrid" */
  prompt: string;
  /** Opcional: sector preseleccionado por chips */
  sector?: string;
  /** Opcional: estilo visual deseado */
  style?: "minimal" | "bold" | "editorial" | "corporate";
}

export interface StudioSection {
  type: "hero" | "services" | "about" | "gallery" | "pricing" | "contact" | "testimonials";
  title: string;
  subtitle?: string;
  cta?: string;
  imagePrompt?: string;
  /** URL de imagen generada (poblada después por generateImages) */
  imageUrl?: string;
}

export interface StudioMockup {
  brief: string;
  brand: {
    name: string;
    tagline: string;
    palette: { primary: string; secondary: string; accent: string };
    tone: string;
  };
  sections: StudioSection[];
  /** Estimación PACAME para esta web */
  estimate: {
    plan: "starter" | "growth" | "enterprise";
    setupPrice: number;
    monthlyPrice: number;
    deliveryDays: number;
    rationale: string;
  };
}

const SYSTEM_PROMPT = `Eres el director creativo de PACAME (factoría de soluciones IA española).
Tu trabajo: convertir el brief de un negocio en un mockup web estructurado.

REGLAS:
- Responde SOLO con JSON válido (sin markdown, sin texto extra).
- 5-7 secciones máximo.
- Sector debe ser explícito en el "tone" (ej: "warm friendly hospitality" para hoteles).
- imagePrompt debe ser DESCRIPTIVO para Flux Schnell (1-2 frases, estética + objeto + luz + composición).
- Estimate: starter=1.800€ setup +150€/mes (web simple <500k€/año revenue), growth=3.500€ +350€/mes (PYME 2-20M€), enterprise=8.000€ +800€/mes (>20M€).
- deliveryDays: realista PACAME = 14-21 días para starter, 21-35 growth, 35-50 enterprise.
- Tono PACAME: directo, sin humo, en español de España.

JSON SCHEMA exacto:
{
  "brief": "string echo",
  "brand": {
    "name": "Nombre comercial sugerido o el que dieron",
    "tagline": "1 línea",
    "palette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex" },
    "tone": "1 frase descriptiva"
  },
  "sections": [
    {
      "type": "hero | services | about | gallery | pricing | contact | testimonials",
      "title": "Título corto",
      "subtitle": "Opcional",
      "cta": "Texto botón opcional",
      "imagePrompt": "Prompt para Flux Schnell, descriptivo"
    }
  ],
  "estimate": {
    "plan": "starter | growth | enterprise",
    "setupPrice": 1800,
    "monthlyPrice": 150,
    "deliveryDays": 14,
    "rationale": "1-2 frases por qué este plan"
  }
}`;

/**
 * Llama a Claude para interpretar el brief y devolver mockup JSON.
 */
export async function generateMockupStructure(
  brief: StudioBrief,
): Promise<StudioMockup> {
  if (!CLAUDE_API_KEY) {
    throw new Error("CLAUDE_API_KEY missing");
  }

  const userMessage = `Brief: "${brief.prompt}"${brief.sector ? `\nSector preseleccionado: ${brief.sector}` : ""}${brief.style ? `\nEstilo deseado: ${brief.style}` : ""}\n\nDevuelve el JSON.`;

  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const textBlock = data.content.find((c) => c.type === "text");
  if (!textBlock) throw new Error("Claude response missing text content");

  // Strip markdown code fences si Claude los añade
  let json = textBlock.text.trim();
  if (json.startsWith("```")) {
    json = json.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(json) as StudioMockup;
  } catch (err) {
    throw new Error(`Claude returned invalid JSON: ${json.slice(0, 200)}`);
  }
}

/**
 * Genera las imágenes de cada sección con `imagePrompt` usando Flux Schnell
 * vía Atlas Cloud (rápido + barato). Mutates `mockup.sections[i].imageUrl`.
 *
 * Concurrencia 2 para no saturar Atlas.
 */
export async function generateMockupImages(
  mockup: StudioMockup,
  onProgress?: (idx: number, total: number) => void,
): Promise<void> {
  const sectionsWithPrompt = mockup.sections.filter((s) => s.imagePrompt);
  const total = sectionsWithPrompt.length;
  let done = 0;

  // Concurrencia 2 con Promise pool
  const chunks: StudioSection[][] = [];
  for (let i = 0; i < sectionsWithPrompt.length; i += 2) {
    chunks.push(sectionsWithPrompt.slice(i, i + 2));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (section) => {
        if (!section.imagePrompt) return;
        try {
          const result = await generateAtlasImage(section.imagePrompt, {
            ratio: section.type === "hero" ? "1536x1024" : "1024x1024",
            // Flux Schnell = $0.003/img, ~2s
            model: "black-forest-labs/flux-schnell",
            save: false,
            maxPollMs: 30_000,
          });
          section.imageUrl = result.url;
        } catch (err) {
          console.warn(
            `[studio] image gen failed for ${section.type}:`,
            err instanceof Error ? err.message : err,
          );
        }
        done += 1;
        onProgress?.(done, total);
      }),
    );
  }
}

/**
 * End-to-end: brief → JSON estructurado + imágenes pobladas.
 */
export async function generateStudioMockup(
  brief: StudioBrief,
  onProgress?: (step: string, payload?: unknown) => void,
): Promise<StudioMockup> {
  onProgress?.("intent", { message: "Interpretando tu negocio..." });
  const mockup = await generateMockupStructure(brief);

  onProgress?.("structure", mockup);

  onProgress?.("images-start", { total: mockup.sections.filter((s) => s.imagePrompt).length });
  await generateMockupImages(mockup, (done, total) => {
    onProgress?.("image-progress", { done, total });
  });

  onProgress?.("done", mockup);
  return mockup;
}
