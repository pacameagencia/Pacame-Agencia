#!/usr/bin/env node
/**
 * Sprint 6C — Yoast SEO tick verde para las 60 categorías de productos.
 *
 * Para cada term de product_cat:
 *   - Detecta tipo: marca conocida / categoría joya / sección general / genérico.
 *   - Asigna focus keyword + SEO title + meta description con plantilla específica.
 *   - Escribe meta_data Yoast del taxonomy term.
 *
 * USO:
 *   ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node tools/royo-content-drafts/seo/yoast-categories.mjs --apply
 */

const WP_BASE = "https://joyeriaroyo.com";
const USER_AGENT = "PACAME-Bot/1.0 (+https://pacameagencia.com)";

const args = process.argv.slice(2);
const dryRun = !args.includes("--apply");

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) {
  console.error("ERROR: para --apply necesito ROYO_WP_USER y ROYO_WP_APP_PASS en env.");
  process.exit(1);
}
const authHeader = wpUser && wpPass
  ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`
  : null;

// --- Plantillas marca relojes ---
const BRAND_TEMPLATES = {
  Tissot: {
    kw: "relojes Tissot",
    title: "Relojes Tissot oficial | Joyería Royo Albacete",
    desc: "Relojes Tissot oficial en Joyería Royo Albacete. Colecciones PRX, Le Locle, Seastar, Chrono XL con garantía oficial Tissot, envío 24h y financiación.",
  },
  Longines: {
    kw: "relojes Longines",
    title: "Relojes Longines oficial | Joyería Royo Albacete",
    desc: "Relojes Longines oficial en Joyería Royo Albacete. Colecciones HydroConquest, Conquest, Master, DolceVita con garantía oficial y envío 24h.",
  },
  Seiko: {
    kw: "relojes Seiko",
    title: "Relojes Seiko oficial | Joyería Royo Albacete",
    desc: "Relojes Seiko oficial en Joyería Royo Albacete. Prospex, Presage, 5 Sports y solar con garantía oficial Seiko, envío 24h y financiación sin intereses.",
  },
  Casio: {
    kw: "relojes Casio",
    title: "Relojes Casio oficial | Joyería Royo Albacete",
    desc: "Relojes Casio oficial en Joyería Royo Albacete. G-Shock, Edifice, Pro Trek, Vintage y Baby-G con garantía oficial Casio y envío 24h.",
  },
  Hamilton: {
    kw: "relojes Hamilton",
    title: "Relojes Hamilton oficial | Joyería Royo Albacete",
    desc: "Relojes Hamilton oficial en Joyería Royo Albacete. Khaki Field, Khaki Aviation, Jazzmaster y Ventura con garantía oficial Hamilton y envío 24h.",
  },
  Oris: {
    kw: "relojes Oris",
    title: "Relojes Oris oficial | Joyería Royo Albacete",
    desc: "Relojes Oris oficial en Joyería Royo Albacete. Aquis, Big Crown, Divers Sixty-Five con garantía oficial Oris, envío 24h y financiación sin intereses.",
  },
  Citizen: {
    kw: "relojes Citizen",
    title: "Relojes Citizen oficial | Joyería Royo Albacete",
    desc: "Relojes Citizen oficial en Joyería Royo Albacete. Eco-Drive, Promaster, Series 8 con garantía oficial Citizen, envío 24h y financiación sin intereses.",
  },
  Omega: {
    kw: "relojes Omega",
    title: "Relojes Omega oficial | Joyería Royo Albacete",
    desc: "Relojes Omega oficial en Joyería Royo Albacete. Speedmaster, Seamaster y Constellation con garantía oficial Omega, envío seguro y financiación.",
  },
  MontBlanc: {
    kw: "relojes Mont Blanc",
    title: "Relojes Mont Blanc oficial | Joyería Royo",
    desc: "Relojes Mont Blanc oficial en Joyería Royo Albacete. Star Legacy, 1858, Heritage y TimeWalker con garantía oficial Mont Blanc y envío 24h.",
  },
  Victorinox: {
    kw: "relojes Victorinox",
    title: "Relojes Victorinox oficial | Joyería Royo Albacete",
    desc: "Relojes Victorinox Swiss Army oficial en Joyería Royo Albacete. INOX, Maverick, Fieldforce y Airboss con garantía oficial y envío 24h.",
  },
  Certina: {
    kw: "relojes Certina",
    title: "Relojes Certina oficial | Joyería Royo Albacete",
    desc: "Relojes Certina DS oficial en Joyería Royo Albacete. DS Action, DS-1, DS PH200M con garantía oficial Certina, envío 24h y financiación.",
  },
  "Baume & Mercier": {
    kw: "relojes Baume & Mercier",
    title: "Relojes Baume & Mercier oficial | Joyería Royo",
    desc: "Relojes Baume & Mercier oficial en Joyería Royo Albacete. Clifton, Classima, Riviera con garantía oficial Baume & Mercier y envío 24h.",
  },
  "Franck Muller": {
    kw: "relojes Franck Muller",
    title: "Relojes Franck Muller | Joyería Royo Albacete",
    desc: "Relojes Franck Muller en Joyería Royo Albacete. Alta relojería suiza con garantía oficial, atención privada y financiación a medida.",
  },
};

// --- Plantillas joyería ---
const JEWELRY_TEMPLATES = {
  Anillos: {
    kw: "anillos Albacete",
    title: "Anillos en Joyería Royo Albacete",
    desc: "Anillos en Joyería Royo Albacete: solitarios, alianzas, sortijas y anillos de oro 18kt con diamantes. Diseño artesano y garantía de joyero con 50 años.",
  },
  Pendientes: {
    kw: "pendientes Albacete",
    title: "Pendientes en Joyería Royo Albacete",
    desc: "Pendientes en Joyería Royo Albacete: oro 18kt, diamantes, perlas y piedras finas. Diseño artesano, garantía de joyero y envío 24h a toda España.",
  },
  Pulseras: {
    kw: "pulseras Albacete",
    title: "Pulseras en Joyería Royo Albacete",
    desc: "Pulseras en Joyería Royo Albacete: oro 18kt, plata, diamantes y piedras finas. Diseño artesano, garantía de joyero y envío 24h a toda España.",
  },
  Colgantes: {
    kw: "colgantes Albacete",
    title: "Colgantes en Joyería Royo Albacete",
    desc: "Colgantes en Joyería Royo Albacete: oro 18kt, diamantes y piedras finas. Diseño artesano y garantía de joyero con más de 50 años de oficio.",
  },
  Gargantillas: {
    kw: "gargantillas Albacete",
    title: "Gargantillas en Joyería Royo Albacete",
    desc: "Gargantillas en Joyería Royo Albacete: oro 18kt y diamantes. Diseño artesano de joyero con 50 años de oficio. Envío 24h y financiación.",
  },
  Joyas: {
    kw: "joyería Albacete",
    title: "Joyería Albacete · Joyas oficiales | Joyería Royo",
    desc: "Joyería Albacete con más de 50 años de oficio. Anillos, pendientes, pulseras, colgantes y gargantillas en oro 18kt y diamantes. Envío 24h y garantía.",
  },
};

// --- Plantillas sección ---
const SECTION_TEMPLATES = {
  Relojes: {
    kw: "relojes oficiales Albacete",
    title: "Relojes oficiales en Albacete | Joyería Royo",
    desc: "Relojes oficiales en Albacete: Tissot, Longines, Seiko, Casio, Hamilton, Oris, Omega, MontBlanc y más. Garantía oficial, envío 24h y financiación.",
  },
  Marcas: {
    kw: "marcas relojes oficiales",
    title: "Marcas de relojes oficiales | Joyería Royo Albacete",
    desc: "Marcas de relojes oficiales en Joyería Royo Albacete: Tissot, Longines, Seiko, Casio, Hamilton, Oris, Omega, MontBlanc, Victorinox y más.",
  },
  Hombre: {
    kw: "relojes hombre Albacete",
    title: "Relojes para hombre en Joyería Royo Albacete",
    desc: "Relojes para hombre en Joyería Royo Albacete: Tissot, Longines, Casio, Seiko, Hamilton, Oris. Garantía oficial, envío 24h y financiación sin intereses.",
  },
  Mujer: {
    kw: "relojes mujer Albacete",
    title: "Relojes para mujer en Joyería Royo Albacete",
    desc: "Relojes para mujer en Joyería Royo Albacete: Tissot, Longines, Seiko, Casio Vintage. Diseños elegantes, garantía oficial y envío 24h.",
  },
  Outlet: {
    kw: "relojes outlet Albacete",
    title: "Relojes y joyas outlet | Joyería Royo Albacete",
    desc: "Relojes y joyas outlet en Joyería Royo Albacete con descuentos. Productos de marcas oficiales con garantía, envío 24h y unidades limitadas.",
  },
  Escritura: {
    kw: "plumas Mont Blanc Albacete",
    title: "Plumas y bolígrafos Mont Blanc | Joyería Royo",
    desc: "Plumas, bolígrafos y rollerball Mont Blanc en Joyería Royo Albacete. Meisterstück, StarWalker y PIX con garantía oficial Mont Blanc.",
  },
};

function pickTemplate(name) {
  if (BRAND_TEMPLATES[name]) return BRAND_TEMPLATES[name];
  if (JEWELRY_TEMPLATES[name]) return JEWELRY_TEMPLATES[name];
  if (SECTION_TEMPLATES[name]) return SECTION_TEMPLATES[name];
  return {
    kw: `${name} en Joyería Royo`,
    title: `${name} | Joyería Royo Albacete`.slice(0, 60),
    desc: `${name} en Joyería Royo Albacete con garantía oficial, envío 24h y financiación sin intereses. Atención personal de joyeros con 50 años de oficio.`.slice(0, 155),
  };
}

async function fetchCategories() {
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const url = `${WP_BASE}/wp-json/wp/v2/product_cat?per_page=100&page=${page}&_fields=id,name,slug`;
    const res = await fetch(url, {
      headers: { Authorization: authHeader || "", "User-Agent": USER_AGENT },
    });
    if (!res.ok) break;
    const data = await res.json();
    if (data.length === 0) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  return all;
}

async function updateCategoryMeta(id, meta) {
  const url = `${WP_BASE}/wp-json/wp/v2/product_cat/${id}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ meta }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`cat ${id}: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}`);
  const cats = await fetchCategories();
  console.log(`[fetch] ${cats.length} categorías product_cat encontradas.`);

  let updated = 0, errors = 0;

  for (const cat of cats) {
    if (cat.slug === "uncategorized" || cat.slug === "sin-categorizar") continue;
    const tpl = pickTemplate(cat.name);
    const meta = {
      _yoast_wpseo_focuskw: tpl.kw,
      _yoast_wpseo_title: tpl.title,
      _yoast_wpseo_metadesc: tpl.desc,
      "_yoast_wpseo_meta-robots-noindex": "0",
      "_yoast_wpseo_meta-robots-nofollow": "0",
    };

    console.log(`[${dryRun ? "DRY" : "DO "}] cat ${cat.id} "${cat.name}" kw="${tpl.kw}"`);

    if (!dryRun) {
      try {
        await updateCategoryMeta(cat.id, meta);
        updated++;
        await sleep(200);
      } catch (err) {
        console.error(`     ERROR: ${err.message}`);
        errors++;
      }
    } else {
      updated++;
    }
  }

  console.log(`\n[done] updated=${updated} errors=${errors}`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
