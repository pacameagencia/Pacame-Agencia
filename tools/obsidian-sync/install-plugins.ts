#!/usr/bin/env tsx
import fs from 'node:fs/promises';
import path from 'node:path';
import { PATHS } from './lib/paths.ts';

interface PluginSpec {
  id: string;
  repo: string; // owner/name
  files?: string[]; // overrides defaults
}

const PLUGINS: PluginSpec[] = [
  { id: 'obsidian-local-rest-api', repo: 'coddingtonbear/obsidian-local-rest-api' },
  { id: 'dataview', repo: 'blacksmithgu/obsidian-dataview' },
  { id: 'templater-obsidian', repo: 'SilentVoid13/Templater' },
  { id: '3d-graph', repo: 'AlexW00/obsidian-3d-graph' },
  { id: 'juggl', repo: 'HEmile/juggl' },
  { id: 'smart-connections', repo: 'brianpetro/obsidian-smart-connections' },
  { id: 'graph-analysis', repo: 'SkepticMystic/graph-analysis' },
  { id: 'copilot', repo: 'logancyang/obsidian-copilot' },
];

const DEFAULT_FILES = ['manifest.json', 'main.js', 'styles.css'];

interface GithubRelease {
  tag_name: string;
  assets: Array<{ name: string; browser_download_url: string }>;
}

async function getLatestRelease(repo: string): Promise<GithubRelease> {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { 'User-Agent': 'pacame-obsidian-sync' },
  });
  if (!res.ok) throw new Error(`GitHub API ${repo}: ${res.status} ${res.statusText}`);
  return (await res.json()) as GithubRelease;
}

async function downloadTo(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'pacame-obsidian-sync' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

async function installPlugin(spec: PluginSpec): Promise<void> {
  const pluginDir = path.join(PATHS.vault, '.obsidian', 'plugins', spec.id);
  console.log(`[plugins] ${spec.id} <- ${spec.repo}`);

  let release: GithubRelease;
  try {
    release = await getLatestRelease(spec.repo);
  } catch (e) {
    console.warn(`  SKIP ${spec.id}: ${(e as Error).message}`);
    return;
  }

  const wanted = spec.files ?? DEFAULT_FILES;
  let installed = 0;
  for (const fname of wanted) {
    const asset = release.assets.find(a => a.name === fname);
    if (!asset) {
      if (fname === 'styles.css') continue; // opcional
      console.warn(`  FALTA ${fname} en release ${release.tag_name}`);
      continue;
    }
    await downloadTo(asset.browser_download_url, path.join(pluginDir, fname));
    installed++;
  }
  console.log(`  OK ${spec.id} @ ${release.tag_name} (${installed} archivos)`);
}

async function writeCommunityPluginsJson(): Promise<void> {
  const list = PLUGINS.map(p => p.id);
  const file = path.join(PATHS.vault, '.obsidian', 'community-plugins.json');
  await fs.writeFile(file, JSON.stringify(list, null, 2), 'utf8');
  console.log(`[plugins] community-plugins.json actualizado`);
}

async function main() {
  console.log(`[plugins] destino: ${path.join(PATHS.vault, '.obsidian', 'plugins')}`);
  for (const p of PLUGINS) {
    try {
      await installPlugin(p);
    } catch (e) {
      console.error(`  ERROR ${p.id}:`, (e as Error).message);
    }
  }
  await writeCommunityPluginsJson();
  console.log('[plugins] DONE. Abre Obsidian -> Settings -> Community plugins -> habilita manualmente si no quedan activos.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
