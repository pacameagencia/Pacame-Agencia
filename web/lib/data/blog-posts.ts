export interface BlogPost {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  dateISO: string;
  color: string;
  agentName: string;
  slug: string;
  featured: boolean;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    title: "7 errores que cometen las PYMEs con su web y como evitarlos",
    excerpt: "El 78% de las pymes espanolas no tiene presencia digital profesional. Tu negocio esta cayendo en alguno de estos errores? Te contamos cuales son y como solucionarlos.",
    category: "Desarrollo Web",
    readTime: "5 min",
    date: "2 abril 2026",
    dateISO: "2026-04-02",
    color: "#06B6D4",
    agentName: "Pixel",
    slug: "7-errores-pymes-web",
    featured: true,
    content: `## 1. No tener web (o tener una de 2015)

El error mas grave y el mas comun. Segun el INE, el 78% de las pymes espanolas no tiene una presencia digital profesional. Si tu web parece sacada de otra epoca, tus clientes potenciales lo notan. En 2026, una web lenta, no responsive o sin SSL es peor que no tener web.

**Solucion:** Una web profesional no tiene que costar 10.000 euros. Con Next.js y un diseno limpio, puedes tener una web rapida y moderna desde 300 euros.

## 2. Web sin SSL (el candadito)

Google penaliza las webs sin HTTPS. Los navegadores muestran "No seguro". El usuario se va. Es un problema tecnico con solucion gratuita (Let's Encrypt) que muchas pymes ignoran.

## 3. Velocidad de carga superior a 3 segundos

Cada segundo de carga extra reduce las conversiones un 7%. Si tu web tarda mas de 3 segundos en cargar, estas perdiendo clientes literalmente. Herramientas como Google PageSpeed Insights te dicen exactamente que arreglar.

## 4. No estar optimizado para movil

El 65% del trafico web en Espana viene de dispositivos moviles. Si tu web no se ve bien en un iPhone, estas ignorando a mas de la mitad de tus visitantes.

## 5. No tener formulario de contacto visible

Si un cliente potencial llega a tu web y no encuentra como contactarte en menos de 5 segundos, se va a la competencia. El formulario de contacto debe estar visible, ser simple y funcionar.

## 6. No tener llamada a la accion (CTA) clara

"Bienvenidos a nuestra web" no es un CTA. "Pide tu presupuesto gratis en 24h" si lo es. Cada pagina necesita un objetivo claro y un boton que lleve al usuario a cumplirlo.

## 7. No medir nada

Si no tienes Google Analytics (o GA4), no sabes cuantas personas visitan tu web, de donde vienen, ni que hacen. Sin datos, cualquier decision de marketing es una apuesta a ciegas.

---

**Quieres saber si tu web tiene alguno de estos errores?** Escribe a PACAME y te hacemos un diagnostico gratuito en 24 horas.`,
  },
  {
    title: "Como pasar de 0 a 1.000 visitas organicas en 90 dias",
    excerpt: "El plan de SEO concreto que usamos con nuestros clientes. Fases, herramientas y metricas reales. Sin humo, sin promesas vacias.",
    category: "SEO",
    readTime: "8 min",
    date: "1 abril 2026",
    dateISO: "2026-04-01",
    color: "#2563EB",
    agentName: "Atlas",
    slug: "0-a-1000-visitas-90-dias",
    featured: true,
    content: `## El plan de 90 dias

Pasar de 0 a 1.000 visitas organicas mensuales es un objetivo realista para cualquier negocio local. Esto es exactamente lo que hacemos con nuestros clientes.

## Mes 1: Fundamentos tecnicos (dias 1-30)

**Semana 1-2: Auditoria y setup**
- Configurar Google Search Console y GA4
- Auditoria tecnica: velocidad, mobile, SSL, indexacion
- Corregir errores criticos (404s, redireciones rotas, meta tags duplicados)

**Semana 3-4: Keyword research**
- Identificar 50-100 keywords relevantes para tu negocio
- Clasificar por intencion: informacional, transaccional, navegacional
- Priorizar: volumen x dificultad = oportunidad

## Mes 2: Contenido estrategico (dias 31-60)

- Publicar 8 articulos optimizados (2 por semana)
- Crear 1 pillar page (articulo largo de +2.000 palabras)
- Optimizar las paginas principales: title, meta description, H1, schema markup
- Internal linking entre articulos y pillar page

## Mes 3: Autoridad y escala (dias 61-90)

- Seguir publicando 2 articulos/semana
- Google Business optimizado con posts semanales
- Buscar 5-10 backlinks de directorios locales y colaboraciones
- Monitorizar rankings y ajustar estrategia

## Metricas reales que esperamos

| Metrica | Mes 1 | Mes 2 | Mes 3 |
|---------|-------|-------|-------|
| Paginas indexadas | 10 | 25 | 40+ |
| Impresiones Search Console | 500 | 3.000 | 10.000+ |
| Clicks organicos | 20 | 150 | 1.000+ |
| Keywords en top 100 | 30 | 100 | 200+ |

---

**Quieres este plan para tu negocio?** PACAME te hace la auditoria SEO gratuita y te dice exactamente por donde empezar.`,
  },
  {
    title: "Meta Ads en 2026: la guia definitiva para PYMEs",
    excerpt: "Todo lo que necesitas saber para lanzar campanas que generen ROI real. Segmentacion, creativos, presupuestos y optimizacion paso a paso.",
    category: "Paid Media",
    readTime: "10 min",
    date: "31 marzo 2026",
    dateISO: "2026-03-31",
    color: "#EA580C",
    agentName: "Nexus",
    slug: "meta-ads-guia-pymes-2026",
    featured: false,
    content: `## Por que Meta Ads sigue siendo el mejor canal para PYMEs

En 2026, Meta (Facebook + Instagram) sigue siendo la plataforma de ads mas efectiva para negocios locales en Espana. El coste por click medio en Espana es de 0.30-0.80 EUR, mucho mas barato que Google Ads para la mayoria de sectores.

## Estructura de campana que funciona

**Nivel 1 — Campana:** Objetivo de conversiones (no trafico, no alcance)
**Nivel 2 — Conjunto de anuncios:** Audiencia + presupuesto + ubicaciones
**Nivel 3 — Anuncios:** 3-5 variaciones de creativos

## Presupuesto minimo realista

- **Test inicial:** 10 EUR/dia durante 14 dias = 140 EUR para validar
- **Escalado:** 20-50 EUR/dia una vez encuentras lo que funciona
- **ROAS objetivo:** 3x minimo (por cada euro invertido, 3 de vuelta)

## Los 3 errores mas comunes

1. **Audiencia demasiado amplia.** Segmenta por ubicacion, edad, intereses Y comportamientos.
2. **Un solo creativo.** Necesitas minimo 3 variaciones para que Meta optimice.
3. **Medir clicks en vez de conversiones.** Instala el Pixel y mide acciones reales.

---

**Quieres que PACAME lance tu primera campana de Meta Ads?** Te hacemos el setup completo y la gestionamos desde 397 EUR/mes.`,
  },
  {
    title: "Por que tu negocio necesita una marca (no solo un logo)",
    excerpt: "La diferencia entre un logo y una marca. Como construir una identidad visual que genere confianza y te diferencie de la competencia.",
    category: "Branding",
    readTime: "6 min",
    date: "30 marzo 2026",
    dateISO: "2026-03-30",
    color: "#7C3AED",
    agentName: "Nova",
    slug: "marca-vs-logo",
    featured: false,
    content: `## Logo != Marca

Un logo es un dibujo. Una marca es como te percibe el mundo. Apple no es una manzana mordida — es innovacion, simplicidad, premium. Tu negocio necesita esa claridad.

## Los 5 pilares de una marca solida

1. **Proposito:** Por que existes (mas alla de ganar dinero)
2. **Identidad visual:** Colores, tipografia, estilo fotografico, logo
3. **Tono de voz:** Como hablas. Formal o cercano. Tecnico o simple.
4. **Experiencia:** Cada punto de contacto con el cliente es marca
5. **Consistencia:** Lo mismo en tu web, en tus redes, en tu tarjeta, en tu local

## El test rapido: tu marca pasa la prueba?

Responde SI o NO:
- Tu web, tu Instagram y tu tarjeta de visita tienen los mismos colores?
- Un cliente sabria que un post es tuyo sin ver el nombre de la cuenta?
- Tienes definido POR ESCRITO como habla tu marca?

Si has respondido NO a alguna, necesitas trabajar tu marca.

---

**Nova, nuestra directora creativa, te ayuda a construir tu marca desde 400 EUR.** Incluye logo, paleta, tipografia y guia de uso.`,
  },
  {
    title: "Calendario editorial para Instagram: plantilla gratuita 2026",
    excerpt: "Descarga nuestra plantilla de calendario editorial para Instagram. Incluye pilares de contenido, formatos y horarios optimos.",
    category: "Redes Sociales",
    readTime: "4 min",
    date: "29 marzo 2026",
    dateISO: "2026-03-29",
    color: "#EC4899",
    agentName: "Pulse",
    slug: "calendario-editorial-instagram-2026",
    featured: false,
    content: `## Por que necesitas un calendario editorial

Publicar "cuando me acuerde" no es una estrategia. Los negocios que publican con consistencia (3-5 veces por semana) ven un 30% mas de engagement que los que publican esporadicamente.

## La estructura que usamos en PACAME

**Lunes:** Carrusel educativo (tips, guias, tutoriales)
**Miercoles:** Reel (tendencia, behind the scenes, tip rapido)
**Viernes:** Post de prueba social (testimonios, resultados, casos)
**Sabado:** Story interactiva (encuesta, quiz, pregunta)

## Pilares de contenido (regla 80/20)

- **40% Educacion:** Tips, tutoriales, guias. El contenido que tu audiencia guarda.
- **25% Entretenimiento:** Memes del sector, trends, behind the scenes.
- **15% Inspiracion:** Casos de exito, transformaciones, frases.
- **20% Promocion:** Tus servicios, ofertas, CTAs directos.

## Horarios optimos en Espana (2026)

- **Feed posts:** 12:00-14:00 y 19:00-21:00
- **Reels:** 18:00-20:00 (maximo alcance)
- **Stories:** 8:00-9:00 y 20:00-22:00

---

**Quieres que Pulse gestione tu Instagram?** Desde 197 EUR/mes. Contenido profesional, publicacion y reporting mensual.`,
  },
  {
    title: "Como elegir la agencia digital correcta para tu empresa",
    excerpt: "Freelancer, agencia tradicional o agencia IA. Pros, contras y cuando elegir cada opcion. Con checklist descargable.",
    category: "Estrategia",
    readTime: "7 min",
    date: "28 marzo 2026",
    dateISO: "2026-03-28",
    color: "#D97706",
    agentName: "Sage",
    slug: "como-elegir-agencia-digital",
    featured: false,
    content: `## Las 3 opciones que tienes

### Opcion 1: Freelancer
**Pros:** Barato, trato directo, flexible
**Contras:** Limitado a una especialidad, puede desaparecer, tiempos impredecibles
**Precio tipico:** 500-3.000 EUR por proyecto
**Ideal para:** Tareas puntuales y sencillas

### Opcion 2: Agencia tradicional
**Pros:** Equipo completo, procesos establecidos, experiencia
**Contras:** Caro, lento, mucha burocracia, junior haciendo el trabajo
**Precio tipico:** 3.000-15.000 EUR por proyecto, 1.000-5.000 EUR/mes retainer
**Ideal para:** Empresas medianas con presupuesto

### Opcion 3: Agencia IA (como PACAME)
**Pros:** Velocidad de IA + supervision humana, equipo completo, precio de freelancer
**Contras:** Modelo nuevo (menos track record historico)
**Precio tipico:** 300-3.000 EUR por proyecto, 197-1.200 EUR/mes
**Ideal para:** PYMEs que quieren calidad de agencia sin el precio

## Checklist: que preguntar antes de contratar

1. Puedo ver portfolio de proyectos similares al mio?
2. Quien trabajara en mi proyecto exactamente?
3. Cual es el plazo de entrega?
4. Que pasa si no me gusta el resultado?
5. Hay permanencia o compromiso minimo?
6. Como mediremos el exito?
7. Que herramientas usais?
8. Como nos comunicaremos?

---

**Quieres una opinion honesta sobre que necesita tu negocio?** Sage, nuestra estratega, te hace un diagnostico gratuito. Sin compromiso.`,
  },
];
