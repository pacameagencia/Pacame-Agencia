import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './paths.ts';

// Busca .env.local en orden: PACAME_ENV_FILE, <ROOT>/web/.env.local, fallback a ruta local Windows.
const candidates = [
  process.env.PACAME_ENV_FILE,
  path.join(PATHS.root, 'web', '.env.local'),
  'C:/Users/Pacame24/Downloads/PACAME AGENCIA/web/.env.local',
  '/opt/pacame/web/.env.local',
].filter(Boolean) as string[];

const envFile = candidates.find(f => { try { return fs.existsSync(f); } catch { return false; } });
if (envFile) dotenv.config({ path: envFile });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    `Faltan envs NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Buscado en: ${candidates.join(' | ')}`,
  );
}

export const supabase: SupabaseClient = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

export interface KnowledgeNodeInput {
  node_type: string;
  label: string;
  content?: string;
  owner_agent?: string;
  tags?: string[];
  confidence?: number;
  metadata?: Record<string, unknown>;
}

const VALID_AGENTS = new Set([
  'dios', 'sage', 'atlas', 'nexus', 'pixel',
  'core', 'pulse', 'nova', 'copy', 'lens',
]);

function normalizeAgent(a?: string | null): string | null {
  if (!a) return null;
  const low = a.toLowerCase();
  return VALID_AGENTS.has(low) ? low : null;
}

export async function upsertKnowledgeNode(n: KnowledgeNodeInput): Promise<string> {
  const owner = normalizeAgent(n.owner_agent);

  const { data: existing } = await supabase
    .from('knowledge_nodes')
    .select('id')
    .eq('node_type', n.node_type)
    .eq('label', n.label)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from('knowledge_nodes')
      .update({
        content: n.content,
        owner_agent: owner,
        tags: n.tags,
        confidence: n.confidence ?? 0.8,
        metadata: n.metadata ?? {},
      })
      .eq('id', existing.id);
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from('knowledge_nodes')
    .insert({
      node_type: n.node_type,
      label: n.label,
      content: n.content ?? null,
      owner_agent: owner,
      tags: n.tags ?? [],
      confidence: n.confidence ?? 0.8,
      metadata: n.metadata ?? {},
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function linkKnowledge(
  fromId: string,
  toId: string,
  relation: string,
  strength = 0.5,
): Promise<void> {
  if (fromId === toId) return;
  const { data: existing } = await supabase
    .from('knowledge_edges')
    .select('id')
    .eq('from_node', fromId)
    .eq('to_node', toId)
    .eq('relation', relation)
    .maybeSingle();
  if (existing?.id) return;
  await supabase.from('knowledge_edges').insert({
    from_node: fromId,
    to_node: toId,
    relation,
    strength,
  });
}
