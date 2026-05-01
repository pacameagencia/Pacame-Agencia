#!/usr/bin/env tsx
/**
 * Pull: Supabase → vault.
 * - Genera .md en 07-Sinapsis/, 08-Memorias/, 09-Discoveries/ desde las tablas.
 * - Incremental por `last_sync` en `.sync-state.json` dentro del vault.
 * - Idempotente: si el .md ya existe con mismo neural_id, sobreescribe solo si `updated_at` cambia.
 *
 * Uso: npx tsx tools/obsidian-sync/pull.ts              (incremental)
 *      npx tsx tools/obsidian-sync/pull.ts --full       (ignora last_sync)
 * Cron VPS: n8n cada 5 min → ssh VPS → node pull.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { PATHS } from './lib/paths.ts';
import { writeMd, buildFrontmatter } from './lib/frontmatter.ts';
import { supabase } from './lib/supabase.ts';
import { slugify } from './lib/wikilinks.ts';

const FULL = process.argv.includes('--full');
const STATE_FILE = path.join(PATHS.vault, '.sync-state.json');

interface SyncState {
  last_memories: string;
  last_discoveries: string;
  last_synapses: string;
}

async function loadState(): Promise<SyncState> {
  if (FULL) return { last_memories: '1970-01-01', last_discoveries: '1970-01-01', last_synapses: '1970-01-01' };
  try {
    return JSON.parse(await fs.readFile(STATE_FILE, 'utf8')) as SyncState;
  } catch {
    return { last_memories: '1970-01-01', last_discoveries: '1970-01-01', last_synapses: '1970-01-01' };
  }
}

async function saveState(s: SyncState): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(s, null, 2), 'utf8');
}

function nowIso(): string {
  return new Date().toISOString();
}

interface MemoryRow {
  id: string;
  agent_id: string;
  memory_type: string;
  title: string;
  content: string;
  tags: string[];
  importance: number;
  accessed_count: number;
  created_at: string;
  last_accessed_at?: string;
}

async function pullMemories(sinceIso: string): Promise<number> {
  const { data, error } = await supabase
    .from('agent_memories')
    .select('id, agent_id, memory_type, title, content, tags, importance, accessed_count, created_at, last_accessed_at')
    .gt('created_at', sinceIso)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) throw error;
  const rows = (data ?? []) as MemoryRow[];
  for (const m of rows) {
    const agentDir = m.agent_id.toUpperCase();
    const slug = slugify(m.title).slice(0, 60) || m.id.slice(0, 8);
    const relPath = path.join(PATHS.vaultDirs.memorias, agentDir, `${m.created_at.slice(0, 10)}-${slug}.md`);
    const absPath = path.join(PATHS.vault, relPath);
    const fm = buildFrontmatter({
      type: 'memory',
      title: m.title,
      agent: agentDir,
      tags: [`memory-type/${m.memory_type}`, ...(m.tags ?? [])],
      extra: {
        neural_id: m.id,
        importance: m.importance,
        accessed_count: m.accessed_count,
        updated: m.last_accessed_at ?? m.created_at,
      },
    });
    const body = [
      `> **Tipo:** ${m.memory_type} · **Importancia:** ${m.importance.toFixed(2)} · **Accedida:** ${m.accessed_count} veces`,
      '',
      m.content,
      '',
      `## Metadatos`,
      `- Agente: [[01-${agentDir}|${agentDir}]]`,
      `- Creada: ${m.created_at}`,
      `- Última lectura: ${m.last_accessed_at ?? '—'}`,
    ].join('\n');
    await writeMd(absPath, fm, body);
  }
  return rows.length;
}

interface DiscoveryRow {
  id: string;
  agent_id: string;
  type: string;
  title: string;
  description: string;
  evidence?: string;
  impact: string;
  confidence: number;
  actionable: boolean;
  suggested_action?: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
}

async function pullDiscoveries(sinceIso: string): Promise<number> {
  const { data, error } = await supabase
    .from('agent_discoveries')
    .select('id, agent_id, type, title, description, evidence, impact, confidence, actionable, suggested_action, status, created_at, reviewed_at')
    .gt('created_at', sinceIso)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) throw error;
  const rows = (data ?? []) as DiscoveryRow[];
  for (const d of rows) {
    const slug = slugify(d.title).slice(0, 60) || d.id.slice(0, 8);
    const relPath = path.join(PATHS.vaultDirs.discoveries, `${d.created_at.slice(0, 10)}-${slug}.md`);
    const absPath = path.join(PATHS.vault, relPath);
    const agentUpper = d.agent_id.toUpperCase();
    const fm = buildFrontmatter({
      type: 'discovery',
      title: d.title,
      agent: agentUpper,
      tags: [`discovery/${d.type}`, `impact/${d.impact}`, `status/${d.status}`],
      extra: {
        neural_id: d.id,
        confidence: d.confidence,
        actionable: d.actionable,
        updated: d.reviewed_at ?? d.created_at,
      },
    });
    const body = [
      `> **Tipo:** ${d.type} · **Impacto:** ${d.impact} · **Confianza:** ${d.confidence.toFixed(2)} · **Status:** ${d.status}`,
      '',
      `## Descripción`,
      '',
      d.description,
      '',
      ...(d.evidence ? ['## Evidencia', '', d.evidence, ''] : []),
      ...(d.suggested_action ? ['## Acción sugerida', '', d.suggested_action, ''] : []),
      `## Metadatos`,
      `- Agente: [[01-${agentUpper}|${agentUpper}]]`,
      `- Creada: ${d.created_at}`,
      `- Accionable: ${d.actionable ? 'Sí' : 'No'}`,
    ].join('\n');
    await writeMd(absPath, fm, body);
  }
  return rows.length;
}

interface SynapseRow {
  id: string;
  from_agent: string;
  to_agent: string;
  synapse_type: string;
  weight: number;
  fire_count: number;
  success_count: number;
  last_fired_at?: string;
  created_at: string;
}

async function pullSynapses(sinceIso: string): Promise<number> {
  const { data, error } = await supabase
    .from('agent_synapses')
    .select('id, from_agent, to_agent, synapse_type, weight, fire_count, success_count, last_fired_at, created_at')
    .gte('weight', 0.55)
    .gte('fire_count', 1)
    .or(`created_at.gt.${sinceIso},last_fired_at.gt.${sinceIso}`)
    .order('weight', { ascending: false })
    .limit(200);
  if (error) throw error;
  const rows = (data ?? []) as SynapseRow[];
  for (const s of rows) {
    const from = s.from_agent.toUpperCase();
    const to = s.to_agent.toUpperCase();
    const strong = s.weight >= 0.7;
    const relPath = path.join(
      PATHS.vaultDirs.sinapsis,
      `${from}-${to}-${s.synapse_type}.md`,
    );
    const absPath = path.join(PATHS.vault, relPath);
    const fm = buildFrontmatter({
      type: 'synapse',
      title: `${from} ${s.synapse_type} ${to}`,
      tags: [
        `synapse/${s.synapse_type}`,
        strong ? 'type/synapse-strong' : 'type/synapse-weak',
        `agent/${from}`,
        `agent/${to}`,
      ],
      extra: {
        neural_id: s.id,
        weight: s.weight,
        fire_count: s.fire_count,
        success_count: s.success_count,
        updated: s.last_fired_at ?? s.created_at,
      },
    });
    const bar = '█'.repeat(Math.round(s.weight * 20)) + '░'.repeat(20 - Math.round(s.weight * 20));
    const body = [
      `> **${from} → ${to}** vía \`${s.synapse_type}\``,
      '',
      `**Peso:** \`${bar}\` ${s.weight.toFixed(3)}`,
      '',
      `- Veces activada: **${s.fire_count}**`,
      `- Éxitos: **${s.success_count}** (${s.fire_count ? ((s.success_count / s.fire_count) * 100).toFixed(0) : 0}%)`,
      `- Último disparo: ${s.last_fired_at ?? '—'}`,
      '',
      `## Protagonistas`,
      `- Desde: [[01-${from}|${from}]]`,
      `- Hacia: [[01-${to}|${to}]]`,
    ].join('\n');
    await writeMd(absPath, fm, body);
  }
  return rows.length;
}

async function main(): Promise<void> {
  const state = await loadState();
  console.log(`[pull] mode=${FULL ? 'FULL' : 'INCREMENTAL'}`);
  console.log(`[pull] since memories=${state.last_memories} discoveries=${state.last_discoveries} synapses=${state.last_synapses}`);

  const [mem, disc, syn] = await Promise.all([
    pullMemories(state.last_memories),
    pullDiscoveries(state.last_discoveries),
    pullSynapses(state.last_synapses),
  ]);
  console.log(`[pull] memorias: +${mem}, discoveries: +${disc}, sinapsis: +${syn}`);

  const ts = nowIso();
  await saveState({
    last_memories: ts,
    last_discoveries: ts,
    last_synapses: ts,
  });
  console.log(`[pull] state saved: ${ts}`);
}

main().catch(err => {
  console.error(`[pull] FATAL`, err);
  process.exit(1);
});
