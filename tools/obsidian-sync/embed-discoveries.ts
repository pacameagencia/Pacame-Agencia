/**
 * Script one-off: embebe los 61 discoveries que faltan con el schema correcto.
 * Schema real: title + description + suggested_action (no 'insight').
 */
import { supabase } from './lib/supabase.ts';

const OLLAMA_URL = process.env.PACAME_OLLAMA_URL || 'http://72.62.185.125:11434';
const OLLAMA_MODEL = process.env.PACAME_EMBED_MODEL || 'nomic-embed-text';

async function embed(text: string): Promise<number[] | null> {
  if (!text || text.trim().length < 10) return null;
  const clean = text.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
  for (const len of [8000, 3000]) {
    try {
      const r = await fetch(`${OLLAMA_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: OLLAMA_MODEL, prompt: clean.slice(0, len) }),
      });
      if (!r.ok) {
        if (len === 3000) return null;
        continue;
      }
      const j = await r.json() as { embedding: number[] };
      return Array.isArray(j.embedding) && j.embedding.length === 768 ? j.embedding : null;
    } catch {
      if (len === 3000) return null;
    }
  }
  return null;
}

const { data, error } = await supabase
  .from('agent_discoveries')
  .select('id, title, description, suggested_action')
  .is('embedding', null);

if (error) {
  console.error('error:', error.message);
  process.exit(1);
}

console.log(`[disc] ${data?.length || 0} discoveries sin embedding`);
let done = 0;
for (const d of data || []) {
  const text = [d.title, d.description, d.suggested_action].filter(Boolean).join('\n').slice(0, 4000);
  const vec = await embed(text);
  if (!vec) continue;
  await supabase
    .from('agent_discoveries')
    .update({ embedding: `[${vec.join(',')}]` })
    .eq('id', d.id);
  done++;
  if (done % 10 === 0) console.log(`[disc] ${done} procesados`);
}
console.log(`[disc] DONE. ${done}/${data?.length || 0} embebidos.`);
process.exit(0);
