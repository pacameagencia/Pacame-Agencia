#!/usr/bin/env node
// LoRA personalized training Pablo Calleja · fal.ai flux-lora-fast-training
// Input: lora-training/pablo-dataset.zip (78 imgs · 11.7 MB)
// Output: model URL + diffusers config saved to lora-training/lora-output.json
// Cost: ~$2-3 (1000 steps default)

import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ""));
const ENV_PATH = path.resolve(ROOT, "../../web/.env.local");

const env = Object.fromEntries(
  fs.readFileSync(ENV_PATH, "utf8")
    .split("\n")
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);

const FAL_KEY = env.FAL_API_KEY;
if (!FAL_KEY) { console.error("FAL_API_KEY no encontrada"); process.exit(1); }

const ZIP = path.resolve(ROOT, "pablo-dataset.zip");
if (!fs.existsSync(ZIP)) { console.error(`zip no encontrado: ${ZIP}`); process.exit(1); }

const TRIGGER = "pablo_pacame_v1";

console.log("[1/3] subiendo zip a fal.ai storage...");
const zipBuf = fs.readFileSync(ZIP);
const initRes = await fetch("https://rest.alpha.fal.ai/storage/upload/initiate", {
  method: "POST",
  headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ file_name: "pablo-dataset.zip", content_type: "application/zip" })
});
if (!initRes.ok) { console.error("init upload fail:", initRes.status, await initRes.text()); process.exit(1); }
const { upload_url, file_url } = await initRes.json();

const putRes = await fetch(upload_url, {
  method: "PUT",
  headers: { "Content-Type": "application/zip" },
  body: zipBuf
});
if (!putRes.ok) { console.error("PUT fail:", putRes.status); process.exit(1); }
console.log(`    ok: ${file_url}`);

console.log("[2/3] lanzando training flux-lora-fast-training...");
const trainRes = await fetch("https://queue.fal.run/fal-ai/flux-lora-fast-training", {
  method: "POST",
  headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    images_data_url: file_url,
    trigger_word: TRIGGER,
    create_masks: true,
    steps: 1000,
    is_style: false
  })
});
if (!trainRes.ok) { console.error("train fail:", trainRes.status, await trainRes.text()); process.exit(1); }
const job = await trainRes.json();
console.log(`    job: ${job.request_id}`);
console.log(`    status_url: ${job.status_url}`);

console.log("[3/3] esperando ~30 min...");
const start = Date.now();
let result = null;
while (true) {
  await new Promise(r => setTimeout(r, 30000));
  const sRes = await fetch(job.status_url, { headers: { "Authorization": `Key ${FAL_KEY}` } });
  const s = await sRes.json();
  const mins = ((Date.now() - start) / 60000).toFixed(1);
  console.log(`    ${mins} min · status: ${s.status}`);
  if (s.status === "COMPLETED") {
    const rRes = await fetch(job.response_url, { headers: { "Authorization": `Key ${FAL_KEY}` } });
    result = await rRes.json();
    break;
  }
  if (s.status === "FAILED" || s.status === "CANCELED") {
    console.error("training failed:", s);
    process.exit(1);
  }
}

const out = {
  trained_at: new Date().toISOString(),
  trigger_word: TRIGGER,
  diffusers_lora_file: result.diffusers_lora_file,
  config_file: result.config_file,
  raw: result
};
fs.writeFileSync(path.resolve(ROOT, "lora-output.json"), JSON.stringify(out, null, 2));
console.log("\nLoRA entrenado.");
console.log(`  diffusers_lora_file: ${result.diffusers_lora_file?.url}`);
console.log(`  trigger: ${TRIGGER}`);
console.log(`  output saved: lora-training/lora-output.json`);
