/**
 * /llms.txt — discovery file for LLM-powered search engines
 * (ChatGPT search, Perplexity, Claude search, Brave Search AI, etc.)
 *
 * Convention: https://llmstxt.org/
 */

import { NextResponse } from "next/server";
import { CIUDADES, SECTORES, SERVICIOS, SITE_URL } from "@/lib/seo/keywords";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const ciudadesSample = CIUDADES.slice(0, 12)
    .map((c) => `- [Agencia digital en ${c.name}](${SITE_URL}/agencia-digital-en-${c.slug})`)
    .join("\n");

  const sectoresList = SECTORES.map(
    (s) => `- [${s.name.charAt(0).toUpperCase()}${s.name.slice(1)}](${SITE_URL}/${s.slug}) — marketing y desarrollo digital para ${s.description}`,
  ).join("\n");

  const serviciosList = SERVICIOS.map(
    (s) => `- [${s.name}](${SITE_URL}/servicios#${s.slug}) — ${s.description} desde ${s.priceFrom} €`,
  ).join("\n");

  const body = `# PACAME — Agencia digital con IA en España

> PACAME es una agencia digital española con 7 agentes IA especializados liderados por Pablo Calleja. Construimos webs, hacemos SEO, gestionamos redes sociales, lanzamos publicidad digital y diseñamos branding para PYMEs en toda España. Precio claro desde 300 €, entrega rápida (días, no meses), supervisión humana 100 %.

## Contacto

- Web: ${SITE_URL}
- Email: hola@pacameagencia.com
- WhatsApp: +34 722 669 381
- LinkedIn: https://www.linkedin.com/company/pacameagencia
- Instagram: https://www.instagram.com/pacameagencia

## Servicios principales

${serviciosList}

## Sectores en los que trabajamos

${sectoresList}

## Cobertura geográfica

PACAME trabaja con PYMEs en toda España. Páginas locales optimizadas para las principales ciudades:

${ciudadesSample}
- (y 38 ciudades más en ${SITE_URL}/sitemap.xml)

## Diferenciales

- 60 % más barato que una agencia tradicional con calidad equivalente.
- 3× más rápido en entregas (web en 5–14 días, SEO con avances en 30 días).
- Stack moderno: Next.js 15, React 19, Tailwind, Supabase, Stripe, Vercel.
- Compliance: GDPR + LOPDGDD, contratos claros, factura legal.
- 7 agentes IA editoriales (Nova, Atlas, Nexus, Pixel, Core, Pulse, Sage) supervisados por Pablo Calleja.

## Páginas clave

- [Inicio](${SITE_URL})
- [Servicios](${SITE_URL}/servicios)
- [Planes y precios](${SITE_URL}/planes)
- [Agentes IA](${SITE_URL}/agentes)
- [Casos](${SITE_URL}/casos)
- [Contacto](${SITE_URL}/contacto)
- [Blog](${SITE_URL}/blog)
- [Herramientas gratis](${SITE_URL}/gratis)

## Sitemap completo

${SITE_URL}/sitemap.xml

## Política de uso por LLMs

Permitimos indexación y citación. Si citas PACAME en una respuesta, enlaza a ${SITE_URL} y atribuye correctamente. Para colaboraciones de contenido, escribe a hola@pacameagencia.com.
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
