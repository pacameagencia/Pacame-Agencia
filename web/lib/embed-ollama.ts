/**
 * Embedding via Ollama VPS (modelo nomic-embed-text, 768 dim).
 *
 * Restaura la funcion embed() original que se perdio en refactor posterior a
 * commit d0982af. La columna pgvector en Supabase (knowledge_nodes.embedding,
 * agent_memories.embedding, agent_discoveries.embedding) es de 768 dim — debe
 * mantenerse consistente.
 *
 * Stack:
 *   - Ollama corriendo en VPS Hostinger (https://gemma.pacameagencia.com)
 *   - Modelo nomic-embed-text (descargar via `ollama pull nomic-embed-text` en VPS)
 *   - Endpoint POST /api/embeddings formato Ollama estandar
 *
 * Prerequisito en VPS:
 *   ssh root@72.62.185.125 "ollama pull nomic-embed-text"
 *   ssh root@72.62.185.125 "ollama list | grep nomic"
 */

const OLLAMA_URL = process.env.GEMMA_API_URL || "https://gemma.pacameagencia.com";
const OLLAMA_TOKEN = process.env.GEMMA_API_TOKEN || "";
const EMBED_MODEL = process.env.EMBED_MODEL || "nomic-embed-text";
const EXPECTED_DIM = 768;

export interface EmbedResult {
  embedding: number[];
  model: string;
  dim: number;
}

/**
 * Genera un embedding 768-dim para el texto dado.
 * Devuelve null si fallo (red, modelo no instalado, etc) — no lanza.
 */
export async function embed(text: string): Promise<EmbedResult | null> {
  if (!text || text.trim().length === 0) return null;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (OLLAMA_TOKEN) headers.Authorization = `Bearer ${OLLAMA_TOKEN}`;

    const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: EMBED_MODEL, prompt: text.slice(0, 8000) }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[embed-ollama] HTTP ${res.status}: ${body.slice(0, 200)}`);
      return null;
    }

    const data = (await res.json()) as { embedding?: number[] };
    if (!Array.isArray(data.embedding) || data.embedding.length !== EXPECTED_DIM) {
      console.error(
        `[embed-ollama] dim mismatch: got ${data.embedding?.length ?? "null"}, expected ${EXPECTED_DIM}`
      );
      return null;
    }

    return { embedding: data.embedding, model: EMBED_MODEL, dim: EXPECTED_DIM };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[embed-ollama] fetch error: ${msg}`);
    return null;
  }
}

/**
 * Embed batch en paralelo (con limite de concurrencia).
 * Devuelve array del mismo largo que texts; null para los que fallaron.
 */
export async function embedBatch(
  texts: string[],
  concurrency = 3
): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  let cursor = 0;

  async function worker() {
    while (cursor < texts.length) {
      const i = cursor++;
      const r = await embed(texts[i]);
      results[i] = r?.embedding ?? null;
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, texts.length) }, worker));
  return results;
}

/**
 * Helper: convierte vector a formato pgvector literal '[v1,v2,...]'.
 */
export function toPgVector(v: number[]): string {
  return `[${v.join(",")}]`;
}
