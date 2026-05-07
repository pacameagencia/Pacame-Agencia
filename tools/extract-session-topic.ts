#!/usr/bin/env tsx
/**
 * Hook script — dispara extracción de tema de la sesión Claude Code recién cerrada.
 *
 * Se invoca desde .claude/settings.json:
 *   - SessionEnd (default): procesa la sesión que se acaba de cerrar.
 *   - SessionStart con --fallback: busca sesiones anteriores sin procesar.
 *
 * Lógica:
 *   1. Localiza el .jsonl de sesión actual ($CLAUDE_SESSION_ID si está disponible,
 *      o el .jsonl más reciente del proyecto).
 *   2. POST a /api/neural/sessions/extract-topic con sessionId + jsonlPath.
 *   3. Errores se loguean a tools/output/extract-topic.log y NO bloquean el cierre.
 *
 * Idempotente: si una sesión ya se procesó (DB lo sabe), el endpoint devuelve
 * { skipped: true } sin llamar al LLM.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const FALLBACK_MODE = process.argv.includes("--fallback");
const ENDPOINT =
  process.env.PACAME_EXTRACT_TOPIC_URL ||
  "https://pacameagencia.com/api/neural/sessions/extract-topic";
const PROJECT_DIR =
  process.env.CLAUDE_PROJECT_DIR ||
  process.cwd();

const PROJECTS_HOME = path.join(
  os.homedir(),
  ".claude",
  "projects"
);

function logFile(): string {
  const dir = path.join(PROJECT_DIR, "tools", "output");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "extract-topic.log");
}

function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile(), line);
  } catch {
    // si log falla, no bloqueamos cierre
  }
}

function encodeProjectPath(absPath: string): string {
  return absPath
    .replace(/[\\/:\s]/g, "-")
    .replace(/^-+/, "");
}

function findSessionJsonl(): { sessionId: string; jsonlPath: string } | null {
  const projectKey = encodeProjectPath(PROJECT_DIR);
  const projectDir = path.join(PROJECTS_HOME, projectKey);
  if (!fs.existsSync(projectDir)) {
    log(`projectDir no existe: ${projectDir}`);
    return null;
  }
  const explicit = process.env.CLAUDE_SESSION_ID;
  if (explicit) {
    const p = path.join(projectDir, `${explicit}.jsonl`);
    if (fs.existsSync(p)) return { sessionId: explicit, jsonlPath: p };
  }
  // último .jsonl modificado
  const files = fs
    .readdirSync(projectDir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => ({ f, mtime: fs.statSync(path.join(projectDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!files.length) return null;
  const sessionId = path.basename(files[0].f, ".jsonl");
  return { sessionId, jsonlPath: path.join(projectDir, files[0].f) };
}

function findUnprocessedJsonls(limit = 5): Array<{ sessionId: string; jsonlPath: string }> {
  const projectKey = encodeProjectPath(PROJECT_DIR);
  const projectDir = path.join(PROJECTS_HOME, projectKey);
  if (!fs.existsSync(projectDir)) return [];
  const files = fs
    .readdirSync(projectDir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => ({
      f,
      mtime: fs.statSync(path.join(projectDir, f)).mtimeMs,
      size: fs.statSync(path.join(projectDir, f)).size,
    }))
    .filter((x) => x.size > 1024)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);
  return files.map((x) => ({
    sessionId: path.basename(x.f, ".jsonl"),
    jsonlPath: path.join(projectDir, x.f),
  }));
}

async function dispatch(sessionId: string, jsonlPath: string): Promise<void> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, jsonlPath }),
      signal: AbortSignal.timeout(60_000),
    });
    const text = await res.text();
    if (!res.ok) {
      log(`HTTP ${res.status} para ${sessionId}: ${text.slice(0, 300)}`);
      return;
    }
    log(`OK ${sessionId}: ${text.slice(0, 300)}`);
  } catch (err) {
    log(`fetch error ${sessionId}: ${(err as Error).message}`);
  }
}

async function main(): Promise<void> {
  log(`start mode=${FALLBACK_MODE ? "fallback" : "session-end"} project=${PROJECT_DIR}`);

  if (FALLBACK_MODE) {
    const candidates = findUnprocessedJsonls(3);
    log(`fallback candidates=${candidates.length}`);
    for (const c of candidates) {
      await dispatch(c.sessionId, c.jsonlPath);
    }
    return;
  }

  const target = findSessionJsonl();
  if (!target) {
    log("no .jsonl encontrado, skip");
    return;
  }
  await dispatch(target.sessionId, target.jsonlPath);
}

main().catch((err) => {
  log(`FATAL ${(err as Error).message}`);
  process.exit(0); // nunca rompemos el cierre del CLI
});
