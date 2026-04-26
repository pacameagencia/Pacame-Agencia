#!/usr/bin/env node
// Aplica una migración SQL puntual contra Supabase via DATABASE_URL.
// Uso: node scripts/run-migration.mjs ../infra/migrations/020_xxx.sql
import { readFileSync } from "node:fs";
import path from "node:path";
const env = readFileSync(".env.local","utf8");
for (const l of env.split("\n")) {
  const t = l.trim();
  if (!t || t.startsWith("#")) continue;
  const [k, ...r] = t.split("=");
  if (!process.env[k]) process.env[k] = r.join("=").replace(/^"|"$/g,"");
}
const file = process.argv[2];
if (!file) { console.error("Uso: node scripts/run-migration.mjs <ruta>"); process.exit(1); }
const sql = readFileSync(path.resolve(file),"utf8");
const { Client } = await import("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
await c.query(sql);
await c.end();
console.log("OK applied:", file);
