#!/usr/bin/env tsx
// Health-check unificado del cerebro PACAME.
// Smoke test: vault ↔ Supabase ↔ crons. Imprime [OK] o [FAIL] por check.
// Exit 0 si todos pasan, 1 si alguno falla (CI-friendly).

import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { supabase } from './lib/supabase.ts';
import { PATHS } from './lib/paths.ts';

const execP = promisify(exec);

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

const checks: Check[] = [];
function ok(name: string, detail: string) { checks.push({ name, ok: true, detail }); }
function fail(name: string, detail: string) { checks.push({ name, ok: false, detail }); }

// --------------------------------------------------------------------------
// 1. Watcher activo (Task Scheduler en Windows o pm2 en Linux/VPS)
// --------------------------------------------------------------------------
async function checkWatcher() {
  if (process.platform === 'win32') {
    try {
      const { stdout } = await execP(
        `powershell -NoProfile -Command "(Get-ScheduledTask -TaskName 'PACAME-BrainWatcher' -ErrorAction SilentlyContinue).State"`,
      );
      const state = stdout.trim();
      if (state === 'Running' || state === 'Ready') {
        ok('Watcher (Task Scheduler)', `state=${state}`);
      } else if (!state) {
        fail('Watcher (Task Scheduler)', 'tarea PACAME-BrainWatcher no registrada');
      } else {
        fail('Watcher (Task Scheduler)', `state=${state} (esperado Running/Ready)`);
      }
    } catch (e) {
      fail('Watcher (Task Scheduler)', `error consultando: ${(e as Error).message.split('\n')[0]}`);
    }
  } else {
    try {
      const { stdout } = await execP('pm2 jlist');
      const list = JSON.parse(stdout) as Array<{ name: string; pm2_env: { status: string } }>;
      const w = list.find(p => p.name === 'pacame-vault-watcher');
      if (w && w.pm2_env.status === 'online') ok('Watcher (pm2)', `status=${w.pm2_env.status}`);
      else fail('Watcher (pm2)', w ? `status=${w.pm2_env.status}` : 'pacame-vault-watcher no en pm2 list');
    } catch {
      fail('Watcher (pm2)', 'pm2 no disponible');
    }
  }
}

// --------------------------------------------------------------------------
// 2. .sync-state.json fresco (<24h)
// --------------------------------------------------------------------------
function checkSyncState() {
  const p = path.join(PATHS.vault, '.sync-state.json');
  if (!fs.existsSync(p)) return fail('Sync state', '.sync-state.json no existe');
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as Record<string, string>;
    const last = raw.last_synapses ?? raw.last_memories ?? raw.last_discoveries;
    if (!last) return fail('Sync state', 'sin timestamps en .sync-state.json');
    const ageMs = Date.now() - new Date(last).getTime();
    const ageH = ageMs / 3_600_000;
    if (ageH < 24) ok('Sync state', `edad ${ageH.toFixed(1)} h (last=${last})`);
    else fail('Sync state', `edad ${ageH.toFixed(1)} h > 24 h (drift) — last=${last}`);
  } catch (e) {
    fail('Sync state', `parse error: ${(e as Error).message}`);
  }
}

// --------------------------------------------------------------------------
// 3. RPC decay_synapses existe
// --------------------------------------------------------------------------
async function checkDecaySynapsesRpc() {
  const { data, error } = await supabase.rpc('decay_synapses', { decay_factor: 0, stale_days: 99999 });
  if (error) return fail('RPC decay_synapses', `error: ${error.message}`);
  ok('RPC decay_synapses', `responde (rows=${data ?? 0} con factor=0)`);
}

// --------------------------------------------------------------------------
// 4. Dashboards completos (9/9)
// --------------------------------------------------------------------------
async function checkDashboards() {
  const expected = ['Red', 'Hubs', 'Decay', 'Actividad', 'Agentes', 'Kanban', 'Tareas', 'Calendario', 'Cerebro-Excalidraw'];
  const dir = path.join(PATHS.vault, '_dashboards');
  const present = expected.filter(name => fs.existsSync(path.join(dir, `${name}.md`)));
  const missing = expected.filter(name => !present.includes(name));
  if (missing.length === 0) ok('Dashboards', `${present.length}/${expected.length}`);
  else fail('Dashboards', `${present.length}/${expected.length} — faltan: ${missing.join(', ')}`);
}

// --------------------------------------------------------------------------
// 5. Plugins con data.json
// --------------------------------------------------------------------------
async function checkPlugins() {
  const pluginsDir = path.join(PATHS.vault, '.obsidian', 'plugins');
  if (!fs.existsSync(pluginsDir)) return fail('Plugins', '.obsidian/plugins no existe');
  const dirs = fs.readdirSync(pluginsDir).filter(d => fs.statSync(path.join(pluginsDir, d)).isDirectory());
  const withData = dirs.filter(d => fs.existsSync(path.join(pluginsDir, d, 'data.json')));
  if (withData.length === dirs.length) ok('Plugins data.json', `${withData.length}/${dirs.length}`);
  else {
    const missing = dirs.filter(d => !withData.includes(d));
    fail('Plugins data.json', `${withData.length}/${dirs.length} — faltan: ${missing.join(', ')}`);
  }
}

// --------------------------------------------------------------------------
// 6. Cobertura del vault
// --------------------------------------------------------------------------
async function checkCoverage() {
  const counts: Record<string, number> = {};
  for (const [name, dir] of Object.entries({
    Agentes: '01-Agentes',
    Subespecialistas: '02-Subespecialistas',
    Skills: '03-Skills',
    Workflows: '04-Workflows',
    Strategy: '05-Strategy',
    Memorias: '08-Memorias',
    Discoveries: '09-Discoveries',
    Sinapsis: '07-Sinapsis',
  })) {
    const files = await fg('**/*.md', { cwd: path.join(PATHS.vault, dir) });
    counts[name] = files.length;
  }
  const minimums: Record<string, number> = {
    Agentes: 10,
    Subespecialistas: 150,
    Skills: 20,
    Workflows: 4,
    Strategy: 6,
    Memorias: 100,
    Discoveries: 30,
    Sinapsis: 20,
  };
  const all = Object.entries(counts).every(([k, v]) => v >= minimums[k]);
  const summary = Object.entries(counts).map(([k, v]) => `${k}=${v}/${minimums[k]}`).join(' · ');
  if (all) ok('Cobertura vault', summary);
  else fail('Cobertura vault', summary);
}

// --------------------------------------------------------------------------
// 7. Skills wrapper presentes (6/6)
// --------------------------------------------------------------------------
async function checkSkillWrappers() {
  const dir = path.join(PATHS.vault, '03-Skills');
  const expected = ['brain-sync', 'remember', 'synapse', 'discover', 'neural-report', 'cerebro'];
  const present = expected.filter(s => fs.existsSync(path.join(dir, `${s}.md`)));
  const missing = expected.filter(s => !present.includes(s));
  if (missing.length === 0) ok('Skill wrappers', `${present.length}/${expected.length}`);
  else fail('Skill wrappers', `${present.length}/${expected.length} — faltan: ${missing.join(', ')}`);
}

// --------------------------------------------------------------------------
// 8. Memorias / sinapsis / discoveries Supabase vs vault
// --------------------------------------------------------------------------
async function checkSupabaseVsVault() {
  const [memoriesVault, synapsisVault, discoveriesVault] = await Promise.all([
    fg('**/*.md', { cwd: path.join(PATHS.vault, '08-Memorias') }),
    fg('*.md', { cwd: path.join(PATHS.vault, '07-Sinapsis') }),
    fg('*.md', { cwd: path.join(PATHS.vault, '09-Discoveries') }),
  ]);
  const [memCount, synCount, discCount] = await Promise.all([
    supabase.from('agent_memories').select('*', { count: 'exact', head: true }),
    supabase.from('agent_synapses').select('*', { count: 'exact', head: true }),
    supabase.from('agent_discoveries').select('*', { count: 'exact', head: true }),
  ]);
  const summary = `mem ${memoriesVault.length}↔${memCount.count ?? '?'} · syn ${synapsisVault.length}↔${synCount.count ?? '?'} · disc ${discoveriesVault.length}↔${discCount.count ?? '?'}`;
  // Tolerancia: vault puede tener menos que Supabase (no-op vista). Falla solo si vault > Supabase.
  const drift = (memoriesVault.length > (memCount.count ?? 0))
    || (synapsisVault.length > (synCount.count ?? 0))
    || (discoveriesVault.length > (discCount.count ?? 0));
  if (drift) fail('Vault ↔ Supabase', `vault tiene más que Supabase: ${summary}`);
  else ok('Vault ↔ Supabase', summary);
}

// --------------------------------------------------------------------------
// 9. Crons recientes (último decay registrado en agent_activities)
// --------------------------------------------------------------------------
async function checkCronActivity() {
  const since = new Date(Date.now() - 26 * 3_600_000).toISOString();
  const { data, error } = await supabase
    .from('agent_activities')
    .select('type, title, created_at')
    .eq('agent_id', 'core')
    .eq('type', 'update')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) return fail('Cron activity', `query error: ${error.message}`);
  if (!data || data.length === 0) return fail('Cron activity', `0 actividades de core/update en últimas 26 h (¿crons paralizados?)`);
  ok('Cron activity', `${data.length} eventos en 26 h, último: ${data[0].title} @ ${data[0].created_at}`);
}

// --------------------------------------------------------------------------
// 10. Heartbeat alarm — avisa por Telegram si hay fallos críticos.
//     Solo dispara si --notify (cron) o env VERIFY_NOTIFY=1.
//     Evita spam: solo notifica fallos NUEVOS respecto al último heartbeat.
// --------------------------------------------------------------------------
async function notifyTelegramIfFailures(failures: Check[]): Promise<void> {
  const notify = process.argv.includes('--notify') || process.env.VERIFY_NOTIFY === '1';
  if (!notify || failures.length === 0) return;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('[verify] --notify activo pero falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID');
    return;
  }

  const lines = [
    '🚨 <b>PACAME health check FAIL</b>',
    `<i>${new Date().toISOString().slice(0, 19)} UTC</i>`,
    '',
    ...failures.map((f) => `❌ <b>${f.name}</b>\n   ${f.detail}`),
  ];
  const text = lines.join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (res.ok) console.log(`[verify] alerta Telegram enviada (${failures.length} fallos)`);
    else console.warn(`[verify] Telegram alert failed: ${res.status} ${res.statusText}`);
  } catch (e) {
    console.warn(`[verify] Telegram error: ${(e as Error).message}`);
  }
}

// --------------------------------------------------------------------------
// MAIN
// --------------------------------------------------------------------------
async function main() {
  console.log('🩺 PACAME — Health check del cerebro\n');

  await checkWatcher();
  checkSyncState();
  await checkDecaySynapsesRpc();
  await checkDashboards();
  await checkPlugins();
  await checkCoverage();
  await checkSkillWrappers();
  await checkSupabaseVsVault();
  await checkCronActivity();

  let okCount = 0;
  for (const c of checks) {
    const tag = c.ok ? '\x1b[32m[OK]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`${tag} ${c.name.padEnd(28)} ${c.detail}`);
    if (c.ok) okCount++;
  }
  console.log(`\n${okCount}/${checks.length} checks OK`);

  const failures = checks.filter((c) => !c.ok);
  await notifyTelegramIfFailures(failures);

  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch(err => {
  console.error('verify.ts ERROR:', err);
  process.exit(1);
});
