import matter from 'gray-matter';
import fs from 'node:fs/promises';

export type NodeType =
  | 'agent'
  | 'subspecialist'
  | 'skill'
  | 'workflow'
  | 'strategy'
  | 'memory'
  | 'discovery'
  | 'synapse'
  | 'client'
  | 'concept';

export interface VaultFrontmatter {
  neural_id?: string;
  type: NodeType;
  agent?: string;
  title: string;
  tags: string[];
  created: string;
  updated?: string;
  source_path?: string;
  confidence?: number;
  weight?: number;
  [k: string]: unknown;
}

export async function readMd(file: string): Promise<{ data: Record<string, unknown>; content: string }> {
  const raw = await fs.readFile(file, 'utf8');
  try {
    const { data, content } = matter(raw);
    return { data, content };
  } catch {
    // Frontmatter YAML inválido: trato todo como body.
    const stripped = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
    return { data: {}, content: stripped };
  }
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = stripUndefined(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function writeMd(file: string, fm: VaultFrontmatter, body: string): Promise<void> {
  const clean = stripUndefined(fm as Record<string, unknown>);
  const out = matter.stringify(body, clean);
  await fs.mkdir(pathDir(file), { recursive: true });
  await fs.writeFile(file, out, 'utf8');
}

function pathDir(file: string): string {
  const i = Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\'));
  return file.slice(0, i);
}

export function buildFrontmatter(input: {
  type: NodeType;
  title: string;
  agent?: string;
  tags?: string[];
  source_path?: string;
  extra?: Record<string, unknown>;
}): VaultFrontmatter {
  const now = new Date().toISOString();
  const tags = [`type/${input.type}`, ...(input.tags ?? [])];
  if (input.agent) tags.push(`agent/${input.agent}`);
  return {
    type: input.type,
    title: input.title,
    agent: input.agent,
    tags,
    created: now,
    source_path: input.source_path,
    ...(input.extra ?? {}),
  };
}
