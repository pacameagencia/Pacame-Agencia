#!/usr/bin/env node
/**
 * Genera web/.env.local.example desde web/lib/env/registry.ts
 *
 * Run: node scripts/generate-env-example.mjs
 *
 * IMPORTANTE: No pone valores reales, solo el nombre + placeholder.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = resolve(__dirname, "..", "web", "lib", "env", "registry.ts");
const outputPath = resolve(__dirname, "..", "web", ".env.local.example");

// Parse registry.ts manually (avoid TS runtime)
const src = readFileSync(registryPath, "utf8");

const CATEGORY_LABELS = {
  llm: "LLM / AI Models — Quality-first routing + budget guard",
  database: "Database — Supabase + direct Postgres",
  payments: "Payments — Stripe",
  auth: "Auth & Admin",
  messaging: "Messaging — Email, SMS, Voice, Telegram",
  social: "Social Media — Instagram, Meta, LinkedIn, Buffer",
  content: "Content & Design — Image gen",
  infrastructure: "Infrastructure — Scraping, rate limit, observability",
  analytics: "Analytics",
  cron: "Cron & Scheduled",
};

// Extract each entry via regex (shallow parse, sufficient for registry format)
const regex = /^\s*([A-Z][A-Z0-9_]+):\s*\{\s*([\s\S]*?)\n\s*\},\s*$/gm;

const entries = [];
let match;
while ((match = regex.exec(src)) !== null) {
  const name = match[1];
  const body = match[2];

  const get = (key) => {
    const m = body.match(new RegExp(`${key}:\\s*(?:"([^"]*)"|\\[([^\\]]*)\\]|(\\w+))`));
    if (!m) return null;
    return m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3];
  };

  const category = get("category");
  const description = get("description");
  const requiredMatch = body.match(/required_in:\s*\[([^\]]*)\]/);
  const required = requiredMatch
    ? requiredMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/["']/g, ""))
        .filter(Boolean)
    : [];
  const provider = get("provider");
  const generate_url = get("generate_url");
  const publicFlag = get("public");
  const example = get("example");

  entries.push({
    name,
    category,
    description,
    required,
    provider,
    generate_url,
    public: publicFlag === "true",
    example,
  });
}

// Group by category
const byCategory = {};
for (const e of entries) {
  if (!byCategory[e.category]) byCategory[e.category] = [];
  byCategory[e.category].push(e);
}

const order = [
  "llm",
  "database",
  "payments",
  "auth",
  "messaging",
  "social",
  "content",
  "infrastructure",
  "analytics",
  "cron",
];

const lines = [];
lines.push("# ═══════════════════════════════════════════════════════════════════");
lines.push("# PACAME — Environment Variables");
lines.push("# ═══════════════════════════════════════════════════════════════════");
lines.push("# ");
lines.push("# GENERADO AUTOMATICAMENTE desde web/lib/env/registry.ts");
lines.push("# NO editar a mano — cambios se pierden al regenerar.");
lines.push("# Run: node scripts/generate-env-example.mjs");
lines.push("# ");
lines.push("# Para ver status en vivo: https://pacameagencia.com/dashboard/env");
lines.push("# ═══════════════════════════════════════════════════════════════════");
lines.push("");

for (const cat of order) {
  const vars = byCategory[cat];
  if (!vars || vars.length === 0) continue;

  lines.push("# ─── " + (CATEGORY_LABELS[cat] || cat) + " ".repeat(Math.max(1, 60 - cat.length)));
  lines.push("");

  for (const v of vars) {
    const requiredLabel =
      v.required.length > 0 ? `REQUIRED (${v.required.join(",")})` : "optional";
    lines.push(`# ${v.description}`);
    lines.push(`# Provider: ${v.provider}${v.public ? " · public (NEXT_PUBLIC_)" : ""}`);
    if (v.generate_url) lines.push(`# Generate: ${v.generate_url}`);
    lines.push(`# Status: ${requiredLabel}`);
    if (v.example) {
      lines.push(`${v.name}=${v.example}`);
    } else {
      lines.push(`${v.name}=`);
    }
    lines.push("");
  }
}

lines.push("# ═══════════════════════════════════════════════════════════════════");
lines.push("# End of generated env example.");
lines.push(`# Total vars: ${entries.length}`);
lines.push(`# Generated: ${new Date().toISOString()}`);
lines.push("# ═══════════════════════════════════════════════════════════════════");

writeFileSync(outputPath, lines.join("\n"), "utf8");

// eslint-disable-next-line no-console
console.log(`✓ Generated ${outputPath} (${entries.length} vars)`);
