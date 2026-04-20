#!/usr/bin/env node
/**
 * Codemod: reemplaza console.* por getLogger() del logger estructurado.
 *
 * Uso:
 *   node scripts/migrate-console.mjs --dry     # solo muestra cambios
 *   node scripts/migrate-console.mjs           # aplica cambios
 *
 * Rutas objetivo: web/app/api/**\/*.ts y web/lib/**\/*.ts
 * Excluye: lib/observability/logger.ts, sentry.*.config.ts, instrumentation.ts, scripts/
 *
 * Transformaciones:
 *   console.log(   -> getLogger().info(
 *   console.warn(  -> getLogger().warn(
 *   console.error( -> getLogger().error(
 *   console.info(  -> getLogger().info(
 *   console.debug( -> getLogger().debug(
 *
 * Si el primer argumento es un string-literal y hay segundo argumento,
 * se reordena a (obj, 'string') para casar con la signature de pino.
 *
 * Anade el import si no existe.
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, sep, posix } from "node:path";

const DRY = process.argv.includes("--dry");

// Resolvemos web/ respecto a la ubicacion de este script:
//   scripts/migrate-console.mjs sale de <root>/scripts/
const ROOT = process.cwd();
const WEB_DIR = findWebDir(ROOT);

function findWebDir(startDir) {
  // intentamos ROOT/web y cwd relativo
  const candidates = [join(startDir, "web"), startDir];
  for (const c of candidates) {
    try {
      const pkg = join(c, "package.json");
      const s = statSync(pkg);
      if (s.isFile()) return c;
    } catch {
      // continua
    }
  }
  throw new Error("No se encontro web/package.json desde cwd=" + startDir);
}

const TARGET_ROOTS = [
  join(WEB_DIR, "app", "api"),
  join(WEB_DIR, "lib"),
];

const EXCLUDE_FILES = [
  join(WEB_DIR, "lib", "observability", "logger.ts"),
  join(WEB_DIR, "lib", "observability", "sentry.ts"),
  join(WEB_DIR, "lib", "observability", "request-context.ts"),
  join(WEB_DIR, "sentry.server.config.ts"),
  join(WEB_DIR, "sentry.edge.config.ts"),
  join(WEB_DIR, "sentry.client.config.ts"),
  join(WEB_DIR, "instrumentation.ts"),
];

function norm(p) {
  return p.split(sep).join(posix.sep);
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      walk(full, out);
    } else if (e.isFile() && full.endsWith(".ts") && !full.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function shouldSkip(file) {
  const nf = norm(file);
  if (EXCLUDE_FILES.some((ex) => norm(ex) === nf)) return true;
  if (nf.includes("/scripts/")) return true;
  return false;
}

const LEVEL_MAP = {
  log: "info",
  info: "info",
  warn: "warn",
  error: "error",
  debug: "debug",
};

// Encuentra el indice del parentesis de cierre que balancea al abierto en openIdx.
// Respeta strings simples/dobles/backticks y template expressions anidadas.
function findMatchingClose(source, openIdx) {
  let depth = 0;
  let i = openIdx;
  let inStr = null; // '"' | "'" | "`" | null
  let templateStack = 0;
  while (i < source.length) {
    const ch = source[i];
    const prev = i > 0 ? source[i - 1] : "";
    if (inStr) {
      if (inStr === "`" && ch === "$" && source[i + 1] === "{") {
        templateStack++;
        i += 2;
        continue;
      }
      if (inStr === "`" && ch === "}" && templateStack > 0) {
        templateStack--;
        i++;
        continue;
      }
      if (ch === inStr && prev !== "\\") {
        inStr = null;
      }
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      i++;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") {
      // line comment
      const nl = source.indexOf("\n", i);
      if (nl === -1) return -1;
      i = nl + 1;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      if (end === -1) return -1;
      i = end + 2;
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

// Encuentra el primer separador (coma) de argumentos al nivel 0 dentro de [start, end).
function splitFirstArg(source, start, end) {
  let depth = 0;
  let inStr = null;
  let templateStack = 0;
  for (let i = start; i < end; i++) {
    const ch = source[i];
    const prev = i > 0 ? source[i - 1] : "";
    if (inStr) {
      if (inStr === "`" && ch === "$" && source[i + 1] === "{") {
        templateStack++;
        i++;
        continue;
      }
      if (inStr === "`" && ch === "}" && templateStack > 0) {
        templateStack--;
        continue;
      }
      if (ch === inStr && prev !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (ch === "," && depth === 0) {
      return i;
    }
  }
  return -1;
}

function isStringLiteral(arg) {
  const t = arg.trim();
  if (t.length < 2) return false;
  const first = t[0];
  const last = t[t.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'") || (first === "`" && last === "`")) {
    return true;
  }
  return false;
}

function hasLoggerImport(src) {
  return /from\s+["']@\/lib\/observability\/logger["']/.test(src);
}

function ensureLoggerImport(src) {
  if (hasLoggerImport(src)) return { src, added: false };

  // Insertar despues del primer bloque de imports/directives o al top.
  const lines = src.split("\n");
  let insertAt = 0;
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const trimmed = l.trim();
    if (inBlockComment) {
      if (trimmed.includes("*/")) inBlockComment = false;
      insertAt = i + 1;
      continue;
    }
    if (trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/")) inBlockComment = true;
      insertAt = i + 1;
      continue;
    }
    if (
      trimmed === "" ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("'use ") ||
      trimmed.startsWith('"use ') ||
      trimmed.startsWith("import ") ||
      trimmed.startsWith("export type ") ||
      trimmed.startsWith("/// ")
    ) {
      insertAt = i + 1;
      continue;
    }
    break;
  }

  const importLine = `import { getLogger } from "@/lib/observability/logger";`;
  lines.splice(insertAt, 0, importLine);
  return { src: lines.join("\n"), added: true };
}

function transformFile(source) {
  const replacements = [];
  const re = /(^|[^A-Za-z0-9_$.])console\s*\.\s*(log|warn|error|info|debug)\s*\(/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const fullStart = m.index + m[1].length;
    const methodName = m[2];
    const parenOpen = m.index + m[0].length - 1; // indice del '('
    const parenClose = findMatchingClose(source, parenOpen);
    if (parenClose === -1) continue;

    const argsStart = parenOpen + 1;
    const argsEnd = parenClose;
    const innerRaw = source.slice(argsStart, argsEnd);
    const firstCommaIdx = splitFirstArg(source, argsStart, argsEnd);

    const pinoLevel = LEVEL_MAP[methodName];
    const calleeReplacement = `getLogger().${pinoLevel}(`;

    let newArgs;
    if (firstCommaIdx === -1) {
      // solo un argumento
      newArgs = innerRaw;
    } else {
      const firstArg = source.slice(argsStart, firstCommaIdx);
      const restArgs = source.slice(firstCommaIdx + 1, argsEnd);
      if (isStringLiteral(firstArg) && restArgs.trim().length > 0) {
        // reordenar: pino quiere (obj, msg)
        // Si hay mas de 2 args, agrupamos el resto en { rest: [...] }? No — mantenemos solo los 2.
        // Si hay varios args extra los colapsamos en un array `extra` para preservarlos.
        const secondCommaIdx = splitFirstArg(source, firstCommaIdx + 1, argsEnd);
        if (secondCommaIdx === -1) {
          newArgs = `${restArgs.trim()}, ${firstArg.trim()}`;
        } else {
          const secondArg = source.slice(firstCommaIdx + 1, secondCommaIdx).trim();
          const tail = source.slice(secondCommaIdx + 1, argsEnd).trim();
          newArgs = `{ data: ${secondArg}, extra: [${tail}] }, ${firstArg.trim()}`;
        }
      } else {
        newArgs = innerRaw;
      }
    }

    replacements.push({
      start: fullStart,
      end: parenClose + 1,
      replacement: `${calleeReplacement}${newArgs})`,
    });
  }

  if (replacements.length === 0) return { out: source, count: 0 };

  // Aplicar de atras hacia adelante
  replacements.sort((a, b) => b.start - a.start);
  let out = source;
  for (const r of replacements) {
    out = out.slice(0, r.start) + r.replacement + out.slice(r.end);
  }
  return { out, count: replacements.length };
}

function main() {
  let touched = 0;
  let total = 0;
  const files = [];
  for (const root of TARGET_ROOTS) {
    walk(root, files);
  }
  for (const f of files) {
    if (shouldSkip(f)) continue;
    const src = readFileSync(f, "utf8");
    const { out, count } = transformFile(src);
    if (count === 0) continue;
    const withImport = ensureLoggerImport(out);
    const finalSrc = withImport.src;
    touched++;
    total += count;
    const rel = relative(WEB_DIR, f);
    if (DRY) {
      console.log(`[dry] ${rel}: ${count} reemplazos (+import=${withImport.added})`);
    } else {
      writeFileSync(f, finalSrc, "utf8");
      console.log(`[apply] ${rel}: ${count} reemplazos (+import=${withImport.added})`);
    }
  }
  console.log(`\nResumen: ${touched} archivos tocados, ${total} reemplazos.`);
}

main();
