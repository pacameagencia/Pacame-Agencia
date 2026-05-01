#!/usr/bin/env tsx
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { PATHS } from './lib/paths.ts';

const VAULT = PATHS.vault;
const PLUGINS = path.join(VAULT, '.obsidian', 'plugins');

async function readJson(file: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

async function configureLocalRestApi(): Promise<string> {
  const dir = path.join(PLUGINS, 'obsidian-local-rest-api');
  const dataFile = path.join(dir, 'data.json');
  const data = await readJson(dataFile);
  let apiKey = data.apiKey as string | undefined;
  if (!apiKey) {
    apiKey = crypto.randomBytes(32).toString('hex');
    console.log(`[config] Local REST API: generada API key nueva`);
  } else {
    console.log(`[config] Local REST API: API key existente preservada`);
  }
  await writeJson(dataFile, {
    ...data,
    apiKey,
    crypto: data.crypto ?? { cert: '', privateKey: '', publicKey: '' },
    port: 27124,
    insecurePort: 27123,
    enableInsecureServer: true,
    bindingHost: '127.0.0.1',
    subjectAltNames: '127.0.0.1',
  });
  return apiKey;
}

async function configureSmartConnections(): Promise<void> {
  const dir = path.join(PLUGINS, 'smart-connections');
  const dataFile = path.join(dir, 'data.json');
  const data = await readJson(dataFile);
  await writeJson(dataFile, {
    ...data,
    embed_model: {
      ...((data.embed_model as Record<string, unknown>) || {}),
      model_key: 'custom_local/nomic-embed-text',
      endpoint: 'http://72.62.185.125:11434/v1/embeddings',
      api_key: 'ollama',
      dims: 768,
      max_tokens: 2048,
    },
    chat_model: {
      ...((data.chat_model as Record<string, unknown>) || {}),
      adapter: 'custom_local',
      endpoint: 'http://72.62.185.125:11434/v1/chat/completions',
      model_key: 'gemma4:e2b',
      api_key: 'ollama',
    },
    folder_exclusions: '02-Subespecialistas,_templates',
    smart_view_filter: { show_full_path: true },
    version: 'custom-local',
  });
  console.log('[config] Smart Connections: endpoint VPS + nomic-embed-text');
}

async function configureCopilot(): Promise<void> {
  const dir = path.join(PLUGINS, 'copilot');
  const dataFile = path.join(dir, 'data.json');
  const data = await readJson(dataFile);
  await writeJson(dataFile, {
    ...data,
    activeModels: [
      {
        name: 'gemma4:e2b',
        provider: 'CUSTOM',
        enabled: true,
        baseUrl: 'http://72.62.185.125:11434/v1',
        apiKey: 'ollama',
        isBuiltIn: false,
        isEmbeddingModel: false,
      },
      {
        name: 'nomic-embed-text',
        provider: 'CUSTOM',
        enabled: true,
        baseUrl: 'http://72.62.185.125:11434/v1',
        apiKey: 'ollama',
        isBuiltIn: false,
        isEmbeddingModel: true,
      },
    ],
    defaultModelKey: 'gemma4:e2b|CUSTOM',
    embeddingModelKey: 'nomic-embed-text|CUSTOM',
    defaultSaveFolder: 'copilot-conversations',
    enableIndexSync: true,
  });
  console.log('[config] Copilot: Gemma 4 + nomic-embed-text (VPS)');
}

async function configureApp(): Promise<void> {
  const appFile = path.join(VAULT, '.obsidian', 'app.json');
  const data = await readJson(appFile);
  await writeJson(appFile, {
    ...data,
    legacyEditor: false,
    livePreview: true,
    promptDelete: false,
    showLineNumber: true,
  });
  console.log('[config] app.json: writing settings');
}

async function upsertEnvRoot(apiKey: string): Promise<void> {
  const envFile = path.join(PATHS.root, '.env');
  let txt = '';
  try {
    txt = await fs.readFile(envFile, 'utf8');
  } catch {}
  const line = `OBSIDIAN_API_KEY=${apiKey}`;
  if (txt.includes('OBSIDIAN_API_KEY=')) {
    txt = txt.replace(/OBSIDIAN_API_KEY=.*/g, line);
  } else {
    txt = (txt.trimEnd() + `\n# Obsidian Local REST API — auto-configurado por tools/obsidian-sync/configure-plugins.ts\n${line}\n`).trimStart();
  }
  await fs.writeFile(envFile, txt, 'utf8');
  console.log(`[config] .env: OBSIDIAN_API_KEY escrita en ${envFile}`);
}

async function main() {
  console.log(`[config] vault: ${VAULT}`);
  const apiKey = await configureLocalRestApi();
  await configureSmartConnections();
  await configureCopilot();
  await configureApp();
  await upsertEnvRoot(apiKey);
  console.log('[config] DONE. Abre Obsidian y acepta "Trust author & enable plugins" UNA vez.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
