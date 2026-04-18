#!/usr/bin/env node
/**
 * audit-revalidate.mjs
 *
 * Recorre web/app/**\/page.tsx y verifica que cada page declare una
 * estrategia de caching:
 *   - `export const revalidate = N`
 *   - `export const dynamic = "force-dynamic" | "force-static"`
 *
 * Clasifica la ruta y sugiere un valor recomendado:
 *   /dashboard/*      -> dynamic (admin, datos en vivo)
 *   /portal/*         -> dynamic (auth cliente, datos en vivo)
 *   /servicios/*      -> revalidate = 300
 *   /planes/*         -> revalidate = 300
 *   /blog/*           -> revalidate = 3600
 *   /status/*         -> revalidate = 60
 *   resto landing     -> revalidate = 3600
 *
 * Exit code:
 *   0 si todas las pages tienen declaracion OK
 *   1 si hay pages sin declaracion (para CI futuro)
 */

import { readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const APP_DIR = join(ROOT, "web", "app");

/** @param {string} dir */
async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name === "page.tsx") {
      out.push(full);
    }
  }
  return out;
}

/** @param {string} absPath */
function routeFromPath(absPath) {
  const rel = relative(APP_DIR, absPath).split(sep).slice(0, -1).join("/");
  // Limpia segmentos de grupos y parametros dinamicos para clasificacion.
  return "/" + rel;
}

/** @param {string} route */
function classify(route) {
  if (route.startsWith("/dashboard")) {
    return { expected: 'dynamic = "force-dynamic"', kind: "dynamic" };
  }
  if (route.startsWith("/portal")) {
    return { expected: 'dynamic = "force-dynamic"', kind: "dynamic" };
  }
  if (route.startsWith("/servicios")) {
    return { expected: "revalidate = 300", kind: "revalidate" };
  }
  if (route.startsWith("/planes")) {
    return { expected: "revalidate = 300", kind: "revalidate" };
  }
  if (route.startsWith("/status")) {
    return { expected: "revalidate = 60", kind: "revalidate" };
  }
  if (route.startsWith("/blog")) {
    return { expected: "revalidate = 3600", kind: "revalidate" };
  }
  if (route.startsWith("/docs")) {
    return { expected: "revalidate = 3600", kind: "revalidate" };
  }
  return { expected: "revalidate = 3600", kind: "revalidate" };
}

/** @param {string} content */
function detectDeclaration(content) {
  const hasRevalidate = /export\s+const\s+revalidate\s*=/.test(content);
  const hasDynamic = /export\s+const\s+dynamic\s*=/.test(content);
  if (hasRevalidate) {
    const match = content.match(/export\s+const\s+revalidate\s*=\s*([^\s;]+)/);
    return { kind: "revalidate", value: match ? match[1] : "?" };
  }
  if (hasDynamic) {
    const match = content.match(/export\s+const\s+dynamic\s*=\s*([^\s;]+)/);
    return { kind: "dynamic", value: match ? match[1] : "?" };
  }
  return null;
}

async function main() {
  const pages = await walk(APP_DIR);
  pages.sort();

  /** @type {Array<{route:string, status:string, current:string, expected:string}>} */
  const rows = [];
  let missing = 0;

  for (const abs of pages) {
    const content = await readFile(abs, "utf8");
    const route = routeFromPath(abs);
    const cls = classify(route);
    const decl = detectDeclaration(content);

    if (!decl) {
      missing++;
      rows.push({
        route,
        status: "MISSING",
        current: "-",
        expected: cls.expected,
      });
    } else {
      const current = `${decl.kind} = ${decl.value}`;
      rows.push({
        route,
        status: "OK",
        current,
        expected: cls.expected,
      });
    }
  }

  const longest = rows.reduce((m, r) => Math.max(m, r.route.length), 0);
  const header = `${"ROUTE".padEnd(longest)}  ${"STATUS".padEnd(8)}  ${"CURRENT".padEnd(30)}  EXPECTED`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of rows) {
    console.log(
      `${r.route.padEnd(longest)}  ${r.status.padEnd(8)}  ${r.current.padEnd(30)}  ${r.expected}`
    );
  }

  console.log("");
  console.log(`Total pages: ${pages.length}`);
  console.log(`Missing declaration: ${missing}`);
  console.log(`OK: ${pages.length - missing}`);

  process.exit(missing > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
