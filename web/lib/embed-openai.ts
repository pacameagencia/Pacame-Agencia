/**
 * Embeddings via OpenAI text-embedding-3-large (SOTA generalist 2026).
 *
 * Sprint v0.10.29 (2026-05-17) — Sustituye al deprecated embed-ollama.ts
 * (nomic-embed-text via Gemma 4 en VPS Hostinger).
 *
 * Por qué cambiamos:
 *  - nomic-embed-text (Ollama local) → calidad inferior + RAM 2-4GB en VPS
 *  - Necesitábamos VPS gordo (12GB+) solo por Ollama
 *  - 2026: APIs comerciales son baratísimas para embeddings y de mejor calidad
 *
 * Modelo:
 *  - text-embedding-3-large (OpenAI)
 *  - Soporta dimensions configurables: 256, 1024, 1536, 3072
 *  - Default DB actual: 768 dim (pgvector knowledge_nodes.embedding) — la
 *    API permite truncar a 768 manteniendo top-K calidad (~95% vs full)
 *
 * Pricing:
 *  - $0.13 / 1M tokens. Para 8.591 nodes × 200 tokens avg = 1.7M tokens
 *  - Coste full backfill: ~0,22 USD una sola vez
 *  - Coste mensual normal (~500 embeddings nuevos): <€0,05/mes
 *
 * Compatibilidad:
 *  - Misma API publica que embed-ollama.ts: embed() / embedBatch() / toPgVector()
 *  - Drop-in replacement, no requiere migración DB hasta que decidamos subir
 *    a 3072 dim full (PR futura, opcional).
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const EMBED_MODEL = process.env.EMBED_MODEL_OPENAI || "text-embedding-3-large";
const EMBED_DIM = Number(process.env.EMBED_DIM_OPENAI || "768");
const OPENAI_URL = "https://api.openai.com/v1/embeddings";

export interface EmbedResult {
  embedding: number[];
  model: string;
  dim: number;
}

/**
 * Genera un embedding para el texto dado (dimensión configurada en EMBED_DIM_OPENAI).
 * Devuelve null si falla — no lanza.
 */
export async function embed(text: string): Promise<EmbedResult | null> {
  if (!text || text.trim().length === 0) return null;
  if (!OPENAI_API_KEY) {
    console.error("[embed-openai] OPENAI_API_KEY no configurada");
    return null;
  }

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: text.slice(0, 8000),
        dimensions: EMBED_DIM,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[embed-openai] HTTP ${res.status}: ${body.slice(0, 200)}`);
      return null;
    }

    const data = (await res.json()) as { data?: Array<{ embedding: number[] }> };
    const emb = data.data?.[0]?.embedding;
    if (!Array.isArray(emb) || emb.length !== EMBED_DIM) {
      console.error(
        `[embed-openai] dim mismatch: got ${emb?.length ?? "null"}, expected ${EMBED_DIM}`
      );
      return null;
    }

    return { embedding: emb, model: EMBED_MODEL, dim: EMBED_DIM };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[embed-openai] fetch error: ${msg}`);
    return null;
  }
}

/**
 * Embed batch nativo OpenAI (la API acepta hasta 2048 inputs por request).
 * Mucho más eficiente que paralelo de 1-en-1: 1 sola llamada HTTP por batch.
 * Devuelve array del mismo largo que texts; null en los que fallaron.
 */
export async function embedBatch(
  texts: string[],
  // mantener firma compatible — concurrency ya no aplica en batch nativo
  _concurrency = 3,
): Promise<(number[] | null)[]> {
  if (texts.length === 0) return [];
  if (!OPENAI_API_KEY) {
    console.error("[embed-openai] OPENAI_API_KEY no configurada");
    return texts.map(() => null);
  }

  // OpenAI permite hasta 2048 inputs por request, pero limitamos a 100 para
  // evitar request size > 1MB con textos largos.
  const CHUNK = 100;
  const out: (number[] | null)[] = new Array(texts.length).fill(null);

  for (let start = 0; start < texts.length; start += CHUNK) {
    const slice = texts.slice(start, start + CHUNK).map(t => (t || "").slice(0, 8000));

    try {
      const res = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: EMBED_MODEL,
          input: slice,
          dimensions: EMBED_DIM,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(
          `[embed-openai] batch HTTP ${res.status} at offset ${start}: ${body.slice(0, 200)}`
        );
        continue;
      }

      const data = (await res.json()) as {
        data?: Array<{ embedding: number[]; index: number }>;
      };

      for (const item of data.data || []) {
        const absIdx = start + item.index;
        if (
          Array.isArray(item.embedding) &&
          item.embedding.length === EMBED_DIM &&
          absIdx < texts.length
        ) {
          out[absIdx] = item.embedding;
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[embed-openai] batch error at offset ${start}: ${msg}`);
    }
  }

  return out;
}

/**
 * Helper: convierte vector a formato pgvector literal '[v1,v2,...]'.
 */
export function toPgVector(v: number[]): string {
  return `[${v.join(",")}]`;
}

/**
 * Metadatos del modelo para mostrar en health checks.
 */
export function modelInfo() {
  return {
    provider: "openai",
    model: EMBED_MODEL,
    dim: EMBED_DIM,
    pricing_per_1m_tokens: "$0.13",
  };
}
