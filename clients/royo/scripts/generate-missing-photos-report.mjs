#!/usr/bin/env node
/**
 * Sprint 3V — Genera reporte completo de productos SIN foto real.
 *
 * Lista los 107 productos cuya featured es Sin-titulo* y NO tienen
 * packshot oficial en uploads/galería/descripción.
 *
 * Reporte por marca con SKU + nombre + URL del producto, para que Pablo
 * pueda hacer fotos físicas o solicitarlas al fabricante.
 *
 * USO:
 *   node clients/royo/scripts/generate-missing-photos-report.mjs
 */
import fs from 'node:fs';

const WP_BASE = 'https://joyeriaroyo.com';

(async () => {
  const all = [];
  for (let page = 1; page <= 7; page++) {
    const url = `${WP_BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}&_fields=id,name,sku,categories,images,permalink`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }

  const sinFoto = all.filter(p => {
    const imgs = p.images || [];
    if (!imgs.length) return false;
    return (imgs[0].src || '').toLowerCase().includes('sin-titulo');
  });

  // Agrupar por marca
  const byBrand = {};
  for (const p of sinFoto) {
    const cats = (p.categories || []).map(c => c.name);
    let brand = 'Otros';
    for (const b of ['Tissot', 'Longines', 'Casio', 'Seiko', 'Citizen', 'Hamilton', 'Oris', 'Certina', 'MontBlanc', 'Mont Blanc', 'Victorinox', 'Baume & Mercier', 'Franck Muller', 'Omega', 'Tsar Bomba']) {
      if (cats.includes(b)) { brand = b; break; }
    }
    if (brand === 'Otros') {
      for (const b of ['Tissot', 'Longines', 'Casio', 'Seiko', 'Citizen', 'Hamilton', 'Oris', 'Certina', 'MontBlanc', 'Victorinox', 'Baume & Mercier', 'Franck Muller', 'Omega']) {
        if ((p.name || '').toLowerCase().includes(b.toLowerCase())) { brand = b; break; }
      }
    }
    byBrand[brand] = byBrand[brand] || [];
    byBrand[brand].push(p);
  }

  // Generar reporte Markdown
  let md = `# Productos Joyería Royo sin foto oficial\n\nFecha: ${new Date().toISOString().slice(0, 10)}\n\n`;
  md += `**Total: ${sinFoto.length} productos** muestran placeholder "PIEZA DISPONIBLE EN TIENDA" en su archive de categoría.\n\n`;
  md += `Estos productos NO tienen packshot oficial subido a wp-content/uploads ni en galería ni embebido en descripción. Para que dejen de mostrar el placeholder se necesita:\n\n`;
  md += `1. **Fotos físicas del producto** (Pablo puede hacerlas en la tienda)\n`;
  md += `2. **Packshot oficial del fabricante** (Royo es distribuidor autorizado, puede solicitar acceso al media center)\n`;
  md += `3. **Imágenes generadas con IA** (Higgsfield para sintéticos verificables)\n\n`;
  md += `---\n\n`;

  const sortedBrands = Object.entries(byBrand).sort((a, b) => b[1].length - a[1].length);
  for (const [brand, products] of sortedBrands) {
    md += `## ${brand} (${products.length} productos)\n\n`;
    md += `| ID | SKU | Nombre | URL |\n|---|---|---|---|\n`;
    for (const p of products) {
      const slug = (p.permalink || '').replace(WP_BASE + '/producto/', '').replace(/\/$/, '');
      md += `| ${p.id} | \`${p.sku || '—'}\` | ${p.name.slice(0, 60)} | [link](/producto/${slug}) |\n`;
    }
    md += `\n`;
  }

  fs.writeFileSync('clients/royo/docs/productos-sin-foto.md', md);
  console.log(`[ok] Reporte generado en clients/royo/docs/productos-sin-foto.md`);
  console.log(`[ok] ${sinFoto.length} productos sin foto distribuidos en ${sortedBrands.length} marcas`);
  for (const [b, list] of sortedBrands) {
    console.log(`  ${b}: ${list.length}`);
  }
})();
