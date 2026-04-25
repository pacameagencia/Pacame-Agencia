#!/usr/bin/env node
/**
 * brain-loop.mjs — loop infinito local de aprendizaje continuo PACAME.
 *
 * Para correr en background con bypass permissions activado:
 *   1. Asegúrate de tener `npm run dev` corriendo en otro terminal.
 *   2. Lanza este script: `node web/scripts/brain-loop.mjs`
 *   3. Cada N minutos (default 30) dispara /api/neural/learn y luego brain-pull al vault.
 *   4. Para detener: Ctrl+C.
 *
 * Flags:
 *   --interval=20     minutos entre piezas (default 30, mínimo 5)
 *   --max=0           máximo de piezas a generar (0 = infinito, default 0)
 *   --commit          tras cada pull, hace git commit del vault
 *   --base=URL        url base (default http://localhost:3000)
 */

import { execSync, spawn } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const PULL_SCRIPT = join(__dirname, "brain-pull.mjs");

function parseArg(name, def) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : def;
}

const intervalMin = Math.max(5, Number(parseArg("interval", 30)));
const maxRuns = Number(parseArg("max", 0));
const baseUrl = parseArg("base", "http://localhost:3000");
const doCommit = process.argv.includes("--commit");

console.log(`[brain-loop] Aprendizaje continuo PACAME`);
console.log(`[brain-loop] Intervalo: ${intervalMin} min · Max: ${maxRuns || "∞"} · Commit: ${doCommit}`);
console.log(`[brain-loop] Base: ${baseUrl}`);
console.log(`[brain-loop] Ctrl+C para detener.\n`);

let runs = 0;

async function pingDev() {
  try {
    const r = await fetch(`${baseUrl}/api/neural/topology`, { signal: AbortSignal.timeout(5000) });
    return r.ok || r.status === 401; // 401 = endpoint vivo, sin auth
  } catch {
    return false;
  }
}

async function tick() {
  runs++;
  const start = Date.now();
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  console.log(`\n[brain-loop ${stamp}] Pieza #${runs} — investigando...`);

  // 1) /api/neural/learn
  let payload;
  try {
    const r = await fetch(`${baseUrl}/api/neural/learn`, {
      signal: AbortSignal.timeout(120_000),
    });
    payload = await r.json();
    if (!payload.ok) {
      console.error(`[brain-loop] FALLO learn:`, payload.error || JSON.stringify(payload).slice(0, 200));
      return;
    }
    console.log(`[brain-loop] ✓ ${payload.agent.toUpperCase()} · "${payload.payload.title}"`);
    console.log(`[brain-loop]   memory_id: ${payload.persisted.memory_id}`);
    console.log(`[brain-loop]   sinapsis: ${payload.persisted.synapses_fired} · LLM: ${payload.llm.provider} ${payload.llm.model}`);
  } catch (err) {
    console.error(`[brain-loop] EXCEPTION learn:`, err.message);
    return;
  }

  // 2) brain-pull (1h ventana)
  try {
    const args = ["--hours", "1"];
    if (doCommit) args.push("--commit");
    execSync(`node "${PULL_SCRIPT}" ${args.join(" ")}`, { stdio: "inherit", cwd: REPO_ROOT });
  } catch (err) {
    console.error(`[brain-loop] WARN pull fallo:`, err.message);
  }

  console.log(`[brain-loop] Pieza #${runs} ok en ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

async function main() {
  const alive = await pingDev();
  if (!alive) {
    console.error(`[brain-loop] FATAL: ${baseUrl} no responde. Levanta dev: cd web && npm run dev`);
    process.exit(1);
  }

  while (true) {
    await tick();
    if (maxRuns > 0 && runs >= maxRuns) {
      console.log(`[brain-loop] Límite alcanzado (${maxRuns}). Salgo.`);
      break;
    }
    console.log(`[brain-loop] Espero ${intervalMin} min hasta la próxima pieza...`);
    await new Promise((r) => setTimeout(r, intervalMin * 60_000));
  }
}

process.on("SIGINT", () => {
  console.log(`\n[brain-loop] Stop solicitado. Total piezas: ${runs}.`);
  process.exit(0);
});

main().catch((err) => {
  console.error(`[brain-loop] FATAL:`, err);
  process.exit(1);
});
