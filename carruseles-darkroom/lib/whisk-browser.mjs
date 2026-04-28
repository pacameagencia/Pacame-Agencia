/**
 * whisk-browser.mjs — wrapper Playwright para Google Whisk Labs.
 *
 * Reusa la sesión Google ya autenticada en el skill `notebooklm`
 * (`~/.claude/skills/notebooklm/data/browser_state/state.json`). Cero login extra:
 * si Pablo ya autenticó NotebookLM una vez, Whisk Labs hereda la sesión.
 *
 * Si el state.json no existe o caducó, el wrapper aborta con instrucciones
 * para regenerarlo:
 *
 *   PYTHONIOENCODING=utf-8 PYTHONUTF8=1 \
 *   python C:\Users\Pacame24\.claude\skills\notebooklm\scripts\run.py \
 *     auth_manager.py setup
 *
 * Tras eso, este wrapper retoma sin tocar el state.
 *
 * Decisión de diseño: NO escribimos al state.json (read-only). Si Whisk
 * actualiza cookies durante la sesión, el cambio queda en memoria del
 * BrowserContext y se descarta al cerrar — eso evita corromper la sesión
 * compartida con NotebookLM. Pablo puede regenerar el state desde 0 cuando
 * caduque.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const NOTEBOOKLM_STATE = path.join(
  os.homedir(),
  ".claude", "skills", "notebooklm", "data", "browser_state", "state.json"
);

const WHISK_URL = "https://labs.google.com/fx/tools/whisk";

/**
 * Lazy import Playwright. Si no está instalado, mensaje claro.
 * @returns {Promise<typeof import("playwright")>}
 */
async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (e) {
    console.error([
      "",
      "FALTA PLAYWRIGHT. Instala una vez (~80MB Chromium):",
      "",
      `   cd ${path.resolve(import.meta.dirname, "..")}`,
      "   npm install playwright",
      "   npx playwright install chromium",
      "",
      "Y vuelve a lanzar.",
    ].join("\n"));
    process.exit(3);
  }
}

/**
 * Verifica que el state.json del skill notebooklm existe y no está vacío.
 * No verifica que las cookies sean válidas — eso lo descubre Whisk al cargar.
 */
export function assertNotebookLmState() {
  if (!fs.existsSync(NOTEBOOKLM_STATE)) {
    console.error([
      "",
      "FALTA SESIÓN GOOGLE — no existe state.json del skill notebooklm.",
      "",
      "Crea la sesión una vez (browser visible):",
      "",
      "   PYTHONIOENCODING=utf-8 PYTHONUTF8=1 ^",
      "     python C:\\Users\\Pacame24\\.claude\\skills\\notebooklm\\scripts\\run.py ^",
      "     auth_manager.py setup",
      "",
      "Logea con la cuenta Google que tenga acceso a Whisk Labs (la misma de NotebookLM).",
      "Después relanza este script.",
    ].join("\n"));
    process.exit(4);
  }
  try {
    const raw = JSON.parse(fs.readFileSync(NOTEBOOKLM_STATE, "utf8"));
    if (!Array.isArray(raw.cookies) || raw.cookies.length === 0) {
      throw new Error("cookies vacías en state.json");
    }
    return NOTEBOOKLM_STATE;
  } catch (e) {
    console.error(`state.json inválido: ${e.message}`);
    process.exit(4);
  }
}

/**
 * Lanza un Chromium con la sesión Google heredada del skill notebooklm
 * y abre Whisk Labs. Devuelve {browser, context, page}.
 *
 * @param {object} opts
 * @param {boolean} [opts.headless=true] — false para debug visual
 * @param {number} [opts.viewportWidth=1400]
 * @param {number} [opts.viewportHeight=900]
 */
export async function openWhisk({ headless = true, viewportWidth = 1400, viewportHeight = 900 } = {}) {
  const statePath = assertNotebookLmState();
  const { chromium } = await loadPlaywright();

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    storageState: statePath,
    viewport: { width: viewportWidth, height: viewportHeight },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "es-ES",
  });
  const page = await context.newPage();

  console.log(`  → navegando a ${WHISK_URL}...`);
  await page.goto(WHISK_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Si Whisk redirige a login, la sesión caducó.
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  const url = page.url();
  if (url.includes("accounts.google.com") || url.includes("/signin")) {
    await browser.close();
    console.error([
      "",
      "SESIÓN GOOGLE CADUCADA — Whisk redirigió a login.",
      "",
      "Renueva con:",
      "",
      "   python C:\\Users\\Pacame24\\.claude\\skills\\notebooklm\\scripts\\run.py auth_manager.py reauth",
      "",
    ].join("\n"));
    process.exit(5);
  }

  console.log(`  ✓ Whisk cargado · URL final: ${url}`);
  return { browser, context, page };
}

/**
 * Inserta un prompt en el textarea de Whisk y dispara generate.
 * Selectores resilientes con varias estrategias (Whisk Labs aún es alpha).
 *
 * @param {import("playwright").Page} page
 * @param {string} prompt
 */
export async function submitPrompt(page, prompt) {
  // Estrategia 1: textarea principal de Whisk (puede ser textarea[aria-label*=prompt])
  const textareaSelectors = [
    'textarea[aria-label*="prompt" i]',
    'textarea[aria-label*="describe" i]',
    'textarea[placeholder*="describe" i]',
    'textarea[placeholder*="imagine" i]',
    'div[contenteditable="true"][role="textbox"]',
    "textarea",
  ];

  let inputEl = null;
  for (const sel of textareaSelectors) {
    const el = await page.$(sel);
    if (el && await el.isVisible()) { inputEl = el; break; }
  }
  if (!inputEl) throw new Error("no encuentro textarea de prompt en Whisk");

  await inputEl.click();
  await inputEl.fill("");
  await inputEl.type(prompt, { delay: 5 });
  await page.waitForTimeout(500);

  // Submit: Enter o botón "Generate"
  const generateButtonSelectors = [
    'button[aria-label*="generate" i]',
    'button:has-text("Generate")',
    'button:has-text("Generar")',
    'button[type="submit"]',
  ];
  let clicked = false;
  for (const sel of generateButtonSelectors) {
    const btn = await page.$(sel);
    if (btn && await btn.isEnabled()) {
      await btn.click();
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    // Fallback: Enter
    await inputEl.press("Enter");
  }
  console.log(`  → prompt enviado (${prompt.slice(0, 60)}…)`);
}

/**
 * Espera a que aparezcan N nuevas imágenes generadas y devuelve sus URLs.
 *
 * @param {import("playwright").Page} page
 * @param {number} expectedNew — cuántas imágenes nuevas esperamos
 * @param {number} [timeoutMs=120000]
 * @returns {Promise<string[]>}
 */
export async function waitForResults(page, expectedNew = 1, timeoutMs = 120000) {
  // Whisk muestra resultados en <img src="..."> dentro del contenedor de gallery.
  // Estrategia: snapshot del set inicial → poll hasta que aparezcan +expectedNew.
  const initial = await collectImageUrls(page);
  console.log(`  · ${initial.size} imágenes preexistentes en gallery`);

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await page.waitForTimeout(2000);
    const current = await collectImageUrls(page);
    const newOnes = [...current].filter(u => !initial.has(u));
    if (newOnes.length >= expectedNew) {
      console.log(`  ✓ ${newOnes.length} nuevas imágenes detectadas`);
      return newOnes;
    }
    if ((Date.now() - start) % 20000 < 2000) {
      console.log(`  · esperando… (+${Math.floor((Date.now() - start) / 1000)}s, ${newOnes.length}/${expectedNew})`);
    }
  }
  throw new Error(`timeout esperando ${expectedNew} imágenes nuevas tras ${timeoutMs}ms`);
}

/**
 * Devuelve un Set con todas las URLs de imágenes de la galería actual.
 * Filtra placeholders / iconos.
 */
async function collectImageUrls(page) {
  const urls = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .map(i => i.src)
      .filter(s =>
        s &&
        !s.startsWith("data:") &&
        !s.includes("favicon") &&
        !s.includes("logo") &&
        (s.includes("googleusercontent") || s.includes("storage.googleapis") || s.includes(".jpg") || s.includes(".png") || s.includes(".webp"))
      );
  });
  return new Set(urls);
}

/**
 * Descarga una URL al disco como binario.
 *
 * @param {string} url
 * @param {string} dest — path absoluto destino
 */
export async function downloadImage(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${url}: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf.length;
}
