#!/usr/bin/env node
/**
 * brain-pull.mjs — sincroniza cerebro Supabase → vault Obsidian PacameCueva.
 *
 * Lee agent_memories y agent_discoveries con tag "auto-aprendizaje" creadas
 * en las últimas N horas (default 72h), y las materializa como .md en:
 *   - PacameCueva/08-Memorias/<AGENTE>/<fecha>-<slug>.md
 *   - PacameCueva/09-Discoveries/<fecha>-<slug>.md
 *
 * Idempotente: si el archivo ya existe (por el mismo memory_id), lo sobreescribe
 * con la versión más reciente (lo cual mantiene Supabase como fuente de verdad).
 *
 * Uso:
 *   node web/scripts/brain-pull.mjs                # últimas 72h
 *   node web/scripts/brain-pull.mjs --hours 24
 *   node web/scripts/brain-pull.mjs --since 2026-04-20
 *   node web/scripts/brain-pull.mjs --commit       # auto-git-commit del vault
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const VAULT = join(REPO_ROOT, "PacameCueva");
const ENV_FILE = join(REPO_ROOT, "web", ".env.local");

// --- Cargar .env.local manualmente (sin dotenv) ---
function loadEnv(file) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}
loadEnv(ENV_FILE);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[brain-pull] FALTAN env vars NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const args = process.argv.slice(2);
const hoursArg = args.indexOf("--hours");
const sinceArg = args.indexOf("--since");
const doCommit = args.includes("--commit");
const hours = hoursArg >= 0 ? Number(args[hoursArg + 1]) : null;
const sinceFlag = sinceArg >= 0 ? args[sinceArg + 1] : null;

const since = sinceFlag
  ? new Date(sinceFlag).toISOString()
  : new Date(Date.now() - (hours ?? 72) * 3600_000).toISOString();

console.log(`[brain-pull] Sync desde ${since}`);
console.log(`[brain-pull] Vault: ${VAULT}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// --- Helpers ---
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function escapeYaml(s) {
  return String(s).replace(/"/g, '\\"').replace(/\n/g, " ");
}

function frontmatter(obj) {
  const lines = ["---"];
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      lines.push(`${k}:`);
      for (const item of v) lines.push(`  - "${escapeYaml(item)}"`);
    } else {
      lines.push(`${k}: "${escapeYaml(v)}"`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

function dateStamp(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

// --- Pull memorias ---
async function pullMemories() {
  const { data, error } = await supabase
    .from("agent_memories")
    .select("id, agent_id, title, content, tags, importance, metadata, created_at")
    .gte("created_at", since)
    .contains("tags", ["auto-aprendizaje"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[brain-pull] Error memorias:", error.message);
    return 0;
  }
  if (!data || data.length === 0) {
    console.log("[brain-pull] 0 memorias nuevas");
    return 0;
  }

  let written = 0;
  for (const m of data) {
    const agentDir = String(m.agent_id || "_unknown").toUpperCase();
    const dir = join(VAULT, "08-Memorias", agentDir);
    ensureDir(dir);
    const fname = `${dateStamp(m.created_at)}-${slugify(m.title)}.md`;
    const fpath = join(dir, fname);

    const meta = m.metadata || {};
    const links = (meta.cross_agent_links || [])
      .map((l) => `[[08-Memorias/${String(l.agent).toUpperCase()}|${String(l.agent).toUpperCase()}]] — ${l.reason}`)
      .join("\n- ");

    const fm = frontmatter({
      type: "memoria",
      agent: m.agent_id,
      memory_id: m.id,
      created: m.created_at,
      importance: m.importance,
      source: meta.source || "auto-learn",
      topic: meta.topic || "",
      provider: meta.provider || "",
      model: meta.model || "",
      tags: m.tags || [],
    });

    const body = [
      `# ${m.title}`,
      "",
      m.content || "",
      "",
      links ? "## Cross-agent links\n\n- " + links : "",
      "",
      `> Auto-generada por loop de aprendizaje PACAME · ${m.created_at}`,
    ].join("\n");

    writeFileSync(fpath, fm + body, "utf8");
    written++;
  }
  console.log(`[brain-pull] Memorias escritas: ${written}`);
  return written;
}

// --- Pull discoveries ---
async function pullDiscoveries() {
  const { data, error } = await supabase
    .from("agent_discoveries")
    .select("id, agent_id, type, title, description, suggested_action, evidence, impact, confidence, metadata, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[brain-pull] Error discoveries:", error.message);
    return 0;
  }
  if (!data) return 0;

  // Filtrar solo los de auto-learn (vienen en metadata.source)
  const filtered = data.filter((d) => (d.metadata || {}).source === "auto-learn");
  if (filtered.length === 0) {
    console.log("[brain-pull] 0 discoveries nuevos auto-learn");
    return 0;
  }

  const dir = join(VAULT, "09-Discoveries");
  ensureDir(dir);

  let written = 0;
  for (const d of filtered) {
    const fname = `${dateStamp(d.created_at)}-${slugify(d.title)}.md`;
    const fpath = join(dir, fname);
    const meta = d.metadata || {};

    const fm = frontmatter({
      type: "discovery",
      discovery_type: d.type,
      agent: d.agent_id,
      discovery_id: d.id,
      created: d.created_at,
      impact: d.impact,
      confidence: d.confidence,
      source: meta.source || "auto-learn",
      topic: meta.topic || "",
      tags: ["discovery", `agent:${d.agent_id}`, `type:${d.type}`],
    });

    const apps = (meta.applications || []).map((a) => `- ${a}`).join("\n");
    const links = (meta.cross_agent_links || [])
      .map((l) => `- ${String(l.agent).toUpperCase()} → ${l.reason}`)
      .join("\n");

    const body = [
      `# ${d.title}`,
      "",
      d.description || "",
      "",
      d.suggested_action ? `## Acción sugerida\n\n${d.suggested_action}` : "",
      apps ? `## Aplicaciones PACAME\n\n${apps}` : "",
      links ? `## Cross-agent\n\n${links}` : "",
      d.evidence ? `## Evidencia\n\n${d.evidence}` : "",
      "",
      `> Auto-generada por loop de aprendizaje PACAME · ${d.created_at}`,
    ].filter(Boolean).join("\n");

    writeFileSync(fpath, fm + body, "utf8");
    written++;
  }
  console.log(`[brain-pull] Discoveries escritos: ${written}`);
  return written;
}

// --- Main ---
const m = await pullMemories();
const d = await pullDiscoveries();
console.log(`[brain-pull] Total: ${m + d} archivos`);

if (doCommit && (m + d) > 0) {
  try {
    execSync(`git -C "${REPO_ROOT}" add PacameCueva/08-Memorias PacameCueva/09-Discoveries`, { stdio: "inherit" });
    execSync(
      `git -C "${REPO_ROOT}" commit -m "brain-pull: ${m} memorias + ${d} discoveries auto-learn"`,
      { stdio: "inherit" }
    );
    console.log("[brain-pull] Commit creado");
  } catch (e) {
    console.warn("[brain-pull] Commit fallo (puede no haber cambios):", e.message);
  }
}

process.exit(0);
