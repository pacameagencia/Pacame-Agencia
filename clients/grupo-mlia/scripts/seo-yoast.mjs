#!/usr/bin/env node
/**
 * SEO Yoast — TODO el sitio de Grupo M-LÍA.
 *
 * Asigna focus keyword + meta title + meta description optimizados a cada
 * página publicada, con foco comercial en EVENTOS / BODAS / COMUNIONES y
 * keyword local Hellín / Albacete (prioridad del cliente). NO toca el diseño
 * ni el contenido — solo meta Yoast (100 % reversible).
 *
 * Patrón: POST /wp-json/wp/v2/pages/{id}
 *   meta:{_yoast_wpseo_focuskw,_yoast_wpseo_title,_yoast_wpseo_metadesc}
 *
 * ⚠ DEPENDENCIA SERVIDOR (verificado 2026-05-18 en grupomlia): Yoast NO
 * registra sus meta keys con show_in_rest, así que el POST devuelve 200 pero
 * NO persiste. Requiere el snippet PACAME (Code Snippets / MU) que haga
 * register_post_meta(_yoast_wpseo_*, show_in_rest:true, auth_callback) — ver
 * clients/grupo-mlia/mu-plugins/pacame-mlia.php. Sin ese snippet este script
 * es no-op (no rompe nada). La verificación final detecta si persistió.
 *
 * Seguridad: ANTES de escribir, guarda el estado previo (yoast_head_json
 * title+description) en clients/grupo-mlia/history/seo-yoast-<ts>.jsonl
 * → rollback con --rollback=<archivo.jsonl>.
 *
 * USO:
 *   node clients/grupo-mlia/scripts/seo-yoast.mjs             # DRY-RUN
 *   node clients/grupo-mlia/scripts/seo-yoast.mjs --apply     # escribe
 *   node clients/grupo-mlia/scripts/seo-yoast.mjs --verify    # lee yoast_head_json actual
 *   node clients/grupo-mlia/scripts/seo-yoast.mjs --rollback=history/seo-yoast-XXX.jsonl --apply
 *
 * Lee credenciales de web/.env.local (MLIA_WP_*). Sin deps externas.
 */
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = resolve(__dirname, "..");
const REPO_ROOT = resolve(__dirname, "../../..");
const ENV_PATH = process.env.MLIA_ENV_FILE || resolve(REPO_ROOT, "web/.env.local");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const verify = args.includes("--verify");
const rollbackArg = args.find((a) => a.startsWith("--rollback="));

function loadEnv(p) {
  let raw; try { raw = readFileSync(p, "utf8"); } catch { console.error(`No ${p}`); process.exit(1); }
  for (const l of raw.split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (!m) continue;
    let v = m[2]; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv(ENV_PATH);
const BASE = (process.env.MLIA_WP_BASE_URL || "").replace(/\/+$/, "");
const AUTH = "Basic " + Buffer.from(`${process.env.MLIA_WP_USER}:${process.env.MLIA_WP_APP_PASS}`).toString("base64");
const H = { Authorization: AUTH, "Content-Type": "application/json", "User-Agent": "PACAME-Bot/1.0" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Plan SEO por página (foco eventos/bodas/comuniones + local Hellín/Albacete) ───
const PAGES_SEO = {
  5002:  { kw: "eventos en Hellín",            t: "Grupo M-LÍA Hellín | Bodas, Eventos y Restaurante",       d: "Grupo M-LÍA en Hellín: bodas, comuniones, eventos de empresa, catering, restaurante y ocio. El espacio para tus celebraciones en Albacete." },
  25439: { kw: "eventos en Hellín",            t: "Eventos en Hellín | Bodas y Celebraciones · M-LÍA",        d: "Bodas, comuniones, cumpleaños y eventos de empresa en Hellín (Albacete). Espacios propios y catering: nos ocupamos de todo. Pide presupuesto." },
  27120: { kw: "catering en Hellín",           t: "Catering en Hellín y Albacete | M-LÍA Catering",          d: "Catering en Hellín y toda la provincia de Albacete. Especialistas en bodas, comuniones y eventos de empresa. Pide presupuesto sin compromiso." },
  25411: { kw: "restaurante en Hellín",        t: "Restaurante en Hellín | M-LÍA Cocina Mediterránea",        d: "Restaurante M-LÍA en Hellín: cocina mediterránea, menú del día y carta. Producto de la tierra y el mar en Avenida Castilla-La Mancha. Reserva." },
  25831: { kw: "restaurante Hellín",           t: "Más que un restaurante en Hellín | M-LÍA",                 d: "M-LÍA, mucho más que un restaurante en Hellín: cocina mediterránea, ambiente cuidado y la jirafa que te da la bienvenida. Te esperamos." },
  25748: { kw: "carta restaurante Hellín",     t: "Carta del Restaurante M-LÍA Hellín | Menús y Vinos",       d: "La carta de M-LÍA en Hellín: entrantes, arroces, carnes, pescados, carta de la terraza y carta de vinos. Cocina mediterránea de producto." },
  25886: { kw: "carta del restaurante Hellín", t: "Carta del Restaurante | M-LÍA Hellín",                     d: "Carta del restaurante M-LÍA en Hellín: entrantes para compartir, ensaladas, arroces, carnes, pescados y postres. Cocina mediterránea de producto." },
  25951: { kw: "carta terraza Hellín",         t: "Carta de la Terraza | M-LÍA Hellín",                       d: "Carta de la terraza M-LÍA en Hellín: entrantes calientes y fríos, tostas, tapas y carnes para disfrutar al aire libre. Cocina mediterránea." },
  25953: { kw: "carta de vinos Hellín",        t: "Carta de Vinos | Restaurante M-LÍA Hellín",                d: "Carta de vinos de M-LÍA en Hellín: D.O. Ribera del Duero, Rioja, Jumilla, albariños, verdejos y cavas. Maridaje para tu comida mediterránea." },
  26121: { kw: "menú del día Hellín",          t: "Menú del Día en Hellín 15,50€ | Restaurante M-LÍA",        d: "Menú del día en M-LÍA Hellín por 15,50€: 2 entrantes, primero, segundo, postre, pan y bebida. De lunes a viernes. Reserva tu mesa." },
  26140: { kw: "menús especiales Hellín",      t: "Menús Especiales y Eventos | M-LÍA Hellín",                d: "Menús especiales en M-LÍA Hellín: cenas temáticas, Navidad y Reyes con menú cerrado y precio fijo. Reserva con antelación." },
  25866: { kw: "reservas restaurante Hellín",  t: "Reservas Restaurante M-LÍA Hellín | Reserva tu mesa",      d: "Reserva tu mesa en el restaurante M-LÍA de Hellín. Cocina mediterránea con producto de la tierra y el mar. Llámanos o escríbenos por WhatsApp." },
  19363: { kw: "discoteca en Hellín",          t: "MANÍA | Discoteca y Pub en Hellín",                        d: "MANÍA, la discoteca de Grupo M-LÍA en Hellín: ambiente elegante, los mejores DJs y eventos. Celebra cumpleaños, despedidas y fiestas privadas." },
  25522: { kw: "terraza en Hellín",            t: "Terraza M-LÍA Hellín | Copas y los mejores DJs",           d: "Terraza M-LÍA en Hellín: el espacio al aire libre para copas, música y los mejores DJs. Ambiente elegante para tus noches de verano." },
  25363: { kw: "piscina en Hellín",            t: "Piscina M-LÍA Hellín | Días de piscina y ocio",            d: "Piscina M-LÍA en Hellín: refréscate y disfruta de un día de piscina y ocio en un entorno cuidado. El plan perfecto para el verano." },
  25433: { kw: "crepería en Hellín",           t: "Chocolate y Menta Hellín | Crepes y batidos",              d: "Chocolate y Menta, la crepería de Grupo M-LÍA en Hellín: crepes, gofres y batidos para los más dulces. Un capricho para toda la familia." },
  26556: { kw: "entradas eventos Hellín",      t: "Venta de Entradas Eventos | Grupo M-LÍA Hellín",           d: "Entradas para los eventos de Grupo M-LÍA en Hellín: fiestas, conciertos y celebraciones. Aforo limitado, cómpralas antes de que se agoten." },
  1453:  { kw: "contacto Grupo M-LÍA",         t: "Contacto Grupo M-LÍA Hellín | Eventos y reservas",         d: "Contacta con Grupo M-LÍA en Hellín: bodas, comuniones, eventos, catering y reservas. Te respondemos por teléfono o WhatsApp." },
  3786:  { kw: "Grupo M-LÍA Hellín",           t: "Grupo M-LÍA | Hostelería y eventos en Hellín",             d: "Grupo M-LÍA: equipo de ocio y restauración en Hellín. Organizamos cualquier evento con locales propios. Bodas, comuniones y empresa. Conócenos." },
  26637: { kw: "trabajar en Grupo M-LÍA",      t: "Trabaja con nosotros | Grupo M-LÍA Hellín",                d: "¿Quieres trabajar en Grupo M-LÍA (Hellín)? Envíanos tu CV por el formulario y nos pondremos en contacto contigo lo antes posible." },
};

async function getHead(id) {
  const r = await fetch(`${BASE}/wp-json/wp/v2/pages/${id}?_fields=id,slug,link,title,yoast_head_json`, { headers: H });
  if (!r.ok) return null;
  const p = await r.json();
  return { id: p.id, slug: p.slug, link: p.link, title: (p.title?.rendered || "").trim(), seo_title: p.yoast_head_json?.title || null, seo_desc: p.yoast_head_json?.description || null };
}

async function main() {
  const ids = Object.keys(PAGES_SEO);
  console.log(`\n🔎 SEO Yoast Grupo M-LÍA — ${BASE}`);
  console.log(`   modo: ${rollbackArg ? "ROLLBACK" : verify ? "VERIFY" : apply ? "APPLY" : "DRY-RUN"} · ${ids.length} páginas\n`);

  if (verify) {
    for (const id of ids) { const h = await getHead(id); if (h) console.log(`#${id} /${h.slug}\n  title: ${h.seo_title}\n  desc : ${h.seo_desc}\n`); await sleep(150); }
    return;
  }

  if (rollbackArg) {
    const file = rollbackArg.split("=")[1];
    const lines = readFileSync(resolve(REPO_ROOT, file).replace(/^.*PACAME AGENCIA[\\/]/, REPO_ROOT + "/"), "utf8").trim().split(/\n/);
    console.log(`Rollback de ${lines.length} entradas desde ${file}`);
    for (const ln of lines) {
      const e = JSON.parse(ln);
      if (!apply) { console.log(`  [DRY] restauraría #${e.id} title="${e.before.seo_title}"`); continue; }
      await fetch(`${BASE}/wp-json/wp/v2/pages/${e.id}`, { method: "POST", headers: H, body: JSON.stringify({ meta: { _yoast_wpseo_title: e.before.seo_title || "", _yoast_wpseo_metadesc: e.before.seo_desc || "" } }) });
      console.log(`  restaurado #${e.id}`); await sleep(400);
    }
    return;
  }

  const histDir = resolve(CLIENT_DIR, "history");
  mkdirSync(histDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile = resolve(histDir, `seo-yoast-${ts}.jsonl`);
  let updated = 0, errors = 0;

  for (const [id, seo] of Object.entries(PAGES_SEO)) {
    const tlen = seo.t.length, dlen = seo.d.length;
    const warn = (tlen > 60 ? " ⚠TITLE>60" : "") + (dlen > 156 ? " ⚠DESC>156" : "");
    const before = await getHead(id);
    if (!before) { console.error(`  ✗ #${id} no encontrado / no accesible`); errors++; continue; }
    console.log(`  [${apply ? "DO " : "DRY"}] #${id} /${before.slug}  kw="${seo.kw}" t=${tlen}c d=${dlen}c${warn}`);
    if (!apply) continue;

    appendFileSync(logFile, JSON.stringify({ id: Number(id), slug: before.slug, before: { seo_title: before.seo_title, seo_desc: before.seo_desc }, after: { seo_title: seo.t, seo_desc: seo.d }, ts }) + "\n");
    const res = await fetch(`${BASE}/wp-json/wp/v2/pages/${id}`, {
      method: "POST", headers: H,
      body: JSON.stringify({ meta: { _yoast_wpseo_focuskw: seo.kw, _yoast_wpseo_title: seo.t, _yoast_wpseo_metadesc: seo.d } }),
    });
    if (!res.ok) { console.error(`    ✗ ${res.status} ${(await res.text()).slice(0, 160)}`); errors++; }
    else updated++;
    await sleep(450);
  }

  console.log(`\n[done] POST ok=${updated} errors=${errors}` + (apply ? `\nrollback log: ${logFile}` : ""));
  if (apply && updated) {
    console.log(`\nVerificando persistencia real (yoast_head_json)…`);
    let persisted = 0;
    for (const [id, seo] of Object.entries(PAGES_SEO)) {
      const h = await getHead(id);
      const ok = h && h.seo_title === seo.t;
      if (ok) persisted++; else console.log(`  ✗ #${id} NO persistió (sigue: ${h?.seo_title})`);
      await sleep(150);
    }
    console.log(`\n► PERSISTIERON ${persisted}/${ids.length}.` +
      (persisted === 0 ? " Yoast bloquea REST meta → falta el snippet PACAME (pacame-mlia.php)." :
       persisted < ids.length ? " Revisar las que fallaron + purgar caché LiteSpeed." :
       " ✔ Todas. Purga caché LiteSpeed para reflejarlo en SERP."));
    process.exit(persisted === ids.length ? 0 : 3);
  }
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
