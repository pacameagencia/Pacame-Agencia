/**
 * PacameCueva embedder + skill indexer.
 *
 * - Indexa los .claude/skills/*.md como knowledge_nodes (tipo 'skill')
 * - Genera embeddings via Ollama VPS (nomic-embed-text, 768 dim) para todos los
 *   knowledge_nodes, agent_memories y agent_discoveries que no tienen embedding.
 *
 * Uso:
 *   npx tsx tools/obsidian-sync/embed-brain.ts --skills      # indexa skills
 *   npx tsx tools/obsidian-sync/embed-brain.ts --embed       # embeddings pendientes
 *   npx tsx tools/obsidian-sync/embed-brain.ts --full        # skills + embed
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import fg from 'fast-glob';
import { supabase } from './lib/supabase.ts';
import { PATHS } from './lib/paths.ts';

const OLLAMA_URL = process.env.PACAME_OLLAMA_URL || 'http://72.62.185.125:11434';
const OLLAMA_MODEL = process.env.PACAME_EMBED_MODEL || 'nomic-embed-text';
const BATCH = 20;

type Mode = 'skills' | 'embed' | 'full';
const args = process.argv.slice(2);
const mode: Mode = args.includes('--full') ? 'full'
                 : args.includes('--embed') ? 'embed'
                 : 'skills';

// Sanitiza texto para evitar caracteres que rompen Ollama (null bytes,
// control chars, BOM, surrogates huérfanos).
function sanitize(t: string): string {
  return t
    .replace(/\u0000/g, '')
    .replace(/[\uFFFE\uFFFF]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function embed(text: string): Promise<number[] | null> {
  if (!text || text.trim().length < 10) return null;
  const clean = sanitize(text);
  if (clean.length < 10) return null;
  // Try con longitud máxima; si falla, reducir a la mitad una vez
  for (const len of [8000, 3000]) {
    try {
      const r = await fetch(`${OLLAMA_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: OLLAMA_MODEL, prompt: clean.slice(0, len) }),
      });
      if (!r.ok) {
        if (len === 3000) {
          console.warn(`[embed] HTTP ${r.status} for "${clean.slice(0, 40)}..." (retry failed)`);
          return null;
        }
        continue; // Retry with shorter text
      }
      const j = await r.json() as { embedding: number[] };
      if (!Array.isArray(j.embedding) || j.embedding.length !== 768) {
        console.warn(`[embed] bad dim ${j.embedding?.length}`);
        return null;
      }
      return j.embedding;
    } catch (e) {
      if (len === 3000) {
        console.warn(`[embed] error: ${(e as Error).message}`);
        return null;
      }
    }
  }
  return null;
}

// Formato pgvector: [0.1,0.2,...] como string
function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`;
}

async function indexSkills() {
  console.log('[skills] scanning .claude/skills/');
  const skillsRoot = path.join(PATHS.root, '.claude', 'skills');
  if (!fs.existsSync(skillsRoot)) {
    console.log('[skills] no skills dir, skip');
    return;
  }

  // v2: indexa CUALQUIER .md en skills/ hasta 4 niveles (cubre subagentes en
  // agency-agents/, composio-skills/, etc.)
  const entries = await fg([
    '*.md',
    '**/SKILL.md',
    '**/skill.md',
    '**/README.md',
    '*/*.md',
    '*/*/*.md',
  ], {
    cwd: skillsRoot,
    dot: false,
    absolute: true,
    onlyFiles: true,
    unique: true,
  });

  console.log(`[skills] found ${entries.length} skill files`);

  let created = 0, updated = 0;
  for (let i = 0; i < entries.length; i++) {
    const file = entries[i];
    const rel = path.relative(skillsRoot, file);
    // id = filename sin .md; si es SKILL.md/skill.md/README.md usa nombre del padre
    const baseName = path.basename(rel, '.md');
    const id = (baseName.toLowerCase() === 'skill' || baseName.toLowerCase() === 'readme')
      ? path.basename(path.dirname(rel))
      : baseName;

    const raw = fs.readFileSync(file, 'utf8');
    // Sanitizar null bytes y otros chars de control que rompen YAML
    const safeRaw = raw.replace(/\u0000/g, '').replace(/\r\n/g, '\n');
    let fm: Record<string, unknown> = {};
    let content = safeRaw;
    try {
      const parsed = matter(safeRaw);
      fm = parsed.data;
      content = parsed.content;
    } catch {
      // Si el YAML está roto, usar el archivo como contenido puro
      content = safeRaw;
    }
    const label = (fm.name as string) || id;
    const description = (fm.description as string) || '';
    const summary = content.slice(0, 2000);

    // Texto para embedding = nombre + descripción + inicio del contenido
    const embedText = `${label}\n${description}\n${summary}`;

    // Upsert por (node_type='skill', label)
    const { data: existing } = await supabase
      .from('knowledge_nodes')
      .select('id, embedding')
      .eq('node_type', 'skill')
      .eq('label', label)
      .maybeSingle();

    if (existing?.id) {
      if (existing.embedding) { continue; } // ya tiene embedding
      const vec = await embed(embedText);
      if (!vec) continue;
      await supabase
        .from('knowledge_nodes')
        .update({
          content: description || summary.slice(0, 500),
          embedding: toVectorLiteral(vec),
          metadata: { source: 'skill', path: rel, frontmatter: fm },
          tags: ['skill', ...(fm.tags as string[] || [])],
        })
        .eq('id', existing.id);
      updated++;
    } else {
      const vec = await embed(embedText);
      if (!vec) continue;
      const { error } = await supabase
        .from('knowledge_nodes')
        .insert({
          node_type: 'skill',
          label,
          content: description || summary.slice(0, 500),
          owner_agent: null,
          confidence: 0.8,
          tags: ['skill', ...(fm.tags as string[] || [])],
          embedding: toVectorLiteral(vec),
          metadata: { source: 'skill', path: rel, frontmatter: fm },
        });
      if (!error) created++;
    }

    if ((i + 1) % 25 === 0) console.log(`[skills] ${i + 1}/${entries.length}`);
  }

  console.log(`[skills] created=${created} updated=${updated}`);
}

async function embedPending() {
  console.log('[embed] fetching nodes without embedding...');
  let total = 0;
  while (true) {
    const { data, error } = await supabase
      .from('knowledge_nodes')
      .select('id, label, content, node_type')
      .is('embedding', null)
      .limit(BATCH);
    if (error) { console.error('[embed] select error:', error.message); break; }
    if (!data || data.length === 0) break;

    for (const row of data) {
      const text = `${row.label}\n${row.content || ''}`.slice(0, 4000);
      const vec = await embed(text);
      if (!vec) continue;
      await supabase
        .from('knowledge_nodes')
        .update({ embedding: toVectorLiteral(vec) })
        .eq('id', row.id);
      total++;
    }
    console.log(`[embed] nodes: ${total} done`);
    if (data.length < BATCH) break;
  }

  console.log('[embed] fetching memories without embedding...');
  let mTotal = 0;
  while (true) {
    const { data } = await supabase
      .from('agent_memories')
      .select('id, title, content')
      .is('embedding', null)
      .limit(BATCH);
    if (!data || data.length === 0) break;
    for (const row of data) {
      const text = `${row.title}\n${row.content || ''}`.slice(0, 4000);
      const vec = await embed(text);
      if (!vec) continue;
      await supabase
        .from('agent_memories')
        .update({ embedding: toVectorLiteral(vec) })
        .eq('id', row.id);
      mTotal++;
    }
    console.log(`[embed] memories: ${mTotal} done`);
    if (data.length < BATCH) break;
  }

  console.log('[embed] fetching discoveries without embedding...');
  let dTotal = 0;
  while (true) {
    const { data } = await supabase
      .from('agent_discoveries')
      .select('id, title, description, insight')
      .is('embedding', null)
      .limit(BATCH);
    if (!data || data.length === 0) break;
    for (const row of data) {
      // Agent_discoveries puede tener title/description/insight según schema
      const text = [row.title, (row as any).description, (row as any).insight]
        .filter(Boolean).join('\n').slice(0, 4000);
      const vec = await embed(text);
      if (!vec) continue;
      await supabase
        .from('agent_discoveries')
        .update({ embedding: toVectorLiteral(vec) })
        .eq('id', row.id);
      dTotal++;
    }
    console.log(`[embed] discoveries: ${dTotal} done`);
    if (data.length < BATCH) break;
  }

  console.log(`[embed] total: nodes=${total} memories=${mTotal} discoveries=${dTotal}`);
}

async function main() {
  console.log(`[embed-brain] mode=${mode} ollama=${OLLAMA_URL} model=${OLLAMA_MODEL}`);

  // Ping Ollama
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  } catch (e) {
    console.error(`[embed-brain] Ollama unreachable at ${OLLAMA_URL}: ${(e as Error).message}`);
    process.exit(1);
  }

  if (mode === 'skills' || mode === 'full') await indexSkills();
  if (mode === 'embed'  || mode === 'full') await embedPending();
  console.log('[embed-brain] DONE');
}

main().catch(e => { console.error(e); process.exit(1); });
