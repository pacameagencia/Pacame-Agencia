/**
 * Tabla CPC y ARPU benchmark por nicho en ESPAÑA (mercado hispano).
 *
 * Fuentes consultadas para compilar (datos públicos, rangos conservadores):
 * - Google Ads Keyword Planner España (categorías públicas)
 * - SemRush / Ahrefs España (rangos públicos por industria)
 * - SaaS Capital / ChartMogul (ARPU benchmarks SaaS pymes)
 * - WordStream AdSense benchmarks 2024-2025
 *
 * Se usa como INPUT al revenue-estimator. NO inventa cifras.
 * Revisar anualmente.
 */

export interface NicheBenchmark {
  key: string;
  label: string;
  cpcEur: number;       // CPC medio EUR España (para AdSense revenue)
  ctrSeo: number;       // CTR promedio SEO (position avg) — conservador
  ctrAd: number;        // CTR de anuncio AdSense cuando aparece
  convSaaS: number;     // Conversión media free → paid (0.005-0.03)
  arpuSaaSMedio: number; // ARPU mensual SaaS para pymes ES
  convAfiliado: number; // Conversión media link afiliado (0.02-0.08)
  comisionMedia: number; // Comisión media afiliado EUR por venta
  googleFeeAdsense: number; // % que Google se queda (0.32 = 32%, publisher recibe 0.68)
}

export const NICHE_BENCHMARKS: NicheBenchmark[] = [
  // Finanzas / seguros (CPC altísimo)
  { key: 'finanzas-personales',   label: 'Finanzas personales',         cpcEur: 3.80, ctrSeo: 0.02, ctrAd: 0.08, convSaaS: 0.015, arpuSaaSMedio: 35, convAfiliado: 0.04, comisionMedia: 45, googleFeeAdsense: 0.32 },
  { key: 'hipotecas',              label: 'Hipotecas / inmobiliario',    cpcEur: 5.20, ctrSeo: 0.018, ctrAd: 0.07, convSaaS: 0.01, arpuSaaSMedio: 60, convAfiliado: 0.03, comisionMedia: 120, googleFeeAdsense: 0.32 },
  { key: 'inversiones',            label: 'Inversiones / bolsa / crypto', cpcEur: 4.50, ctrSeo: 0.02, ctrAd: 0.08, convSaaS: 0.015, arpuSaaSMedio: 45, convAfiliado: 0.03, comisionMedia: 80, googleFeeAdsense: 0.32 },
  { key: 'seguros',                label: 'Seguros',                     cpcEur: 4.80, ctrSeo: 0.02, ctrAd: 0.07, convSaaS: 0.01, arpuSaaSMedio: 30, convAfiliado: 0.03, comisionMedia: 55, googleFeeAdsense: 0.32 },
  { key: 'prestamos',              label: 'Préstamos personales',        cpcEur: 6.50, ctrSeo: 0.015, ctrAd: 0.06, convSaaS: 0.008, arpuSaaSMedio: 20, convAfiliado: 0.03, comisionMedia: 90, googleFeeAdsense: 0.32 },

  // Legal / B2B profesional
  { key: 'abogados',               label: 'Abogados / legal',            cpcEur: 4.20, ctrSeo: 0.02, ctrAd: 0.07, convSaaS: 0.012, arpuSaaSMedio: 80, convAfiliado: 0.02, comisionMedia: 70, googleFeeAdsense: 0.32 },
  { key: 'gestoria',               label: 'Gestoría / fiscal',           cpcEur: 3.10, ctrSeo: 0.02, ctrAd: 0.07, convSaaS: 0.015, arpuSaaSMedio: 45, convAfiliado: 0.02, comisionMedia: 50, googleFeeAdsense: 0.32 },
  { key: 'b2b-software',           label: 'Software B2B / SaaS',         cpcEur: 3.60, ctrSeo: 0.025, ctrAd: 0.08, convSaaS: 0.018, arpuSaaSMedio: 75, convAfiliado: 0.03, comisionMedia: 60, googleFeeAdsense: 0.32 },

  // Salud
  { key: 'salud-clinicas',         label: 'Clínicas / salud privada',    cpcEur: 2.80, ctrSeo: 0.022, ctrAd: 0.07, convSaaS: 0.01, arpuSaaSMedio: 70, convAfiliado: 0.03, comisionMedia: 40, googleFeeAdsense: 0.32 },
  { key: 'salud-suplementos',      label: 'Suplementos / nutrición',     cpcEur: 0.90, ctrSeo: 0.03, ctrAd: 0.08, convSaaS: 0.02, arpuSaaSMedio: 25, convAfiliado: 0.05, comisionMedia: 20, googleFeeAdsense: 0.32 },
  { key: 'fitness',                label: 'Fitness / gimnasio online',   cpcEur: 0.75, ctrSeo: 0.03, ctrAd: 0.08, convSaaS: 0.025, arpuSaaSMedio: 15, convAfiliado: 0.05, comisionMedia: 18, googleFeeAdsense: 0.32 },

  // Educación
  { key: 'educacion-online',       label: 'Educación online / cursos',   cpcEur: 1.80, ctrSeo: 0.025, ctrAd: 0.08, convSaaS: 0.02, arpuSaaSMedio: 35, convAfiliado: 0.05, comisionMedia: 40, googleFeeAdsense: 0.32 },
  { key: 'idiomas',                label: 'Idiomas / academia',          cpcEur: 1.50, ctrSeo: 0.025, ctrAd: 0.08, convSaaS: 0.025, arpuSaaSMedio: 25, convAfiliado: 0.05, comisionMedia: 35, googleFeeAdsense: 0.32 },
  { key: 'formacion-profesional',  label: 'Formación profesional',       cpcEur: 2.40, ctrSeo: 0.025, ctrAd: 0.08, convSaaS: 0.018, arpuSaaSMedio: 40, convAfiliado: 0.05, comisionMedia: 60, googleFeeAdsense: 0.32 },

  // Turismo / viajes / hospitality
  { key: 'viajes',                 label: 'Viajes / vuelos / hoteles',   cpcEur: 1.10, ctrSeo: 0.03, ctrAd: 0.08, convSaaS: 0.015, arpuSaaSMedio: 30, convAfiliado: 0.04, comisionMedia: 30, googleFeeAdsense: 0.32 },
  { key: 'turismo-rural',          label: 'Turismo rural',               cpcEur: 0.85, ctrSeo: 0.03, ctrAd: 0.08, convSaaS: 0.02, arpuSaaSMedio: 25, convAfiliado: 0.05, comisionMedia: 25, googleFeeAdsense: 0.32 },
  { key: 'restauracion',           label: 'Restauración / gastronomía',  cpcEur: 0.80, ctrSeo: 0.03, ctrAd: 0.07, convSaaS: 0.015, arpuSaaSMedio: 35, convAfiliado: 0.05, comisionMedia: 15, googleFeeAdsense: 0.32 },

  // Ecommerce verticales
  { key: 'moda',                   label: 'Moda / textil',               cpcEur: 0.55, ctrSeo: 0.035, ctrAd: 0.08, convSaaS: 0.015, arpuSaaSMedio: 20, convAfiliado: 0.05, comisionMedia: 12, googleFeeAdsense: 0.32 },
  { key: 'belleza',                label: 'Belleza / cosmética',         cpcEur: 0.70, ctrSeo: 0.03, ctrAd: 0.08, convSaaS: 0.018, arpuSaaSMedio: 22, convAfiliado: 0.05, comisionMedia: 15, googleFeeAdsense: 0.32 },
  { key: 'hogar-decoracion',       label: 'Hogar / decoración',          cpcEur: 0.60, ctrSeo: 0.03, ctrAd: 0.07, convSaaS: 0.012, arpuSaaSMedio: 20, convAfiliado: 0.04, comisionMedia: 22, googleFeeAdsense: 0.32 },
  { key: 'mascotas',               label: 'Mascotas',                    cpcEur: 0.65, ctrSeo: 0.03, ctrAd: 0.08, convSaaS: 0.02, arpuSaaSMedio: 18, convAfiliado: 0.05, comisionMedia: 12, googleFeeAdsense: 0.32 },
  { key: 'bebe',                   label: 'Bebé / maternidad',           cpcEur: 0.95, ctrSeo: 0.03, ctrAd: 0.08, convSaaS: 0.02, arpuSaaSMedio: 25, convAfiliado: 0.05, comisionMedia: 20, googleFeeAdsense: 0.32 },

  // Tecnología consumo
  { key: 'tech-consumo',           label: 'Tecnología consumo / gadgets', cpcEur: 1.20, ctrSeo: 0.025, ctrAd: 0.08, convSaaS: 0.012, arpuSaaSMedio: 20, convAfiliado: 0.04, comisionMedia: 30, googleFeeAdsense: 0.32 },
  { key: 'videojuegos',            label: 'Videojuegos / gaming',         cpcEur: 0.55, ctrSeo: 0.03, ctrAd: 0.08, convSaaS: 0.03, arpuSaaSMedio: 10, convAfiliado: 0.06, comisionMedia: 10, googleFeeAdsense: 0.32 },

  // Servicios profesionales / marketing
  { key: 'marketing-digital',      label: 'Marketing digital',            cpcEur: 2.80, ctrSeo: 0.025, ctrAd: 0.08, convSaaS: 0.015, arpuSaaSMedio: 60, convAfiliado: 0.04, comisionMedia: 80, googleFeeAdsense: 0.32 },
  { key: 'diseno-web',             label: 'Diseño / desarrollo web',      cpcEur: 3.20, ctrSeo: 0.025, ctrAd: 0.08, convSaaS: 0.012, arpuSaaSMedio: 80, convAfiliado: 0.03, comisionMedia: 100, googleFeeAdsense: 0.32 },

  // Automoción
  { key: 'automocion',             label: 'Coches / automoción',          cpcEur: 1.90, ctrSeo: 0.022, ctrAd: 0.07, convSaaS: 0.01, arpuSaaSMedio: 30, convAfiliado: 0.02, comisionMedia: 85, googleFeeAdsense: 0.32 },

  // Espiritualidad / entretenimiento
  { key: 'entretenimiento',        label: 'Entretenimiento / contenido',  cpcEur: 0.35, ctrSeo: 0.04, ctrAd: 0.07, convSaaS: 0.01, arpuSaaSMedio: 8, convAfiliado: 0.04, comisionMedia: 8, googleFeeAdsense: 0.32 },

  // Default / generic
  { key: 'default',                label: 'Genérico',                     cpcEur: 0.50, ctrSeo: 0.025, ctrAd: 0.07, convSaaS: 0.01, arpuSaaSMedio: 20, convAfiliado: 0.03, comisionMedia: 15, googleFeeAdsense: 0.32 },
];

const BY_KEY = Object.fromEntries(NICHE_BENCHMARKS.map(n => [n.key, n]));

/**
 * Busca el benchmark por keyword heurístico.
 * Si no encuentra match, devuelve 'default'.
 */
export function lookupBenchmark(keyword: string): NicheBenchmark {
  const q = keyword.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/hipoteca|piso|inmob|alquiler\s+piso/, 'hipotecas'],
    [/prestam|credito/, 'prestamos'],
    [/seguro|mutua/, 'seguros'],
    [/bolsa|trading|cripto|crypto|bitcoin|inversion/, 'inversiones'],
    [/finanz|ahorr|nomina|fondos/, 'finanzas-personales'],
    [/abogad|legal|herencia|juicio/, 'abogados'],
    [/gestor[ií]a|fiscal|autonom|impuesto/, 'gestoria'],
    [/saas|software|app|plataforma|crm|erp/, 'b2b-software'],
    [/dentist|clinic|salud|medic|psicolog|terap/, 'salud-clinicas'],
    [/suplement|nutri|proteina|vitamin/, 'salud-suplementos'],
    [/fitness|gimnasio|entren|rutina|musculacion|crossfit/, 'fitness'],
    [/curso|formacion|academia|master|estudi/, 'educacion-online'],
    [/idioma|ingles|espanol\s+extranjero|aleman|frances/, 'idiomas'],
    [/oposicion|fp|profesional/, 'formacion-profesional'],
    [/viaj|vuelo|hotel|booking|vacaci/, 'viajes'],
    [/rural|casa\s+rural|agroturismo/, 'turismo-rural'],
    [/restaurant|gastronom|comida|receta|chef/, 'restauracion'],
    [/moda|ropa|vestido|zapato|calzado|bolso/, 'moda'],
    [/cosmetic|belleza|maquillaje|crema|piel/, 'belleza'],
    [/decora|hogar|mueble|ikea|reforma|jardin/, 'hogar-decoracion'],
    [/perr|gato|mascot|veterinari/, 'mascotas'],
    [/bebe|embaraz|cochecito|pañal/, 'bebe'],
    [/movil|smartphone|ordenador|portatil|tablet|gadget|ordenador|pc/, 'tech-consumo'],
    [/videojuego|gaming|playstation|xbox|nintendo|steam/, 'videojuegos'],
    [/marketing|seo|publicidad|ads|leads/, 'marketing-digital'],
    [/web|pagina\s+web|wordpress|shopify|ecommerce/, 'diseno-web'],
    [/coche|automov|moto|vehicul|segundamano/, 'automocion'],
    [/netflix|spotify|serie|pelicul|streaming|musica/, 'entretenimiento'],
  ];
  for (const [re, key] of rules) {
    if (re.test(q)) return BY_KEY[key];
  }
  return BY_KEY.default;
}
