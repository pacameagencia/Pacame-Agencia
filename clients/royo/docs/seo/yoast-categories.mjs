#!/usr/bin/env node
/**
 * Sprint 6C — Yoast SEO para las 55 categorías producto de Royo.
 *
 * Por cada categoría:
 *   - focus keyword: "{nombre} Albacete" o "Reloj {marca}" según tipo
 *   - title Yoast: optimizado con keyphrase al inicio
 *   - meta description: 130-155 chars con keyphrase + Joyería Royo
 *   - Mantiene: name, parent, slug, image
 *
 * USO:
 *   ROYO_WP_USER=... ROYO_WP_APP_PASS=... node tools/royo-content-drafts/seo/yoast-categories.mjs --apply
 */

const WP_BASE = "https://joyeriaroyo.com";
const USER_AGENT = "PACAME-Bot/1.0";
const dryRun = !process.argv.includes("--apply");
const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) { console.error("ERROR: env"); process.exit(1); }
const auth = wpUser ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}` : null;

// Marcas top con plantilla específica
const BRAND_TEMPLATES = {
  Tissot: {
    title: "Relojes Tissot oficial · Joyería Royo Albacete",
    metaDesc: "Relojes Tissot oficiales en Joyería Royo Albacete. PRX, Seastar, Le Locle, Gentleman, T-Touch. Distribuidor oficial con garantía y envío.",
  },
  Longines: {
    title: "Relojes Longines oficial · Joyería Royo Albacete",
    metaDesc: "Relojes Longines oficiales: Conquest, HydroConquest, Master, La Grande Classique. Distribuidor oficial Longines en Albacete · Joyería Royo.",
  },
  Seiko: {
    title: "Relojes Seiko oficial · Joyería Royo Albacete",
    metaDesc: "Relojes Seiko oficiales: Prospex, Presage, 5 Sport, Premier. Distribuidor oficial Seiko en Albacete con garantía. Joyería Royo.",
  },
  Casio: {
    title: "Relojes Casio oficial · G-Shock, Edifice · Joyería Royo",
    metaDesc: "Relojes Casio oficiales: G-Shock MR-G, Edifice, Pro Trek y Vintage. Distribuidor oficial Casio en Albacete. Joyería Royo, 50+ años.",
  },
  Hamilton: {
    title: "Relojes Hamilton oficial · Joyería Royo Albacete",
    metaDesc: "Relojes Hamilton oficiales: Khaki Field, Khaki Aviation, Jazzmaster, Ventura. Movimientos suizos H-10 y H-30. Joyería Royo Albacete.",
  },
  Oris: {
    title: "Relojes Oris oficial · Joyería Royo Albacete",
    metaDesc: "Relojes Oris oficiales: Aquis, Big Crown Pointer Date, Divers Sixty-Five. Manufactura suiza independiente. Joyería Royo Albacete.",
  },
  Citizen: {
    title: "Relojes Citizen Eco-Drive oficial · Joyería Royo",
    metaDesc: "Relojes Citizen oficiales con tecnología Eco-Drive: Promaster, Tsuyosa, Series 8. Distribuidor oficial Citizen en Albacete · Joyería Royo.",
  },
  Omega: {
    title: "Relojes Omega oficial · Joyería Royo Albacete",
    metaDesc: "Relojes Omega oficiales: Seamaster, Constellation, De Ville. Selección curada en Joyería Royo Albacete. Garantía oficial Omega.",
  },
  MontBlanc: {
    title: "Relojes Montblanc oficial · Joyería Royo Albacete",
    metaDesc: "Relojes Montblanc oficiales: Star Legacy, 1858, Heritage. Maison alemana con manufactura suiza. Joyería Royo Albacete.",
  },
  Victorinox: {
    title: "Relojes Victorinox oficial · Joyería Royo Albacete",
    metaDesc: "Relojes Victorinox oficiales: Maverick, INOX, Fieldforce, Original. Robustez del ejército suizo. Joyería Royo Albacete.",
  },
  Certina: {
    title: "Relojes Certina oficial · Joyería Royo Albacete",
    metaDesc: "Relojes Certina oficiales: DS Action Diver, DS-1, DS-8 Lady. Manufactura suiza Powermatic 80. Joyería Royo Albacete.",
  },
  "Baume & Mercier": {
    title: "Baume & Mercier oficial · Joyería Royo Albacete",
    metaDesc: "Relojes Baume & Mercier oficiales: Clifton, Classima, Riviera. Relojería suiza desde 1830. Joyería Royo Albacete.",
  },
  "Franck Muller": {
    title: "Franck Muller oficial · Joyería Royo Albacete",
    metaDesc: "Relojes Franck Muller oficiales: Master Square, caja Cintrée Curvex. Alta relojería ginebrina. Joyería Royo Albacete.",
  },
  "Tsar Bomba": {
    title: "Relojes Tsar Bomba · Joyería Royo Albacete",
    metaDesc: "Relojes Tsar Bomba en Joyería Royo Albacete. Diseño contemporáneo y tecnología avanzada. Distribuidor oficial.",
  },
  "Genius Watches": {
    title: "Genius Watches · Joyería Royo Albacete",
    metaDesc: "Relojes Genius Watches en Joyería Royo Albacete. Estilo y diseño original. Garantía oficial y envío seguro.",
  },
  "Roberto Demeglio": {
    title: "Roberto Demeglio · Joyería Royo Albacete",
    metaDesc: "Joyería Roberto Demeglio en Joyería Royo Albacete. Diseño italiano contemporáneo. Anillos, pulseras y colgantes únicos.",
  },
};

const JEWELRY_CAT_TEMPLATES = {
  Joyas: {
    title: "Joyas oro 18kt · Joyería Royo Albacete",
    metaDesc: "Joyas de oro 18kt en Joyería Royo Albacete. Anillos, pendientes, colgantes, pulseras y gargantillas con más de 50 años de tradición joyera.",
  },
  Anillos: {
    title: "Anillos oro 18kt · Joyería Royo Albacete",
    metaDesc: "Anillos de oro 18kt: solitarios de diamante, alianzas, sortijas y diseño a medida. Joyería Royo Albacete, 50+ años de tradición.",
  },
  Pendientes: {
    title: "Pendientes oro 18kt · Joyería Royo Albacete",
    metaDesc: "Pendientes de oro 18kt con diamantes, esmeraldas, rubíes y perlas. Joyería Royo Albacete, taller propio y diseño exclusivo.",
  },
  Pulseras: {
    title: "Pulseras oro 18kt · Joyería Royo Albacete",
    metaDesc: "Pulseras de oro 18kt: rivieres, pulseras rígidas, eslabones y diseño a medida. Joyería Royo Albacete, taller propio.",
  },
  Colgantes: {
    title: "Colgantes oro 18kt · Joyería Royo Albacete",
    metaDesc: "Colgantes de oro 18kt con diamantes y piedras naturales certificadas. Joyería Royo Albacete, garantía y diseño exclusivo.",
  },
  Gargantillas: {
    title: "Gargantillas oro 18kt · Joyería Royo Albacete",
    metaDesc: "Gargantillas de oro 18kt eslabón barbado, hombre y mujer. Diseño macizo con diamantes naturales. Joyería Royo Albacete.",
  },
};

const SECTION_TEMPLATES = {
  Relojes: {
    title: "Relojes oficiales · Joyería Royo Albacete",
    metaDesc: "Relojes oficiales Tissot, Longines, Seiko, Casio, Hamilton, Oris, Citizen, Omega, MontBlanc en Joyería Royo Albacete. 50+ años de experiencia.",
  },
  Marcas: {
    title: "Marcas oficiales relojería y joyería · Joyería Royo",
    metaDesc: "Distribuidor oficial Tissot, Longines, Seiko, Casio, Hamilton, Oris, Citizen, Omega, MontBlanc, Victorinox, Certina, B&M en Albacete.",
  },
  Hombre: {
    title: "Relojes hombre · Joyería Royo Albacete",
    metaDesc: "Relojes para hombre: Tissot, Longines, Seiko, Casio, Hamilton y más. Cuarzo, automático y solar. Joyería Royo Albacete.",
  },
  Mujer: {
    title: "Relojes mujer · Joyería Royo Albacete",
    metaDesc: "Relojes para mujer: Tissot Lady, Longines La Grande Classique, Seiko Presage Lady. Joyería Royo Albacete con garantía oficial.",
  },
  Outlet: {
    title: "Outlet relojes y joyas · Joyería Royo Albacete",
    metaDesc: "Outlet de relojes y joyería en Joyería Royo Albacete: descuentos en Tissot, Seiko, Casio y joyería de oro. Stock limitado.",
  },
  Escritura: {
    title: "Plumas y bolígrafos premium · Joyería Royo",
    metaDesc: "Instrumentos de escritura premium: Montblanc y otras marcas en Joyería Royo Albacete. Plumas, bolígrafos y juegos.",
  },
};

function generateCategoryPayload(cat) {
  const name = cat.name.replace(/&amp;/g, "&");
  let template = BRAND_TEMPLATES[name] || JEWELRY_CAT_TEMPLATES[name] || SECTION_TEMPLATES[name];
  let focuskw, title, metaDesc;
  if (template) {
    focuskw = name + " Joyería Royo";
    title = template.title;
    metaDesc = template.metaDesc;
  } else {
    // Genérico
    focuskw = name;
    title = `${name} · Joyería Royo Albacete`;
    metaDesc = `${name} en Joyería Royo Albacete. Más de 50 años de experiencia. Garantía y envío a toda España. Pásate por nuestra tienda en Tesifonte Gallego, 2.`;
  }
  if (title.length > 60) title = title.slice(0, 57) + "...";
  if (metaDesc.length > 155) metaDesc = metaDesc.slice(0, 152) + "...";
  return { focuskw, title, metaDesc };
}

async function main() {
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}`);
  const r = await fetch(`${WP_BASE}/wp-json/wp/v2/product_cat?per_page=100&_fields=id,name,slug,count`, {
    headers: { Authorization: auth, "User-Agent": USER_AGENT },
  });
  const cats = await r.json();
  if (!Array.isArray(cats)) { console.error("err categorias"); process.exit(1); }
  console.log(`[fetch] ${cats.length} categorías`);

  let updated = 0, errors = 0;
  for (const cat of cats) {
    const p = generateCategoryPayload(cat);
    console.log(`  [${dryRun ? "DRY" : "DO "}] ${cat.id} ${cat.name.padEnd(20)} kw="${p.focuskw}" title=${p.title.length}c meta=${p.metaDesc.length}c`);
    if (dryRun) continue;
    try {
      const res = await fetch(`${WP_BASE}/wp-json/wp/v2/product_cat/${cat.id}`, {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json", "User-Agent": USER_AGENT },
        body: JSON.stringify({
          meta: {
            _yoast_wpseo_focuskw: p.focuskw,
            _yoast_wpseo_title: p.title,
            _yoast_wpseo_metadesc: p.metaDesc,
          },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error(`    ERROR ${cat.id}: ${res.status} ${t.slice(0, 150)}`);
        errors++;
      } else updated++;
    } catch (err) {
      console.error(`    FATAL ${cat.id}: ${err.message}`);
      errors++;
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  console.log(`\n[done] updated=${updated} errors=${errors}`);
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
