#!/usr/bin/env node
/**
 * Download fonts needed for Dark Room slides.
 * Saves to ./fonts/ as .ttf for Sharp/librsvg embedding.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "fonts");
fs.mkdirSync(FONTS_DIR, { recursive: true });

const FONTS = [
  {
    name: "Anton-Regular.ttf",
    url: "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf",
  },
  {
    name: "SpaceGrotesk-Bold.ttf",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-700-normal.ttf",
  },
  {
    name: "SpaceGrotesk-Medium.ttf",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-500-normal.ttf",
  },
  {
    name: "JetBrainsMono-Regular.ttf",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.ttf",
  },
  {
    name: "JetBrainsMono-Bold.ttf",
    url: "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-700-normal.ttf",
  },
];

for (const f of FONTS) {
  const out = path.join(FONTS_DIR, f.name);
  if (fs.existsSync(out) && fs.statSync(out).size > 10000) {
    console.log(`✓ ${f.name} already present`);
    continue;
  }
  process.stdout.write(`→ ${f.name} ... `);
  const res = await fetch(f.url, { redirect: "follow" });
  if (!res.ok) {
    console.log(`FAIL ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(out, buf);
  console.log(`ok (${(buf.length / 1024).toFixed(0)} KB)`);
}
