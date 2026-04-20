#!/usr/bin/env node
import { writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "web", "public", "redesign", "seal-pacame.png");
const KEY = process.env.OPENAI_API_KEY?.trim();
if (!KEY) { console.error("OPENAI_API_KEY missing"); process.exit(1); }

const prompt = `Single centered traditional Spanish ceramic maker's stamp on warm sand-colored #E8DDC7 paper background. A circular medallion seal with a modernist 8-pointed sun motif inside. Hand-stamped terracotta #B54E30 ink with slight imperfections. The sun has 12 thin rays radiating outward from a solid center circle. One clean outer concentric ring. ABSOLUTELY NO text, NO letters, NO numbers, NO additional color blocks or rectangles around the stamp. Completely centered composition. Just the circular seal alone on the paper, nothing else. Square format, clean background, artisanal hand-craft aesthetic, printed paper texture.`;

console.log("Regenerating seal-pacame.png...");
const res = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024", quality: "hd", style: "natural", response_format: "b64_json" }),
});
if (!res.ok) { console.error(await res.text()); process.exit(1); }
const { data } = await res.json();
await writeFile(OUT, Buffer.from(data[0].b64_json, "base64"));
console.log(`saved ${OUT}`);
