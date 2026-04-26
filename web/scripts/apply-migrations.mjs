#!/usr/bin/env node
/**
 * Aplica migrations SQL a Supabase via Postgres connection string.
 * Uso: node scripts/apply-migrations.mjs <migration1.sql> [migration2.sql ...]
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!URL) {
  console.error("Falta SUPABASE_DB_URL (postgres://…). Ponlo en .env.local.");
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Uso: node scripts/apply-migrations.mjs path/to/migration.sql ...");
  process.exit(1);
}

const client = new pg.Client({ connectionString: URL });
await client.connect();

for (const file of files) {
  const path = resolve(file);
  const sql = readFileSync(path, "utf8");
  console.log(`\n→ Aplicando ${path}`);
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log(`  ✓ OK`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`  ✗ ERROR: ${err.message}`);
    process.exit(1);
  }
}

await client.end();
console.log("\nListo.");
