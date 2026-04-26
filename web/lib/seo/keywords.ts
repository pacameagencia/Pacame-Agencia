/**
 * PACAME — Keyword universe + city + sector clusters for programmatic SEO.
 *
 * Used by:
 *  - app/agencia-digital-en-[ciudad]/page.tsx (50 cities)
 *  - app/[servicio]-para-[sector]/page.tsx (40 service x sector)
 *  - app/[sector]/page.tsx (8 sector hubs)
 *  - app/sitemap.ts
 *  - app/robots.ts
 */

export const SITE_URL = "https://pacameagencia.com";

/** 50 ciudades top España priorizadas por población + intención comercial */
export const CIUDADES = [
  { slug: "madrid", name: "Madrid", region: "Comunidad de Madrid", priority: 1.0 },
  { slug: "barcelona", name: "Barcelona", region: "Cataluña", priority: 1.0 },
  { slug: "valencia", name: "Valencia", region: "Comunidad Valenciana", priority: 1.0 },
  { slug: "sevilla", name: "Sevilla", region: "Andalucía", priority: 1.0 },
  { slug: "zaragoza", name: "Zaragoza", region: "Aragón", priority: 0.9 },
  { slug: "malaga", name: "Málaga", region: "Andalucía", priority: 1.0 },
  { slug: "murcia", name: "Murcia", region: "Región de Murcia", priority: 0.9 },
  { slug: "palma", name: "Palma", region: "Islas Baleares", priority: 0.9 },
  { slug: "las-palmas", name: "Las Palmas de Gran Canaria", region: "Canarias", priority: 0.9 },
  { slug: "bilbao", name: "Bilbao", region: "País Vasco", priority: 0.9 },
  { slug: "alicante", name: "Alicante", region: "Comunidad Valenciana", priority: 0.85 },
  { slug: "cordoba", name: "Córdoba", region: "Andalucía", priority: 0.85 },
  { slug: "valladolid", name: "Valladolid", region: "Castilla y León", priority: 0.85 },
  { slug: "vigo", name: "Vigo", region: "Galicia", priority: 0.85 },
  { slug: "gijon", name: "Gijón", region: "Asturias", priority: 0.85 },
  { slug: "granada", name: "Granada", region: "Andalucía", priority: 0.85 },
  { slug: "vitoria", name: "Vitoria-Gasteiz", region: "País Vasco", priority: 0.85 },
  { slug: "a-coruna", name: "A Coruña", region: "Galicia", priority: 0.85 },
  { slug: "pamplona", name: "Pamplona", region: "Navarra", priority: 0.85 },
  { slug: "almeria", name: "Almería", region: "Andalucía", priority: 0.8 },
  { slug: "donostia", name: "Donostia-San Sebastián", region: "País Vasco", priority: 0.85 },
  { slug: "santander", name: "Santander", region: "Cantabria", priority: 0.85 },
  { slug: "toledo", name: "Toledo", region: "Castilla-La Mancha", priority: 0.8 },
  { slug: "burgos", name: "Burgos", region: "Castilla y León", priority: 0.8 },
  { slug: "salamanca", name: "Salamanca", region: "Castilla y León", priority: 0.8 },
  { slug: "logrono", name: "Logroño", region: "La Rioja", priority: 0.8 },
  { slug: "badajoz", name: "Badajoz", region: "Extremadura", priority: 0.8 },
  { slug: "huelva", name: "Huelva", region: "Andalucía", priority: 0.8 },
  { slug: "leon", name: "León", region: "Castilla y León", priority: 0.8 },
  { slug: "tarragona", name: "Tarragona", region: "Cataluña", priority: 0.8 },
  { slug: "lleida", name: "Lleida", region: "Cataluña", priority: 0.8 },
  { slug: "ourense", name: "Ourense", region: "Galicia", priority: 0.75 },
  { slug: "cadiz", name: "Cádiz", region: "Andalucía", priority: 0.8 },
  { slug: "jerez", name: "Jerez de la Frontera", region: "Andalucía", priority: 0.8 },
  { slug: "pontevedra", name: "Pontevedra", region: "Galicia", priority: 0.75 },
  { slug: "oviedo", name: "Oviedo", region: "Asturias", priority: 0.85 },
  { slug: "castellon", name: "Castellón", region: "Comunidad Valenciana", priority: 0.8 },
  { slug: "reus", name: "Reus", region: "Cataluña", priority: 0.75 },
  { slug: "girona", name: "Girona", region: "Cataluña", priority: 0.8 },
  { slug: "mataro", name: "Mataró", region: "Cataluña", priority: 0.75 },
  { slug: "sabadell", name: "Sabadell", region: "Cataluña", priority: 0.8 },
  { slug: "terrassa", name: "Terrassa", region: "Cataluña", priority: 0.8 },
  { slug: "cartagena", name: "Cartagena", region: "Región de Murcia", priority: 0.8 },
  { slug: "marbella", name: "Marbella", region: "Andalucía", priority: 0.85 },
  { slug: "estepona", name: "Estepona", region: "Andalucía", priority: 0.75 },
  { slug: "fuengirola", name: "Fuengirola", region: "Andalucía", priority: 0.75 },
  { slug: "mijas", name: "Mijas", region: "Andalucía", priority: 0.75 },
  { slug: "benidorm", name: "Benidorm", region: "Comunidad Valenciana", priority: 0.8 },
  { slug: "torremolinos", name: "Torremolinos", region: "Andalucía", priority: 0.75 },
  { slug: "mostoles", name: "Móstoles", region: "Comunidad de Madrid", priority: 0.75 },
] as const;

export type Ciudad = (typeof CIUDADES)[number];

export const SECTORES = [
  {
    slug: "restaurantes",
    name: "restaurantes",
    plural: "restaurantes y hostelería",
    keyword: "restaurantes",
    description: "bares, restaurantes, gastrobares, cafeterías y hostelería",
    pains: ["mesas vacías entre semana", "cero presencia online", "Google Maps mal optimizado", "menús desactualizados"],
    image: "sectors/restaurant",
    ogImage: "og/sector-restaurant",
  },
  {
    slug: "hoteles",
    name: "hoteles",
    plural: "hoteles, B&B y rurales",
    keyword: "hoteles",
    description: "hoteles boutique, casas rurales, B&B y alojamientos turísticos",
    pains: ["dependencia total de Booking", "ocupación baja temporada media", "web con conversión <1%", "no captan directos"],
    image: "sectors/hotel",
    ogImage: "og/sector-hotel",
  },
  {
    slug: "clinicas",
    name: "clínicas",
    plural: "clínicas dentales, médicas y estéticas",
    keyword: "clínicas",
    description: "clínicas dentales, médicas, fisioterapia, estética y veterinarias",
    pains: ["agenda con huecos", "captación cara en Doctoralia", "reseñas Google bajas", "fuga a clínicas grandes"],
    image: "sectors/clinic",
    ogImage: "og/sector-clinic",
  },
  {
    slug: "gimnasios",
    name: "gimnasios",
    plural: "gimnasios y boutiques fitness",
    keyword: "gimnasios",
    description: "gimnasios, boutiques fitness, CrossFit, yoga y personal training",
    pains: ["churn alto enero", "captación cara", "competencia Basic-Fit", "sin app o portal usuario"],
    image: "sectors/gym",
    ogImage: "og/sector-gym",
  },
  {
    slug: "inmobiliarias",
    name: "inmobiliarias",
    plural: "inmobiliarias y agentes",
    keyword: "inmobiliarias",
    description: "inmobiliarias, agentes y promotoras",
    pains: ["leads caros Idealista/Fotocasa", "ciclo venta lento", "diferenciación cero", "sin CRM ni nurturing"],
    image: "sectors/realestate",
    ogImage: "og/sector-realestate",
  },
  {
    slug: "ecommerce",
    name: "ecommerce",
    plural: "tiendas online y ecommerce",
    keyword: "ecommerce",
    description: "tiendas online, ecommerce, marketplaces y D2C",
    pains: ["CAC subiendo", "ROAS bajo", "carrito abandonado", "sin email marketing"],
    image: "sectors/ecommerce",
    ogImage: "og/sector-ecommerce",
  },
  {
    slug: "academias",
    name: "academias",
    plural: "academias y centros de formación",
    keyword: "academias",
    description: "academias de idiomas, repaso, oposiciones y formación profesional",
    pains: ["captación matrículas estacional", "competencia online masiva", "cero diferenciación", "sin LMS"],
    image: "sectors/academy",
    ogImage: "og/sector-academy",
  },
  {
    slug: "saas",
    name: "SaaS",
    plural: "SaaS y software B2B",
    keyword: "SaaS",
    description: "startups SaaS, software B2B y plataformas digitales",
    pains: ["MRR estancado", "churn >5%", "PMF no validado", "sin onboarding ni nurturing"],
    image: "sectors/saas",
    ogImage: "og/sector-saas",
  },
] as const;

export type Sector = (typeof SECTORES)[number];

export const SERVICIOS = [
  {
    slug: "diseno-web",
    name: "Diseño web",
    keyword: "diseño web",
    description: "Web rápida, segura y optimizada para Google",
    priceFrom: 300,
    image: "services/web",
  },
  {
    slug: "seo",
    name: "SEO",
    keyword: "SEO",
    description: "Posicionamiento orgánico que genera demanda real",
    priceFrom: 300,
    image: "services/seo",
  },
  {
    slug: "redes-sociales",
    name: "Redes sociales",
    keyword: "social media",
    description: "Contenido, comunidad y RRSS que conectan y convierten",
    priceFrom: 300,
    image: "services/social",
  },
  {
    slug: "publicidad-digital",
    name: "Publicidad digital",
    keyword: "publicidad digital",
    description: "Meta Ads y Google Ads con embudos completos",
    priceFrom: 400,
    image: "services/ads",
  },
  {
    slug: "branding",
    name: "Branding",
    keyword: "branding",
    description: "Identidad visual que se recuerda",
    priceFrom: 400,
    image: "services/branding",
  },
] as const;

export type Servicio = (typeof SERVICIOS)[number];

/** Used to assemble keyword targets per programmatic page (NOT for keyword stuffing). */
export function buildKeywordTargets(opts: {
  city?: Ciudad;
  sector?: Sector;
  service?: Servicio;
}): string[] {
  const out: string[] = [];
  if (opts.service && opts.city) {
    out.push(`${opts.service.keyword} en ${opts.city.name}`);
    out.push(`agencia ${opts.service.keyword} ${opts.city.name}`);
  }
  if (opts.service && opts.sector) {
    out.push(`${opts.service.keyword} para ${opts.sector.keyword}`);
    out.push(`agencia ${opts.service.keyword} ${opts.sector.keyword}`);
  }
  if (opts.city && !opts.service) {
    out.push(`agencia digital en ${opts.city.name}`);
    out.push(`agencia marketing ${opts.city.name}`);
    out.push(`marketing digital ${opts.city.name}`);
  }
  if (opts.sector && !opts.service) {
    out.push(`marketing digital para ${opts.sector.keyword}`);
    out.push(`agencia digital ${opts.sector.keyword}`);
  }
  return out;
}
