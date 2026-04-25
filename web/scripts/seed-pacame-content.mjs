#!/usr/bin/env node
/**
 * Seed inicial de contenido de afiliados PACAME.
 * Crea 1 email + 1 post + 1 copy genérico por servicio principal,
 * idempotente vía title como dedupe key.
 *
 * Uso:
 *   cd web
 *   node scripts/seed-pacame-content.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...rest] = trimmed.split("=");
    if (!process.env[k]) process.env[k] = rest.join("=").replace(/^"|"$/g, "");
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tenant = process.env.REFERRAL_TENANT_ID || "pacame";

if (!url || !key) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const ASSETS = [
  // === Genéricos ===
  {
    type: "email",
    category: "general",
    title: "Email frío — Empresa local sin web profesional",
    description: "Para enviar a PYMEs locales que aún no tienen web o tienen una mala.",
    body: `Asunto: ¿Tu web {NEGOCIO} convierte clientes o solo está ahí?

Hola {NOMBRE},

Vi {NEGOCIO} y te quería contar algo en frío: hoy en día más del 70% de tus clientes te buscan en Google antes de llamarte. Si tu web no carga rápido, no enamora en 3 segundos y no te trae reservas/leads, estás regalando ventas a tu competencia.

Yo trabajo con PACAME — agencia digital con IA — y ofrecen webs profesionales desde 800€ con entrega en 5-7 días. Si pides cita por mi enlace de afiliado, ellos me dan una pequeña comisión y tú entras directamente al equipo de Pablo Calleja.

Mi enlace: https://pacameagencia.com/?ref={CODE}

Si te interesa, contesta a este email o entra y agenda una llamada gratis. Sin compromiso.

Un saludo,
{TU_NOMBRE}`,
    tags: ["cold-email", "outreach", "web", "pymes"],
  },
  {
    type: "post",
    category: "social",
    title: "Post LinkedIn — Recomendación PACAME",
    description: "Para publicar en tu perfil LinkedIn presentando PACAME.",
    body: `🚀 He encontrado la agencia digital que faltaba para PYMEs en España.

Se llama PACAME y son distintos: 7 agentes IA + supervisión humana de Pablo Calleja. Hacen webs, SEO, ads, redes sociales y branding al precio de un freelance pero con la velocidad y calidad de una agencia top.

3 razones por las que recomiendo PACAME:

✅ Entrega en días, no en meses (web profesional en 5-7 días)
✅ Precio claro desde 300€ (landing) hasta 800€ (web completa) — sin sorpresas
✅ Plan mensual de redes desde 197€ con publicaciones, copys y diseños incluidos

Si tu negocio necesita arreglar lo digital antes de fin de mes, échales un vistazo:

👉 https://pacameagencia.com/?ref={CODE}

#agenciadigital #pymes #marketingdigital #IA #España`,
    tags: ["linkedin", "social", "general"],
  },
  {
    type: "copy",
    category: "general",
    title: "WhatsApp para clientes — Pitch corto",
    description: "Mensaje breve para enviar por WhatsApp a contactos.",
    body: `Hola {NOMBRE} 👋

Te mando un recurso por si te viene bien: PACAME hace webs y redes sociales para PYMEs sin marear. Webs en 7 días desde 800€ y plan mensual de redes desde 197€.

Si entras por aquí me dan una pequeña comisión y tú una llamada gratis con su equipo:
https://pacameagencia.com/?ref={CODE}

Cualquier duda me dices.`,
    tags: ["whatsapp", "outreach", "short"],
  },

  // === Web ===
  {
    type: "email",
    category: "web",
    title: "Email — Web Corporativa 800€",
    description: "Para enviar a empresas que necesitan web profesional.",
    body: `Asunto: Web profesional para {NEGOCIO} en 7 días — 800€ todo incluido

Hola {NOMBRE},

Tu web actual probablemente esté frenando ventas. PACAME monta webs corporativas de 3-5 páginas con diseño personalizado, SEO técnico, formularios, blog y panel de administración por 800€ y la entregan en 5-7 días.

Lo que incluye:
• Diseño responsive premium
• Copy persuasivo para cada sección
• SEO on-page optimizado
• Hosting + dominio gestionados
• Panel para que edites tú mismo
• Soporte 30 días post-lanzamiento

Si encajas, entra por aquí y agenda gratis:
https://pacameagencia.com/?ref={CODE}

Un saludo,
{TU_NOMBRE}`,
    tags: ["email", "web", "corporativa"],
  },

  // === Social Monthly ===
  {
    type: "email",
    category: "social",
    title: "Email — Plan Redes Sociales 197€/mes",
    description: "Para PYMEs que descuidan sus RRSS.",
    body: `Asunto: 12-20 publicaciones al mes en RRSS por 197€ — sin que tú muevas un dedo

Hola {NOMBRE},

¿Cuándo fue la última vez que actualizaste el Instagram de {NEGOCIO}? Si la respuesta te avergüenza, sigue leyendo.

PACAME ofrece un plan mensual de gestión de redes por 197€:
• 12-20 posts mensuales con diseño + copy
• Calendario editorial
• Reporting con métricas reales
• Coordinación contigo cada 15 días

Te encargas de tu negocio, ellos de tu marca digital.

Mi enlace para empezar: https://pacameagencia.com/?ref={CODE}

{TU_NOMBRE}`,
    tags: ["email", "social_monthly", "rrss"],
  },

  // === SEO ===
  {
    type: "email",
    category: "seo",
    title: "Email — SEO Profesional 297€/mes",
    description: "Para negocios con web pero sin tráfico.",
    body: `Asunto: Tu web no aparece en Google → 297€/mes lo arregla

Hola {NOMBRE},

Si {NEGOCIO} no aparece en la primera página de Google, no existes para el 75% de tus clientes potenciales.

PACAME tiene un plan SEO mensual de 297€ que incluye:
• Auditoría técnica completa
• Optimización on-page y schema markup
• Artículos SEO publicados cada mes
• Link building white-hat
• Reporting con posiciones reales y tráfico orgánico

Sin contratos atrapa-tontos: pagas mensual y cancelas cuando quieras.

Mi enlace: https://pacameagencia.com/?ref={CODE}

Saludos,
{TU_NOMBRE}`,
    tags: ["email", "seo_monthly", "google"],
  },

  // === Pack ===
  {
    type: "post",
    category: "pack",
    title: "Post Twitter/X — Pack Web + Redes 15% off",
    description: "Tweet promocional del pack combinado.",
    body: `🎯 Si tu PYME necesita ARREGLAR lo digital de cero:

PACAME tiene un pack que incluye:
✅ Web corporativa profesional (5-7 días)
✅ Plan mensual de redes sociales (12-20 posts/mes)
✅ 15% de descuento sobre el precio combinado

Cero excusas para no estar online en 2026.

👉 https://pacameagencia.com/?ref={CODE}`,
    tags: ["twitter", "x", "pack"],
  },

  // === Landing ===
  {
    type: "copy",
    category: "landing",
    title: "Copy CTA — Landing rápida 300€",
    description: "Una línea para añadir a un email existente o post.",
    body: `¿Lanzas un nuevo producto o servicio? PACAME te monta una landing de alta conversión por 300€ en 2-3 días: https://pacameagencia.com/?ref={CODE}`,
    tags: ["copy", "landing", "short"],
  },

  // === Recurso visual ===
  {
    type: "banner",
    category: "general",
    title: "Banner 1200×630 — PACAME genérico",
    description: "Imagen lista para subir a LinkedIn / Facebook / blog. Reemplaza la URL si quieres usar tu propia versión.",
    preview_url: "https://pacameagencia.com/opengraph-image",
    download_url: "https://pacameagencia.com/opengraph-image",
    body: null,
    tags: ["banner", "og-image"],
  },
];

let created = 0;
let skipped = 0;

for (const a of ASSETS) {
  const { data: existing } = await supabase
    .from("aff_content_assets")
    .select("id")
    .eq("tenant_id", tenant)
    .eq("title", a.title)
    .maybeSingle();

  if (existing) {
    skipped += 1;
    continue;
  }

  const { error } = await supabase.from("aff_content_assets").insert({
    tenant_id: tenant,
    type: a.type,
    category: a.category,
    title: a.title,
    description: a.description,
    body: a.body,
    preview_url: a.preview_url ?? null,
    download_url: a.download_url ?? null,
    tags: a.tags ?? [],
    active: true,
    created_by: "seed-script",
  });

  if (error) {
    console.error(`[seed] ${a.title}:`, error.message);
  } else {
    console.log(`[seed] inserted ${a.title}`);
    created += 1;
  }
}

console.log(`\n[seed] done — created=${created} skipped=${skipped}`);
