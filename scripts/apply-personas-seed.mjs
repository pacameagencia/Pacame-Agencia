// Apply 033_personas_seed.sql to Supabase via service role key.
// Uses @supabase/supabase-js (already in web/ deps). Run from repo root.

import { createClient } from "../web/node_modules/@supabase/supabase-js/dist/module/index.js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Load env from web/.env.local manually (node doesn't auto-load)
const envFile = resolve(root, "..", "..", "..", "web", ".env.local");
let env = {};
try {
  const envText = readFileSync(envFile, "utf8");
  for (const line of envText.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
} catch (e) {
  console.error("Could not load .env.local from", envFile, e.message);
  process.exit(1);
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const seedPath = resolve(root, "infra", "migrations", "seeds", "033_personas_seed.sql");
const sql = readFileSync(seedPath, "utf8");

console.log("Seed SQL size:", sql.length, "chars");
console.log("Applying to:", SUPABASE_URL);

// Supabase client doesn't expose raw SQL — we need the REST endpoint with service key.
// Postgres RPC or the /rest/v1 endpoint accept JSON only.
// Use fetch directly to the PostgREST + pgaudit endpoint pattern via execute
// But best: use the management API direct SQL endpoint.

const res = await fetch(
  `${SUPABASE_URL.replace(".supabase.co", ".supabase.co")}/rest/v1/rpc/execute_sql`,
  {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  }
);

if (!res.ok) {
  const body = await res.text();
  console.error("FAIL:", res.status, body.slice(0, 500));
  console.error("\nFallback: execute via individual INSERT blocks not implemented here.");
  console.error("Use Supabase MCP execute_sql with chunks from the seed file.");
  process.exit(1);
}

const json = await res.json();
console.log("OK:", json);

// Verify
const { data, error } = await supabase
  .from("portfolio_personas")
  .select("vertical_slug, persona_slug, persona_name", { count: "exact" });
if (error) {
  console.error("Verify error:", error);
  process.exit(1);
}
console.log(`Rows in portfolio_personas: ${data.length}`);
console.table(data.slice(0, 5));
