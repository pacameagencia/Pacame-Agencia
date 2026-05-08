/**
 * Copy de cada isla del Storybook 3D (web/app/(storybook)).
 *
 * Fuente de verdad: web/lib/data/services.ts (mapping por id).
 * Este archivo añade el "lenguaje storybook" — hooklines, oneLineValue,
 * miniCase — que NO vive en services.ts (esos campos son comerciales).
 *
 * Reglas copy (anti-IA):
 *  - NUNCA palabras prohibidas: desbloquea, embárcate, viaje, transformador,
 *    en última instancia, en el mundo actual, navegar, descubre el potencial.
 *  - NUNCA fórmulas trilladas: "X no es solo Y, es Z", "imagina un futuro donde".
 *  - SÍ frases cortas, verbos activos, números concretos.
 *  - SÍ tutea (alineado IDENTIDAD-PABLO.md).
 *  - CTA único: "Pide tu auditoría 15 min".
 */

export type IslandSlug = "web" | "seo" | "redes" | "ads" | "branding";

export interface IslandContent {
  /** Match con services.ts id. */
  serviceId: IslandSlug;
  /** Categoría visible en HUD ("WEB", "SEO", etc). */
  category: string;
  /** 5-7 palabras. Hook concreto, sin humo. */
  hookline: string;
  /** Una frase con número o promesa medible. */
  oneLineValue: string;
  /** Mini-caso: cliente + métrica resultado. */
  miniCase: string;
  /** Color base de la isla (token brand pack). */
  baseColor: "terracotta" | "indigo" | "mustard" | "olive" | "mixed";
  /** Tagline para AccessibleNav (tooltip teclado). */
  shortcutLabel: string;
}

export const ISLAND_CONTENT: Record<IslandSlug, IslandContent> = {
  web: {
    serviceId: "web",
    category: "WEB",
    hookline: "Tu negocio online en 30 días.",
    oneLineValue: "Landing, web corporativa o e-commerce. Desde 800€.",
    miniCase: "+47% conversión en 60 días — peluquería Bilbao.",
    baseColor: "terracotta",
    shortcutLabel: "Ir a Web (1)",
  },
  seo: {
    serviceId: "seo",
    category: "SEO",
    hookline: "Te encuentran o no existes.",
    oneLineValue: "Auditoría + estrategia + link building. Desde 300€/mes.",
    miniCase: "+180% tráfico orgánico en 6 meses — clínica dental Madrid.",
    baseColor: "indigo",
    shortcutLabel: "Ir a SEO (2)",
  },
  redes: {
    serviceId: "redes",
    category: "REDES",
    hookline: "Tu audiencia te escucha por fin.",
    oneLineValue: "Contenido + community + estrategia. Desde 300€/mes.",
    miniCase: "0 → 15K followers IG en 90 días — restaurante Sevilla.",
    baseColor: "mustard",
    shortcutLabel: "Ir a Redes (3)",
  },
  ads: {
    serviceId: "ads",
    category: "ADS",
    hookline: "Cada euro vuelve con tres más.",
    oneLineValue: "Meta + Google + funnels. Desde 400€/mes + ad spend.",
    miniCase: "ROAS 4.8x en peluquería Bilbao — 3 meses.",
    baseColor: "olive",
    shortcutLabel: "Ir a Ads (4)",
  },
  branding: {
    serviceId: "branding",
    category: "BRANDING",
    hookline: "Tu marca con carácter, no plantilla.",
    oneLineValue: "Logo + paleta + tipografía + manual. Desde 400€.",
    miniCase: "Rebrand → +35% recordación — taller artesano Valencia.",
    baseColor: "mixed",
    shortcutLabel: "Ir a Branding (5)",
  },
};

/** Orden canónico de las 5 islas (debe coincidir con CAMERA_KEYFRAMES). */
export const ISLAND_ORDER: readonly IslandSlug[] = [
  "web",
  "seo",
  "redes",
  "ads",
  "branding",
] as const;

/** CTA único persistente (8 palabras, verbo + número). */
export const CTA_LABEL = "Pide tu auditoría 15 min";
export const CTA_HREF = "/auditoria-3d";

/** Hookline overview (cuando ninguna isla está activa). */
export const OVERVIEW_HOOKLINE = "Tu agencia de IA.";
export const OVERVIEW_SUBLINE = "5 servicios. 1 transformación.";

/** Mensaje del prompt de captura de email progresivo (Fase 4 lo usa). */
export const EMAIL_PROMPT_TITLE = "Te mando un resumen";
export const EMAIL_PROMPT_BODY = "Sin spam, solo lo que has visto.";
