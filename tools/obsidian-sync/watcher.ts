#!/usr/bin/env tsx
/**
 * Watcher real-time: vault → Supabase.
 * - chokidar observa `PacameCueva/**\/*.md`.
 * - On add/change: upsert knowledge_node + reescribe frontmatter con neural_id.
 * - Extrae [[wikilinks]] → linkKnowledge + fire_synapse si ambos lados son agentes.
 * - Debounce 2s por archivo.
 * - On unlink: marca metadata.deleted=true (soft delete, el nodo sigue en DB).
 *
 * Uso local:   npx tsx tools/obsidian-sync/watcher.ts
 * Uso VPS pm2: pm2 start ecosystem.config.js
 */
import chokidar from 'chokidar';
import path from 'node:path';
import fs from 'node:fs/promises';
import { PATHS, AGENTS } from './lib/paths.ts';
import { readMd, writeMd, buildFrontmatter, type NodeType } from './lib/frontmatter.ts';
import { extractWikilinks } from './lib/wikilinks.ts';
import { supabase, upsertKnowledgeNode, linkKnowledge } from './lib/supabase.ts';

const VAULT = PATHS.vault;
const DEBOUNCE_MS = 2000;

const VAULT_TYPE_TO_DB: Record<NodeType, string> = {
  agent: 'tool',
  subspecialist: 'tool',
  skill: 'skill',
  workflow: 'playbook',
  strategy: 'playbook',
  memory: 'concept',
  discovery: 'hypothesis',
  synapse: 'concept',
  client: 'entity',
  concept: 'concept',
};

const timers = new Map<string, NodeJS.Timeout>();

function inferTypeFromPath(abs: string): NodeType {
  const rel = path.relative(VAULT, abs).replace(/\\/g, '/');
  if (rel.startsWith('00-Dios/')) return 'agent';
  if (rel.startsWith('01-Agentes/')) return 'agent';
  if (rel.startsWith('02-Subespecialistas/')) return 'subspecialist';
  if (rel.startsWith('03-Skills/')) return 'skill';
  if (rel.startsWith('04-Workflows/')) return 'workflow';
  if (rel.startsWith('05-Strategy/')) return 'strategy';
  if (rel.startsWith('06-Clientes/')) return 'client';
  if (rel.startsWith('07-Sinapsis/')) return 'synapse';
  if (rel.startsWith('08-Memorias/')) return 'memory';
  if (rel.startsWith('09-Discoveries/')) return 'discovery';
  return 'concept';
}

function inferAgentFromPath(abs: string): string | undefined {
  const rel = path.relative(VAULT, abs).replace(/\\/g, '/');
  const upperRel = rel.toUpperCase();
  for (const a of AGENTS) {
    if (upperRel.includes(`/${a}`) || upperRel.includes(`${a}.MD`)) return a;
  }
  return undefined;
}

function isAgentTitle(title: string): string | undefined {
  const u = title.toUpperCase();
  return AGENTS.find(a => u.includes(a));
}

async function resolveNeuralIdByTitle(title: string): Promise<string | null> {
  const { data } = await supabase
    .from('knowledge_nodes')
    .select('id')
    .ilike('label', title)
    .limit(1)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

async function handleFile(abs: string): Promise<void> {
  const rel = path.relative(VAULT, abs).replace(/\\/g, '/');
  if (rel.startsWith('_templates/') || rel.startsWith('_dashboards/')) return;
  if (rel.includes('/.obsidian/') || rel.startsWith('.obsidian/')) return;
  if (rel.startsWith('.trash/') || rel.startsWith('.sync/')) return;

  const type = inferTypeFromPath(abs);
  const agent = inferAgentFromPath(abs);

  let parsed;
  try {
    parsed = await readMd(abs);
  } catch (err) {
    console.error(`[watcher] read fail ${rel}:`, (err as Error).message);
    return;
  }

  const { data: fm, content } = parsed;
  const title = (fm.title as string) || path.basename(abs, '.md');
  const existingNeuralId = fm.neural_id as string | undefined;

  const tags: string[] = [
    `type/${type}`,
    ...(agent ? [`agent/${agent}`] : []),
    ...((fm.tags as string[] | undefined) ?? []),
  ];

  try {
    const neuralId = await upsertKnowledgeNode({
      node_type: VAULT_TYPE_TO_DB[type],
      label: title,
      content: content.slice(0, 4000),
      owner_agent: agent ?? undefined,
      tags,
      confidence: (fm.confidence as number | undefined) ?? 0.85,
      metadata: {
        source_path: abs,
        vault_path: rel,
        last_sync: new Date().toISOString(),
      },
    });

    if (!existingNeuralId || existingNeuralId !== neuralId) {
      const nextFm = buildFrontmatter({
        type,
        title,
        agent,
        tags: ((fm.tags as string[] | undefined) ?? []).filter(
          t => !t.startsWith('type/') && !t.startsWith('agent/'),
        ),
        source_path: (fm.source_path as string | undefined) ?? abs,
        extra: { neural_id: neuralId, updated: new Date().toISOString() },
      });
      await writeMd(abs, nextFm, content);
      console.log(`[watcher] ${rel} → upsert (new neural_id)`);
    } else {
      console.log(`[watcher] ${rel} → upsert (content updated)`);
    }

    const wikilinks = extractWikilinks(content);
    let edges = 0;
    let synapses = 0;
    const fromAgent = agent ? agent.toLowerCase() : null;

    for (const link of wikilinks) {
      const toId = await resolveNeuralIdByTitle(link);
      if (toId && toId !== neuralId) {
        await linkKnowledge(neuralId, toId, 'references', 0.5);
        edges++;
      }
      const toAgent = isAgentTitle(link);
      if (fromAgent && toAgent && fromAgent !== toAgent.toLowerCase()) {
        try {
          await supabase.rpc('fire_synapse', {
            p_from: fromAgent,
            p_to: toAgent.toLowerCase(),
            p_type: 'references',
            p_success: true,
          });
          synapses++;
        } catch {
          // agent_states FK: silenciado si falta un agente
        }
      }
    }
    if (edges || synapses) {
      console.log(`[watcher]   +${edges} edges, +${synapses} synapses (${wikilinks.length} links)`);
    }
  } catch (err) {
    console.error(`[watcher] upsert fail ${rel}:`, (err as Error).message);
  }
}

function queue(abs: string): void {
  clearTimeout(timers.get(abs));
  timers.set(
    abs,
    setTimeout(() => {
      timers.delete(abs);
      handleFile(abs).catch(err =>
        console.error(`[watcher] handler error:`, err),
      );
    }, DEBOUNCE_MS),
  );
}

async function softDelete(abs: string): Promise<void> {
  const rel = path.relative(VAULT, abs).replace(/\\/g, '/');
  const title = path.basename(abs, '.md');
  const { data } = await supabase
    .from('knowledge_nodes')
    .select('id, metadata')
    .ilike('label', title)
    .limit(1)
    .maybeSingle();
  if (!data?.id) return;
  await supabase
    .from('knowledge_nodes')
    .update({
      metadata: {
        ...(data.metadata as Record<string, unknown>),
        deleted: true,
        deleted_at: new Date().toISOString(),
      },
    })
    .eq('id', data.id);
  console.log(`[watcher] ${rel} → soft-deleted`);
}

async function heartbeat(): Promise<void> {
  try {
    const { count } = await supabase
      .from('knowledge_nodes')
      .select('*', { count: 'exact', head: true });
    console.log(`[watcher] heartbeat: ${count} knowledge_nodes`);
  } catch (err) {
    console.error(`[watcher] heartbeat error:`, (err as Error).message);
  }
}

async function main(): Promise<void> {
  console.log(`[watcher] vault: ${VAULT}`);
  console.log(`[watcher] debounce: ${DEBOUNCE_MS}ms`);
  await fs.access(VAULT);

  const watcher = chokidar.watch('**/*.md', {
    cwd: VAULT,
    ignored: [
      '**/.obsidian/**',
      '**/_templates/**',
      '**/_dashboards/**',
      '**/.trash/**',
      '**/.sync/**',
      '**/node_modules/**',
    ],
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on('add', rel => queue(path.join(VAULT, rel)));
  watcher.on('change', rel => queue(path.join(VAULT, rel)));
  watcher.on('unlink', rel => softDelete(path.join(VAULT, rel)).catch(console.error));
  watcher.on('error', err => console.error(`[watcher] error:`, err));
  watcher.on('ready', () => console.log(`[watcher] READY. Listening for vault changes…`));

  setInterval(() => heartbeat().catch(() => undefined), 5 * 60 * 1000);

  process.on('SIGINT', () => {
    console.log(`\n[watcher] SIGINT, cerrando…`);
    watcher.close().finally(() => process.exit(0));
  });
}

main().catch(err => {
  console.error(`[watcher] FATAL`, err);
  process.exit(1);
});
