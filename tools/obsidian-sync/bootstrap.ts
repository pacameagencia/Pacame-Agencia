#!/usr/bin/env tsx
import fg from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PATHS, AGENTS } from './lib/paths.ts';
import { buildFrontmatter, readMd, writeMd, type NodeType } from './lib/frontmatter.ts';
import { extractWikilinks, slugify } from './lib/wikilinks.ts';
import { upsertKnowledgeNode, linkKnowledge } from './lib/supabase.ts';

const COMMIT = process.argv.includes('--commit');
const DRY = !COMMIT;

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

interface SourceFile {
  srcPath: string;
  title: string;
  nodeType: NodeType;
  agent?: string;
  domain?: string;
  vaultRelPath: string;
  body: string;
  wikilinks: string[];
}

async function toSourceFile(
  srcPath: string,
  nodeType: NodeType,
  vaultDir: string,
  opts: { agent?: string; domain?: string } = {},
): Promise<SourceFile> {
  const { data, content } = await readMd(srcPath);
  const filename = path.basename(srcPath);
  const title = (data.title as string) || filename.replace(/\.md$/, '');
  const slug = slugify(filename.replace(/\.md$/, ''));
  const vaultRelPath = opts.domain
    ? path.join(vaultDir, opts.domain, `${slug}.md`)
    : path.join(vaultDir, `${slug}.md`);
  return {
    srcPath,
    title,
    nodeType,
    agent: opts.agent,
    domain: opts.domain,
    vaultRelPath,
    body: content,
    wikilinks: extractWikilinks(content),
  };
}

async function collectSources(): Promise<SourceFile[]> {
  const out: SourceFile[] = [];

  // Agents (10 principales + DIOS + SYSTEM + PLAN)
  const agentFiles = await fg('*.md', { cwd: PATHS.sources.agents, absolute: true });
  for (const f of agentFiles) {
    const name = path.basename(f, '.md');
    const isDios = /^DIOS|PLAN-COMPLETO$/i.test(name);
    const isAgent = AGENTS.some(a => name.toUpperCase().includes(a));
    const code = AGENTS.find(a => name.toUpperCase().includes(a));
    out.push(
      await toSourceFile(
        f,
        'agent',
        isDios ? PATHS.vaultDirs.dios : PATHS.vaultDirs.agentes,
        { agent: code ?? (isAgent ? undefined : 'DIOS') },
      ),
    );
  }

  // Subespecialistas (agency-agents por dominio)
  const subFiles = await fg('*/**/*.md', {
    cwd: PATHS.sources.subspecialists,
    absolute: true,
    ignore: ['**/README*.md', '**/CONTRIBUTING*.md', '**/LICENSE*'],
  });
  for (const f of subFiles) {
    const rel = path.relative(PATHS.sources.subspecialists, f).replace(/\\/g, '/');
    const [domain] = rel.split('/');
    out.push(await toSourceFile(f, 'subspecialist', PATHS.vaultDirs.subespecialistas, { domain }));
  }

  // Workflows
  const wfFiles = await fg('*.md', { cwd: PATHS.sources.workflows, absolute: true });
  for (const f of wfFiles) {
    out.push(await toSourceFile(f, 'workflow', PATHS.vaultDirs.workflows));
  }

  // Strategy
  const stFiles = await fg('*.md', { cwd: PATHS.sources.strategy, absolute: true });
  for (const f of stFiles) {
    out.push(await toSourceFile(f, 'strategy', PATHS.vaultDirs.strategy));
  }

  // Skills (.md sueltos en top-level + SKILL.md de carpetas)
  const skillTopFiles = await fg('*.md', { cwd: PATHS.sources.skills, absolute: true });
  const skillDirSkills = await fg('*/SKILL.md', { cwd: PATHS.sources.skills, absolute: true });
  for (const f of [...skillTopFiles, ...skillDirSkills]) {
    const isDir = f.endsWith('SKILL.md');
    const title = isDir
      ? path.basename(path.dirname(f))
      : path.basename(f, '.md');
    const slug = slugify(title);
    const { data, content } = await readMd(f);
    out.push({
      srcPath: f,
      title: (data.name as string) || title,
      nodeType: 'skill',
      vaultRelPath: path.join(PATHS.vaultDirs.skills, `${slug}.md`),
      body: content,
      wikilinks: extractWikilinks(content),
    });
  }

  return out;
}

async function ensureVaultDirs() {
  const dirs = [
    PATHS.vaultDirs.dios,
    PATHS.vaultDirs.agentes,
    PATHS.vaultDirs.subespecialistas,
    PATHS.vaultDirs.skills,
    PATHS.vaultDirs.workflows,
    PATHS.vaultDirs.strategy,
    PATHS.vaultDirs.clientes,
    PATHS.vaultDirs.sinapsis,
    PATHS.vaultDirs.memorias,
    PATHS.vaultDirs.discoveries,
    PATHS.vaultDirs.templates,
    PATHS.vaultDirs.dashboards,
  ];
  for (const d of dirs) {
    await fs.mkdir(path.join(PATHS.vault, d), { recursive: true });
  }
}

async function main() {
  console.log(`[bootstrap] mode=${DRY ? 'DRY-RUN' : 'COMMIT'}`);
  console.log(`[bootstrap] vault=${PATHS.vault}`);

  await ensureVaultDirs();

  const sources = await collectSources();
  console.log(`[bootstrap] sources: ${sources.length}`);

  const byType: Record<string, number> = {};
  for (const s of sources) byType[s.nodeType] = (byType[s.nodeType] ?? 0) + 1;
  console.log(`[bootstrap] by type:`, byType);

  if (DRY) {
    console.log('[bootstrap] DRY-RUN complete. Re-run with --commit to write vault + Supabase.');
    return;
  }

  const titleToNeuralId = new Map<string, string>();

  let written = 0;
  for (const s of sources) {
    const neuralId = await upsertKnowledgeNode({
      node_type: VAULT_TYPE_TO_DB[s.nodeType],
      label: s.title,
      content: s.body.slice(0, 4000),
      owner_agent: s.agent ?? null as unknown as string,
      tags: [`type/${s.nodeType}`, ...(s.agent ? [`agent/${s.agent}`] : []), ...(s.domain ? [`domain/${s.domain}`] : [])],
      confidence: 0.9,
      metadata: { source_path: s.srcPath, vault_path: s.vaultRelPath },
    });
    titleToNeuralId.set(s.title, neuralId);

    const fm = buildFrontmatter({
      type: s.nodeType,
      title: s.title,
      agent: s.agent,
      tags: s.domain ? [`domain/${s.domain}`] : [],
      source_path: s.srcPath,
      extra: { neural_id: neuralId },
    });
    await writeMd(path.join(PATHS.vault, s.vaultRelPath), fm, s.body);
    written++;
    if (written % 50 === 0) console.log(`[bootstrap] written ${written}/${sources.length}`);
  }
  console.log(`[bootstrap] wrote ${written} vault files + knowledge_nodes.`);

  let edgeCount = 0;
  for (const s of sources) {
    const fromId = titleToNeuralId.get(s.title);
    if (!fromId) continue;
    for (const link of s.wikilinks) {
      const toId = titleToNeuralId.get(link);
      if (!toId) continue;
      await linkKnowledge(fromId, toId, 'references', 0.5);
      edgeCount++;
    }
  }
  console.log(`[bootstrap] wrote ${edgeCount} knowledge_edges (wikilinks).`);

  // Seed relaciones explícitas 10 agentes hub
  const agentIds = new Map<string, string>();
  for (const [title, id] of titleToNeuralId) {
    const code = AGENTS.find(a => title.toUpperCase().includes(a));
    if (code && !agentIds.has(code)) agentIds.set(code, id);
  }
  console.log(`[bootstrap] agent hubs resolved: ${agentIds.size}/${AGENTS.length}`);

  const hubRelations: Array<[string, string, string]> = [
    ['DIOS', 'SAGE', 'orchestrates'],
    ['DIOS', 'ATLAS', 'orchestrates'],
    ['DIOS', 'NEXUS', 'orchestrates'],
    ['DIOS', 'PIXEL', 'orchestrates'],
    ['DIOS', 'CORE', 'orchestrates'],
    ['DIOS', 'PULSE', 'orchestrates'],
    ['DIOS', 'NOVA', 'orchestrates'],
    ['DIOS', 'COPY', 'orchestrates'],
    ['DIOS', 'LENS', 'orchestrates'],
    ['SAGE', 'COPY', 'delegates_to'],
    ['SAGE', 'LENS', 'consults'],
    ['NEXUS', 'PIXEL', 'delegates_to'],
    ['NEXUS', 'COPY', 'delegates_to'],
    ['NEXUS', 'LENS', 'consults'],
    ['PIXEL', 'CORE', 'collaborates_with'],
    ['PIXEL', 'NOVA', 'reviewed_by'],
    ['ATLAS', 'COPY', 'collaborates_with'],
    ['ATLAS', 'PULSE', 'learns_from'],
    ['NOVA', 'COPY', 'reviews'],
    ['NOVA', 'PULSE', 'reviews'],
    ['NOVA', 'NEXUS', 'reviews'],
    ['LENS', 'SAGE', 'collaborates_with'],
    ['LENS', 'NEXUS', 'collaborates_with'],
    ['LENS', 'ATLAS', 'collaborates_with'],
  ];
  let hubEdges = 0;
  for (const [from, to, rel] of hubRelations) {
    const f = agentIds.get(from);
    const t = agentIds.get(to);
    if (f && t) {
      await linkKnowledge(f, t, rel, 0.7);
      hubEdges++;
    }
  }
  console.log(`[bootstrap] wrote ${hubEdges} agent hub edges.`);
  console.log('[bootstrap] DONE.');
}

main().catch(err => {
  console.error('[bootstrap] ERROR', err);
  process.exit(1);
});
