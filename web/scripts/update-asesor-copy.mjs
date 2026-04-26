#!/usr/bin/env node
/**
 * Actualiza copy AsesorPro en Supabase: quita referencias a "enviar a Hacienda".
 * Mantiene ese servicio como FUER del scope del producto.
 */
import pg from "pg";

const URL = process.env.DATABASE_URL;
if (!URL) { console.error("Falta DATABASE_URL"); process.exit(1); }

const client = new pg.Client({ connectionString: URL });
await client.connect();

const newPricing = [
  { tier: "solo", name: "Asesor Solo", price_eur: 39, interval: "month",
    limits: { clients: 15, monthly_pack: false, api: false, asesores: 1 },
    stripe_price_id: null },
  { tier: "pro", name: "Asesor Pro", price_eur: 89, interval: "month",
    limits: { clients: 50, monthly_pack: true, api: false, asesores: 1 },
    stripe_price_id: null, recommended: true },
  { tier: "despacho", name: "Despacho", price_eur: 199, interval: "month",
    limits: { clients: -1, monthly_pack: true, api: true, asesores: 5 },
    stripe_price_id: null },
];

const newFeatures = [
  "Pipeline tipo Trello (pendiente · revisado · empaquetado · cerrado)",
  "Panel para que tu cliente facture en 3 clicks (PDF legal español, numeración correlativa)",
  "OCR automático de tickets y facturas que el cliente sube por foto",
  "Cálculo automático IVA repercutido vs soportado por trimestre",
  "Pack mensual auto-empaquetado en ZIP (todas las facturas + gastos + resumen para que TÚ presentes lo que tengas que presentar)",
  "Alertas: cliente inactivo, trimestre cerca, factura pendiente de revisar",
  "Chat asesor ↔ cliente integrado y notificaciones a Telegram",
  "Recepcionista IA en español que coge llamadas 24/7 (Vapi)",
  "Audio resumen de cada factura (escucha en vez de leer)",
];

const newMarketing = {
  hero_headline: "Tus clientes facturan. Tú revisas. Adiós al WhatsApp infierno.",
  hero_sub: "Cada cliente factura desde su panel. Tú lo ves todo en un trimestre limpio sin perseguir PDFs ni pedir tickets. Cero papeles. Cero excusas.",
  target_persona: "Asesoría fiscal pequeña (1-5 personas) con 10-50 clientes PYME",
  pain_quote: "Pierdo 30% del día metiendo a mano facturas que mis clientes me mandan por WhatsApp",
  primary_color: "#283B70",
  accent_color: "#B54E30",
  trial_cta: "Empieza gratis 14 días",
};

// Mantenemos los stripe_price_id existentes
const { rows } = await client.query("SELECT pricing FROM pacame_products WHERE id='asesor-pro'");
const existing = rows[0]?.pricing ?? [];
for (const t of newPricing) {
  const old = existing.find(p => p.tier === t.tier);
  if (old?.stripe_price_id) t.stripe_price_id = old.stripe_price_id;
}

await client.query(
  `UPDATE pacame_products
     SET pricing = $1::jsonb,
         features = $2::jsonb,
         marketing = $3::jsonb,
         updated_at = now()
   WHERE id = 'asesor-pro'`,
  [JSON.stringify(newPricing), JSON.stringify(newFeatures), JSON.stringify(newMarketing)]
);

console.log("✓ AsesorPro copy actualizado (sin Hacienda).");
await client.end();
