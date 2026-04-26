#!/usr/bin/env node
// Audit query: lista action_log + reminders del user de pruebas.
import { readFileSync } from "node:fs";
const env = readFileSync(".env.local","utf8");
for (const l of env.split("\n")) { const t=l.trim(); if (!t||t.startsWith("#")) continue; const [k,...r]=t.split("="); if (!process.env[k]) process.env[k]=r.join("=").replace(/^"|"$/g,""); }
const { Client } = await import("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
const email = process.argv[2] || "lucia-test-1777229797@pacametest.local";
console.log(`Audit user: ${email}`);
const { rows: log } = await c.query(`
  SELECT action, ok, details, created_at
    FROM pacame_gpt_action_log
   WHERE user_id = (SELECT id FROM pacame_product_users WHERE email=$1)
   ORDER BY created_at DESC LIMIT 8
`, [email]);
console.log("--- action_log ---");
for (const r of log) console.log(" ", r.created_at.toISOString().slice(0,19), r.action, r.ok ? "OK" : "FAIL", JSON.stringify(r.details).slice(0,120));
const { rows: rems } = await c.query(`
  SELECT id, status, due_at, sent_at, subject, send_error FROM pacame_gpt_reminders
   WHERE user_id = (SELECT id FROM pacame_product_users WHERE email=$1)
   ORDER BY created_at DESC LIMIT 4
`, [email]);
console.log("--- reminders ---");
for (const r of rems) console.log(" ", r.status, "due:", r.due_at.toISOString(), r.subject?.slice(0,70));
await c.end();
