import { createServerSupabase } from "@/lib/supabase/server";
import { sendTelegram } from "@/lib/telegram";
import { routeInput } from "@/lib/neural";
import { generateImage, sendTelegramPhoto, sendTelegramVideo } from "@/lib/telegram-media";
import { sendTelegramDocument } from "@/lib/telegram-media";
import {
  generateMystic,
  upscaleImage,
  removeBackground,
  imageToVideo,
  searchStock,
  generateIcon,
  waitForTask,
  type MysticModel,
} from "@/lib/freepik";
import {
  publishPost as igPublishPost,
  publishCarousel as igPublishCarousel,
  getInsights as igGetInsights,
  getRecentMedia as igGetRecentMedia,
  isConfigured as igIsConfigured,
} from "@/lib/instagram";
import { generateContentImage } from "@/lib/image-generation";
import {
  generateDesign as stitchGenerateDesign,
  editDesign as stitchEditDesign,
  generateVariants as stitchGenerateVariants,
  isStitchConfigured,
} from "@/lib/stitch";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY?.trim();

const SYSTEM_PROMPT = `Eres DIOS, el director creativo y operativo de PACAME — la agencia de marketing digital con IA mas puntera de Espana. Hablas con Pablo Calleja, tu CEO.

Tu diferencia: PIENSAS antes de actuar. Analizas. Tienes criterio. No eres un bot que ejecuta comandos — eres el cerebro estrategico que sabe POR QUE hacer cada cosa.

PERSONALIDAD:
- Espanol de Espana. Tutea. Directo, sin humo.
- Expresiones naturales: "va", "mira", "ojo", "hecho".
- Maximo 2 emojis por mensaje. Nada de parrafos gigantes.
- Cuando ejecutes algo, confirma escueto: "Hecho. Carrusel de 7 slides enviado."

CAPACIDADES COMPLETAS:

VENTAS:
- Leads: consultar, crear, scrapear Google Maps (Apify), auditar webs, nurturing automatico
- Propuestas: generar con IA + enviar por email | Metricas de negocio completas

CONTENIDO (pipeline completo):
- creative_pipeline: genera copy IA + imagen Freepik + preview + publica — TODO en un paso
- Carruseles pro Instagram: 8 tipos de slide, 10 paletas, branding PACAME
- Calendarios editoriales semanales | Posts individuales por plataforma

IMAGENES IA (Freepik Suite):
- Mystic: 6 modelos (realism, fluid, zen, flexible, super_real, editorial_portraits), hasta 4K
- Upscale Magnific: 2x/4x/8x/16x con IA
- Quitar fondo: PNG transparente instantaneo
- Stock: millones de fotos, vectores, mockups, iconos
- Iconos IA: genera desde texto (5 estilos)
- DALL-E 3: fallback para imagenes creativas

VIDEO IA:
- Freepik Kling 2.6 Pro: imagen a video 5-10s (reels, stories, anuncios)

DISENO UI con IA (Google Stitch):
- stitch_design: genera pantallas UI profesionales desde texto (webs, apps, landings, dashboards)
- stitch_edit: edita un diseno existente con instrucciones de texto
- stitch_variants: genera variantes creativas de un diseno existente
- Modelos: Gemini 3 Pro (calidad) o Flash (rapido). Dispositivos: MOBILE, DESKTOP, TABLET
- Devuelve screenshot (imagen) + HTML descargable

INSTAGRAM (API directa):
- Publicar posts y carruseles directamente
- Ver insights: seguidores, alcance, impresiones
- Ver posts recientes con engagement

COMUNICACION:
- Email via Resend | Llamadas IA via Vapi | WhatsApp (n8n)
- Agentes PACAME: ejecutar todos o uno especifico

SERVICIOS PACAME: Web 497€ | Landing 300€ | Ecommerce 997€ | SEO 397€/mes | RRSS 297€/mes | Meta Ads 297€/mes | Google Ads 397€/mes | Branding 497€ | ChatBot 197€/mes

EQUIPO: Sage (estrategia) | Nova (branding) | Atlas (SEO) | Nexus (ads) | Pixel (frontend) | Core (backend) | Pulse (RRSS) | Copy (textos) | Lens (analytics)

CANALES — alterna inteligentemente, NUNCA llamar por defecto:
- Email: contacto frio, propuestas, seguimiento formal
- WhatsApp: seguimiento rapido, tono cercano
- Llamada: SOLO leads calientes (score 4+), cierres, o si Pablo lo pide

REGLAS DE CONDUCTA:
1. UNA accion por peticion. Ejecuta UNA VEZ y bien. No repitas tools en bucle.
2. Usa MAXIMO 1 tool call por turno. Nunca lances 2+ tools en paralelo.
3. Cuando algo se ha generado, PARA. Confirma y espera instrucciones.
4. Si algo falla, dilo claro. No reintentes automaticamente.
5. Maximo 4000 chars por mensaje (limite Telegram). Texto plano, sin markdown.
6. Audio de Pablo llega ya transcrito. Procesalo como texto.

═══════════════════════════════════════════════════
DECISION DE HERRAMIENTAS — PIENSA ANTES DE ACTUAR
═══════════════════════════════════════════════════

Cuando Pablo pide contenido, ELIGE la herramienta correcta:

"hazme un post de X" → creative_pipeline (genera copy + imagen + preview, todo junto)
"hazme un carrusel de X" → generate_carousel (slides con tipografia real)
"genera una imagen de X" → freepik_generate_image (Mystic, la mejor calidad)
"genera un logo/imagen creativa" → generate_and_send_image (DALL-E 3, mas creativo)
"busca fotos de X" → freepik_search_stock (stock real, millones de recursos)
"necesito un icono de X" → freepik_generate_icon (iconos vectoriales IA)
"mejora/escala esta imagen" → freepik_upscale (Magnific, hasta 16x)
"quita el fondo" → freepik_remove_background (PNG transparente)
"haz un video/reel" → freepik_image_to_video (Kling 2.6, 5-10s)
"publica en instagram" → instagram_publish (directo, post o carrusel)
"como va instagram?" → instagram_insights (metricas + posts recientes)
"disena una web/app/landing" → stitch_design (Google Stitch, UI profesional con IA)
"cambia el diseno de X" → stitch_edit (editar pantalla existente)
"dame variantes del diseno" → stitch_variants (explorar alternativas)
"genera un calendario semanal" → generate_content (5 posts lun-vie)
"publica todo lo aprobado" → publish_content (batch publish)

Para IMAGENES: Freepik Mystic > DALL-E 3 > Stock. Usa Mystic por defecto (calidad superior). DALL-E solo si necesitas algo muy creativo/abstracto. Stock solo si Pablo pide algo real/existente.

═══════════════════════════════════════════════════
CARRUSELES INSTAGRAM — MOTOR v3 VIRAL
═══════════════════════════════════════════════════

Motor v3: glass cards, gradientes ricos, barra progreso, nuevos tipos. CALIDAD TOP.

PASO 1 — ESTRATEGIA (piensa, no lo cuentes):
A) Audiencia: dueños pyme, emprendedores, marketers, profesionales?
B) Pilar: educacion (40% - saves), entretenimiento (25% - shares), inspiracion (15%), promo (20%)?
C) Emocion: FOMO, curiosidad, identificacion, ambicion, urgencia?
D) Angulo: lo contraintuitivo, lo especifico, lo que duele. Nada generico.

PASO 2 — COPYWRITING (formula PAS):
- PORTADA = Problem (dolor exacto). MAXIMO 8 PALABRAS.
- SLIDES = Agitate (coste de no actuar).
- CTA = Solve (PACAME es la solucion).

Hooks que PARAN el scroll:
"5 errores que te cuestan 2.000€/mes" | "Tu web vende o solo decora?" | "El 73% de webs PYME no generan ni 1 lead" | "Tu competencia ya hace esto"

PASO 3 — 10 TIPOS DE SLIDE (usa AL MENOS 4 diferentes):
- "cover": portada hook. Titulo grande (74px). badge para categoria. DESLIZA indicator.
- "content": punto en glass card con number badge. Titulo + body.
- "tip": consejo con borde gradiente lateral + icono badge. Para acciones concretas.
- "stat": dato ENORME en glass card (160px gradient number). Para credibilidad.
- "quote": cita en glass card con comilla gradient. Para inspirar/provocar.
- "list": 2-5 items, cada uno en glass card con number badge. Para pasos/listas.
- "highlight": frase dramatica centrada en glass card con glow. Para momentos clave.
- "image_bg": FOTO DE FONDO (Freepik) + overlay oscuro + texto encima. VISUAL. Usa bg_image con URL.
- "comparison": antes/despues con columnas. items = [izq1, izq2, izq3, der1, der2, der3]. Columna izq roja, der verde. Badge VS.
- "cta": cierre con boton gradient + handle. "Guarda esto" > "Siguenos".

Reglas de copy:
- 1 idea por slide. Titulo 4-6 palabras. Body max 18 palabras.
- highlight: SIEMPRE la palabra clave del titulo.
- icon: emoji OBLIGATORIO en cada slide.
- PROHIBIDO generico: "El contenido es el rey", "En la era digital", "Es importante".

PASO 4 — PALETAS (elige segun nicho):
- "dark": premium, tech, finanzas. Violeta + verde. DEFAULT.
- "midnight": elegante. Indigo + rosa.
- "gradient": educativo. Violeta + esmeralda.
- "clean": corporativo, B2B. Violeta + azul cielo.
- "neon": viral, joven. Magenta + cyan.
- "earth": gastro, lifestyle. Ambar + verde.
- "ocean": tech, SaaS. Azul + esmeralda.
- "coral": energia, retail. Rosa + dorado.
- "mono": minimalista, lujo. Grises sobre negro.
- "cream": artesanal, calido. Marron + violeta.

PASO 5 — GENERA con UNA llamada a generate_carousel:
- 7-8 slides sweet spot (1 cover + 5-6 variados + 1 CTA)
- MEZCLA al menos 4 tipos diferentes (variedad visual = mas engagement)
- caption con hook + valor + "Guarda esto" + 5-8 hashtags del nicho
- Para carruseles visuales: usa image_bg en 1-2 slides (genera imagen con freepik_generate_image primero)
- Para comparaciones: usa comparison con 3+3 items

EJEMPLO CARRUSEL VIRAL (estandar minimo):
Tema: "Errores web de pymes" | Estilo: "dark"
1. Cover: title "Tu web te esta costando clientes", badge "MARKETING", icon "🚨", highlight "costando"
2. Stat: stat "73%", statLabel "de las webs pyme", title "No convierten ni una visita en lead", body "Trafico pero cero formularios, cero llamadas", icon "📊"
3. List: title "Los 3 errores mas caros", items ["Sin CTA claro en ninguna pagina", "Carga en mas de 3 segundos", "En movil se ve rota"], icon "💀", highlight "caros"
4. Comparison: title "Web normal vs Web PACAME", items ["0 leads al mes", "Sin formularios", "Movil rota", "15+ leads al mes", "CTA en cada pagina", "Mobile-first"], icon "⚔️"
5. Tip: title "Sin boton, sin cliente", body "Cada pagina necesita UN boton claro. Uno. No tres.", icon "👆", highlight "boton"
6. Stat: stat "3s", statLabel "paciencia maxima", title "Despues se van a tu competencia", icon "⚡"
7. CTA: title "Como esta tu web?", body "Auditoria gratuita en 24h. Sin compromiso.", number "Link en bio →", icon "✅", highlight "gratuita"

MARCA PACAME: brandName "PACAME" | handle "@pacameagencia"

CONTEXTO ACTUAL:
- Fecha: ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Madrid" })}
- Web: pacameagencia.com
- Dashboard: pacameagencia.com/dashboard`;

// ═══════════════════════════════════════════════════════════
//  DEEP PROJECT KNOWLEDGE — baked into every conversation
// ═══════════════════════════════════════════════════════════

const PROJECT_KNOWLEDGE = `
═══════════════════════════════════════════════════
CONOCIMIENTO PROFUNDO DEL PROYECTO PACAME
═══════════════════════════════════════════════════

TU EQUIPO — 10 AGENTES IA ESPECIALIZADOS + 120 SUBESPECIALISTAS:

NOVA (Directora Creativa):
- Branding, identidad visual, design systems, direccion de arte
- Logo & paleta, tipografia, consistencia visual, brand guidelines
- "No hago diseno por estetica — hago diseno que vende"
- Branding standalone: 400-1500 EUR

ATLAS (Estratega SEO):
- SEO tecnico, estrategia contenido organico, keyword research, arquitectura info
- Auditorias SEO, keyword mapping por intencion, Core Web Vitals, link building, local SEO
- Optimiza para conversiones de negocio, NO solo rankings. Siempre conecta SEO a ROI.
- Servicio: 400-1200 EUR/mes

NEXUS (Head of Growth & Paid Media):
- Embudos de venta TOFU-MOFU-BOFU, Meta Ads, Google Ads, CRO, email marketing, A/B testing
- Paid campaigns, email sequences, tracking setup, reducir CAC, aumentar conversiones
- Cierra el loop: ad → landing → email → CTA → close
- Servicio: 400-800 EUR/mes + ad spend; embudo completo 1500-3000 EUR

PIXEL (Lead Frontend & UX/UI):
- Next.js/React, optimizacion UX, performance, accesibilidad WCAG 2.1 AA
- Mobile-first, Core Web Vitals (LCP < 2.5s), shadcn/ui, Framer Motion
- "No hago webs bonitas — hago interfaces que cumplen objetivos de negocio"

CORE (Arquitecto Backend & Systems):
- Arquitectura backend, APIs, bases de datos, integraciones, seguridad, observabilidad
- Serverless, Zod validation, Row Level Security, Stripe/Resend integrations
- "Elige siempre la solucion mas simple que cumpla los requisitos"

PULSE (Head of Social Media):
- Estrategia redes sociales, calendarios editoriales, community management
- Multi-plataforma: Instagram/LinkedIn/TikTok/X
- Content mix: 40% educativo + 25% social proof + 20% marca/equipo + 15% conversion directa
- Servicio: 300-1500 EUR/mes

SAGE (Chief Strategy Officer):
- Diagnostico de negocio, priorizacion estrategica, KPIs, gobernanza proyectos
- Discovery questioning (encuentra causa raiz, no sintomas), roadmaps 30/60/90 dias
- Clasifica problemas: adquisicion / conversion / marca / producto
- "La diferencia entre resolver el problema correcto y el incorrecto es la calidad del diagnostico"

COPY (Head of Copywriting):
- Copywriting persuasivo, landing pages, email sequences, SEO content, propuestas, scripts ads
- Headlines que se sostienen solos, parrafos recortados al maximo, CTAs especificos + activos + con beneficio
- Angulos: dolor, aspiracion, curiosidad, social proof

LENS (Analytics Engineer):
- GA4, conversion tracking, reporting cross-channel, dashboards, attribution modeling
- Meta Pixel + CAPI, GTM, deteccion de anomalias
- "Sin Lens, el equipo trabaja a ciegas. Con Lens, cada agente sabe si sus acciones generan impacto"

DIOS (Orquestador — TU):
- Recibe necesidad → identifica problema REAL → asigna equipo (1 lider + 1-3 apoyo) → coordina entrega
- Escala a Pablo SOLO en: riesgo legal, riesgo financiero, riesgo reputacional, cambio de scope, bloqueadores criticos
- "Resuelve el problema real, no el que el cliente verbaliza al inicio"

IDENTIDAD DE MARCA PACAME:
- Color primario: Electric Violet #7C3AED
- Gradiente: 135deg #7C3AED → #4338CA → #06B6D4
- Fonts: Space Grotesk (titulos) + Inter (body)
- Dark mode default: Background #0D0D0D, Text #F5F5F0
- Tono: Directo, cercano, seguro. Frases cortas. Verbos activos. Cero superlativos vacios.
- Arquetipo: El Mago + El Rebelde (soluciones magicas contra el status quo de agencias tradicionales)
- Tagline: "Tu equipo digital. Sin limites."
- Propuesta: "Cualquier problema digital. Resuelto mas rapido, mejor y mas barato."

5 DIFERENCIALES DE PACAME:
1. Equipo IA especializado (no IA generalista)
2. Interaccion directa con agentes (sin intermediarios)
3. Velocidad radical (dias vs semanas)
4. Precios justos (sin costes inflados)
5. Proveedor unico para todo lo digital

4 TIPOS DE PROBLEMAS QUE RESOLVEMOS:
1. ADQUISICION (no llegan clientes) → Atlas + Nexus lideran
2. CONVERSION (trafico sin ventas) → Nexus + Pixel lideran
3. MARCA (sin confianza/diferenciacion) → Nova + Copy lideran
4. PRODUCTO/OPERACION (procesos caoticos) → Core + Pixel lideran

PIPELINE DE LEAD GEN (proceso completo):
1. Scrapear negocios por ubicacion/nicho → Apify + Google Maps
2. Auto-auditar calidad de su web → Score automatico
3. Puntuar leads 1-100 → 60+ avanzan al pipeline
4. Encontrar emails de decision-makers
5. Generar outreach hiperpersonalizado → Copy
6. Metricas: scrape→qualify 50% | email→open 40% | open→reply 5% | reply→call 30% | call→close 30%

PROCESO DE CONTENIDO:
1. Detectar pilar (educacion 40%, social proof 25%, marca 20%, conversion 15%)
2. Generar copy con angulo (dolor/aspiracion/curiosidad/social proof)
3. Generar imagen IA (Freepik Mystic > DALL-E 3 > Stock)
4. Preview en Telegram → Aprobacion → Publicacion directa en Instagram

STACK TECNICO:
- Frontend: Next.js 15, React 19, TypeScript, TailwindCSS, Radix UI, Framer Motion, shadcn/ui
- Backend: Supabase (Postgres + RLS + Realtime), Stripe (pagos live), Claude API
- Infra: VPS Hostinger 72.62.185.125, Docker, n8n (automaciones), Nginx
- Deploy: Vercel (web), VPS (n8n + voice server)
- APIs activas: Claude, Stripe, Apify, Resend, Vapi (llamadas +34 722 669 381), Telegram, OpenAI, Freepik Suite, Instagram, Google Stitch, Gemini
- Dominio: pacameagencia.com | DNS: Hostinger
- Email: hola@pacameagencia.com (Hostinger + Resend DKIM/SPF)

SOBRE PABLO CALLEJA (tu CEO):
- Fundador y CEO de PACAME. Emprendedor, desarrollador web, gestiona redes sociales.
- Trabaja desde Espana. Habla espanol, tutea. Expresiones naturales.
- Prefiere comunicacion directa, sin humo. Le gusta que las cosas se ejecuten sin preguntarle confirmacion.
- Nunca delegarle tareas — tu ejecutas TODO. Pablo solo proporciona APIs y accesos.
- No preguntar siguiente paso — seguir ejecutando el roadmap sin pedir confirmacion.
`;

const TOOLS = [
  {
    name: "query_leads",
    description: "Consultar leads del sistema. Puede filtrar por estado, score minimo, fuente, o buscar por nombre/email.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filtrar por estado: new, contacted, nurturing, qualified, proposal_sent, won, lost, dormant" },
        min_score: { type: "number", description: "Score minimo (1-5)" },
        search: { type: "string", description: "Buscar por nombre o email" },
        limit: { type: "number", description: "Numero de resultados (default 10)" },
      },
      required: [],
    },
  },
  {
    name: "create_lead",
    description: "Crear un nuevo lead en el sistema. Usar cuando Pablo dice que alguien le ha contactado o quiere registrar un potencial cliente.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Nombre del lead" },
        email: { type: "string", description: "Email" },
        phone: { type: "string", description: "Telefono" },
        business_name: { type: "string", description: "Nombre del negocio" },
        business_type: { type: "string", description: "Tipo de negocio/sector" },
        problem: { type: "string", description: "Que necesita o que problema tiene" },
        budget: { type: "string", description: "Presupuesto si lo menciono" },
        source: { type: "string", description: "De donde viene: telegram, whatsapp, web_form, referral, instagram, etc." },
        score: { type: "number", description: "Score inicial 1-5 basado en la info disponible" },
      },
      required: ["name"],
    },
  },
  {
    name: "generate_proposal",
    description: "Generar una propuesta comercial completa para un lead. Usa Claude para crear diagnostico, solucion, timeline y pricing personalizado.",
    input_schema: {
      type: "object" as const,
      properties: {
        lead_id: { type: "string", description: "UUID del lead" },
        services: {
          type: "array",
          items: { type: "string" },
          description: "Lista de servicios a incluir: web-corporativa, landing-page, ecommerce, seo, redes-sociales, meta-ads, google-ads, branding, chatbot-whatsapp",
        },
        custom_notes: { type: "string", description: "Notas adicionales de Pablo para personalizar la propuesta" },
      },
      required: ["lead_id"],
    },
  },
  {
    name: "query_clients",
    description: "Consultar clientes activos, ver su estado, plan, MRR.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filtrar: onboarding, active, paused, churned" },
        search: { type: "string", description: "Buscar por nombre o negocio" },
        limit: { type: "number", description: "Numero de resultados" },
      },
      required: [],
    },
  },
  {
    name: "query_proposals",
    description: "Ver propuestas existentes, su estado, valores.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filtrar: generating, ready, sent, viewed, accepted, rejected, expired" },
        lead_id: { type: "string", description: "Ver propuestas de un lead especifico" },
        limit: { type: "number", description: "Numero de resultados" },
      },
      required: [],
    },
  },
  {
    name: "business_stats",
    description: "Ver metricas clave del negocio: clientes activos, MRR, leads por estado, propuestas pendientes, contenido pendiente.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "manage_content",
    description: "Ver, aprobar o rechazar contenido pendiente de revision.",
    input_schema: {
      type: "object" as const,
      properties: {
        action: { type: "string", enum: ["list_pending", "approve", "reject"], description: "Accion a realizar" },
        content_id: { type: "string", description: "ID del contenido (para aprobar/rechazar)" },
        rejection_reason: { type: "string", description: "Motivo del rechazo" },
      },
      required: ["action"],
    },
  },
  {
    name: "query_campaigns",
    description: "Ver campanas de ads activas, su rendimiento, gasto.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filtrar: draft, active, paused, completed" },
        client_id: { type: "string", description: "Ver campanas de un cliente" },
      },
      required: [],
    },
  },
  {
    name: "update_lead",
    description: "Actualizar datos de un lead: estado, score, notas.",
    input_schema: {
      type: "object" as const,
      properties: {
        lead_id: { type: "string", description: "UUID del lead" },
        status: { type: "string", description: "Nuevo estado" },
        score: { type: "number", description: "Nuevo score" },
        notes: { type: "string", description: "Notas adicionales" },
      },
      required: ["lead_id"],
    },
  },
  {
    name: "send_proposal",
    description: "Enviar una propuesta ya generada al lead por email.",
    input_schema: {
      type: "object" as const,
      properties: {
        proposal_id: { type: "string", description: "UUID de la propuesta" },
      },
      required: ["proposal_id"],
    },
  },
  {
    name: "generate_and_send_image",
    description: "Generar una imagen CREATIVA con DALL-E 3 (logos, fotos, arte, mockups). NO usar para carruseles de texto — usa generate_carousel para eso.",
    input_schema: {
      type: "object" as const,
      properties: {
        prompt: { type: "string", description: "Descripcion detallada de la imagen a generar. Se especifico con colores, estilo, composicion." },
        size: { type: "string", enum: ["1024x1024", "1792x1024", "1024x1792"], description: "Tamano: cuadrado (1024x1024), horizontal (1792x1024), vertical (1024x1792)" },
        quality: { type: "string", enum: ["standard", "hd"], description: "Calidad: standard o hd" },
        caption: { type: "string", description: "Texto que acompana la imagen en Telegram" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_carousel",
    description: "Generar un carrusel VIRAL profesional para Instagram (1080x1080 PNG). Motor v3 con glass cards, gradientes ricos, barra progreso, y diseno nivel top agencia. 10 tipos de slide, 10 paletas. USAR SIEMPRE para carruseles. NUNCA DALL-E para carruseles. Envia TODOS los slides en UNA sola llamada.",
    input_schema: {
      type: "object" as const,
      properties: {
        slides: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Titulo del slide (4-8 palabras, impactante, verbo activo)" },
              body: { type: "string", description: "Explicacion breve (1 frase de 10-18 palabras)" },
              type: { type: "string", enum: ["cover", "content", "tip", "stat", "quote", "cta", "list", "highlight", "image_bg", "comparison"], description: "Tipo: cover (portada hook), content (punto en glass card), tip (consejo con borde gradiente), stat (dato grande en glass card), quote (cita en glass card), list (items con number badges), highlight (frase dramatica), image_bg (foto fondo + overlay + texto), comparison (antes/despues con VS), cta (cierre)" },
              number: { type: "string", description: "Numero de slide, stat, o texto del boton CTA" },
              icon: { type: "string", description: "Emoji decorativo (OBLIGATORIO en cada slide)" },
              stat: { type: "string", description: "Para type stat: numero grande (ej: 87%, 3x, +200, 3s)" },
              statLabel: { type: "string", description: "Para type stat: etiqueta bajo el numero" },
              items: { type: "array", items: { type: "string" }, description: "Para type list: 2-5 puntos. Para type comparison: mitad izquierda (negativo) + mitad derecha (positivo)" },
              highlight: { type: "string", description: "Palabra clave del titulo a destacar con color accent y subrayado. Usa en la mayoria de slides." },
              bg_image: { type: "string", description: "Para type image_bg: URL de imagen de fondo (Freepik o stock). Se aplica overlay oscuro + texto encima." },
              badge: { type: "string", description: "Para cover: etiqueta tipo categoria (ej: MARKETING, SEO, VENTAS)" },
            },
            required: ["title"],
          },
          description: "7-8 slides ideal. Mezcla AL MENOS 4 tipos diferentes. Slide 1 = cover. Ultimo = cta.",
        },
        style: {
          type: "string",
          enum: ["dark", "midnight", "gradient", "clean", "neon", "earth", "ocean", "coral", "mono", "cream"],
          description: "Estilo visual: dark (premium), midnight (elegante), gradient (educativo), clean (corporativo), neon (viral), earth (calido), ocean (tech), coral (energia), mono (minimalista), cream (artesanal)",
        },
        colors: {
          type: "object",
          properties: {
            primary: { type: "string", description: "Color primario hex" },
            accent: { type: "string", description: "Color acento hex" },
            bg: { type: "string", description: "Color fondo hex" },
          },
          description: "Colores custom (opcional). Sin esto usa la paleta del estilo elegido.",
        },
        brandName: { type: "string", description: "Marca (default: PACAME)" },
        handle: { type: "string", description: "Handle Instagram (default: @pacameagencia)" },
        caption: { type: "string", description: "Caption Instagram: hook + valor + CTA + 5-8 hashtags relevantes del nicho" },
      },
      required: ["slides"],
    },
  },
  {
    name: "initiate_call",
    description: "Hacer una llamada telefonica con IA via Vapi. El agente Sage llama al numero indicado.",
    input_schema: {
      type: "object" as const,
      properties: {
        phone_number: { type: "string", description: "Numero en formato E.164: +34XXXXXXXXX" },
        lead_id: { type: "string", description: "UUID del lead (opcional)" },
        purpose: { type: "string", description: "Proposito de la llamada: follow_up, qualification, demo, closing" },
      },
      required: ["phone_number"],
    },
  },
  {
    name: "send_email",
    description: "Enviar un email personalizado via Resend. Para propuestas, seguimiento, o comunicacion directa.",
    input_schema: {
      type: "object" as const,
      properties: {
        to: { type: "string", description: "Email del destinatario" },
        subject: { type: "string", description: "Asunto del email" },
        body: { type: "string", description: "Cuerpo del email en texto" },
        cta: { type: "string", description: "Texto del boton CTA (opcional)" },
        cta_url: { type: "string", description: "URL del boton CTA (opcional)" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "scrape_leads",
    description: "Scrapear leads de Google Maps por nicho y ciudad usando Apify. Devuelve negocios con nombre, telefono, web, rating.",
    input_schema: {
      type: "object" as const,
      properties: {
        niche: { type: "string", description: "Tipo de negocio: restaurantes, dentistas, gimnasios, etc." },
        city: { type: "string", description: "Ciudad: Madrid, Barcelona, Sevilla, etc." },
        max_results: { type: "number", description: "Maximo de resultados (default 50)" },
      },
      required: ["niche", "city"],
    },
  },
  {
    name: "audit_website",
    description: "Auditar una web de un potencial cliente. Analiza velocidad, SEO, movil, y da un score con oportunidades.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "URL de la web a auditar" },
      },
      required: ["url"],
    },
  },
  {
    name: "generate_content",
    description: "Generar contenido para redes sociales: calendarios semanales o posts individuales.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: { type: "string", enum: ["calendar", "post"], description: "Tipo: calendar (semana completa) o post (individual)" },
        platform: { type: "string", description: "Plataforma: instagram, linkedin, twitter, facebook" },
        topic: { type: "string", description: "Tema o contexto del contenido" },
        client_id: { type: "string", description: "UUID del cliente (opcional)" },
        brand_context: { type: "string", description: "Contexto de marca para personalizar" },
      },
      required: ["type", "topic"],
    },
  },
  {
    name: "publish_content",
    description: "Publicar contenido aprobado en redes sociales.",
    input_schema: {
      type: "object" as const,
      properties: {
        action: { type: "string", enum: ["publish_one", "publish_all_approved"], description: "Publicar uno especifico o todos los aprobados" },
        content_id: { type: "string", description: "UUID del contenido (para publish_one)" },
        platform: { type: "string", description: "Plataforma destino (opcional)" },
      },
      required: ["action"],
    },
  },
  {
    name: "trigger_agents",
    description: "Ejecutar los agentes IA de PACAME. Puede lanzar todos o uno especifico (sage, nova, atlas, nexus, pixel, pulse, copy, core, lens).",
    input_schema: {
      type: "object" as const,
      properties: {
        agent: { type: "string", description: "Agente especifico a ejecutar. Si no se indica, se ejecutan todos." },
      },
      required: [],
    },
  },
  {
    name: "nurture_lead",
    description: "Iniciar una secuencia de nurturing (emails automaticos) para un lead.",
    input_schema: {
      type: "object" as const,
      properties: {
        lead_id: { type: "string", description: "UUID del lead" },
        sequence_id: { type: "string", description: "ID de la secuencia: welcome, follow_up, reactivation" },
      },
      required: ["lead_id", "sequence_id"],
    },
  },
  {
    name: "check_scrape_results",
    description: "Consultar los resultados de un scraping de leads que se lanzo antes.",
    input_schema: {
      type: "object" as const,
      properties: {
        run_id: { type: "string", description: "ID del run de Apify" },
      },
      required: ["run_id"],
    },
  },
  {
    name: "freepik_generate_image",
    description: "Generar imagen IA con Freepik Mystic (calidad superior a DALL-E). Modelos: realism, fluid, zen, flexible, super_real, editorial_portraits. Resoluciones hasta 4K.",
    input_schema: {
      type: "object" as const,
      properties: {
        prompt: { type: "string", description: "Descripcion de la imagen en ingles. Se especifico." },
        model: { type: "string", enum: ["realism", "fluid", "zen", "flexible", "super_real", "editorial_portraits"], description: "Modelo: realism (default, fotos reales), fluid (arte), zen (minimalista), super_real (hiperrealista), editorial_portraits (retratos)" },
        resolution: { type: "string", enum: ["1k", "2k", "4k"], description: "Resolucion (default: 2k)" },
        aspect_ratio: { type: "string", enum: ["square_1_1", "widescreen_16_9", "social_story_9_16", "classic_4_3", "cinematic_21_9"], description: "Ratio (default: square)" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "freepik_upscale",
    description: "Escalar imagen hasta 16x con IA Magnific. Ideal para mejorar logos, fotos de baja calidad, assets de clientes.",
    input_schema: {
      type: "object" as const,
      properties: {
        image_url: { type: "string", description: "URL de la imagen a escalar" },
        scale_factor: { type: "string", enum: ["2x", "4x", "8x", "16x"], description: "Factor de escala (default: 2x)" },
        optimized_for: { type: "string", enum: ["standard", "soft_portraits", "art_n_illustration", "nature_n_landscapes", "films_n_photography"], description: "Optimizar para tipo de imagen" },
      },
      required: ["image_url"],
    },
  },
  {
    name: "freepik_remove_background",
    description: "Quitar fondo de una imagen. Devuelve PNG transparente. Para productos, logos, fotos de equipo.",
    input_schema: {
      type: "object" as const,
      properties: {
        image_url: { type: "string", description: "URL de la imagen" },
      },
      required: ["image_url"],
    },
  },
  {
    name: "freepik_image_to_video",
    description: "Convertir imagen en video animado con IA (Kling 2.6 Pro). Para reels, stories, anuncios. 5 o 10 segundos.",
    input_schema: {
      type: "object" as const,
      properties: {
        image_url: { type: "string", description: "URL de la imagen a animar" },
        prompt: { type: "string", description: "Descripcion del movimiento deseado" },
        duration: { type: "string", enum: ["5", "10"], description: "Duracion en segundos" },
        aspect_ratio: { type: "string", enum: ["widescreen_16_9", "social_story_9_16", "square_1_1"], description: "Ratio de aspecto" },
      },
      required: ["image_url"],
    },
  },
  {
    name: "freepik_search_stock",
    description: "Buscar en la biblioteca stock de Freepik: fotos, vectores, ilustraciones, mockups. Millones de recursos.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Termino de busqueda (en ingles para mejores resultados)" },
        count: { type: "number", description: "Numero de resultados (1-20, default 5)" },
        content_type: { type: "string", enum: ["photo", "vector", "illustration", "psd", "mockup"], description: "Tipo de recurso" },
        orientation: { type: "string", enum: ["horizontal", "vertical", "square"], description: "Orientacion" },
      },
      required: ["query"],
    },
  },
  {
    name: "freepik_generate_icon",
    description: "Generar iconos IA desde texto. Estilos: solid, outline, color, flat, sticker. Para webs, apps, presentaciones.",
    input_schema: {
      type: "object" as const,
      properties: {
        prompt: { type: "string", description: "Descripcion del icono (en ingles)" },
        style: { type: "string", enum: ["solid", "outline", "color", "flat", "sticker"], description: "Estilo del icono (default: flat)" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "instagram_insights",
    description: "Ver metricas de Instagram: seguidores, alcance, impresiones, visitas al perfil. Tambien muestra posts recientes con likes y comentarios.",
    input_schema: {
      type: "object" as const,
      properties: {
        include_posts: { type: "boolean", description: "Incluir los ultimos 10 posts con engagement (default: true)" },
      },
      required: [],
    },
  },
  {
    name: "instagram_publish",
    description: "Publicar directamente en Instagram. Puede publicar un post con imagen o un carrusel de multiples imagenes.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: { type: "string", enum: ["post", "carousel"], description: "Tipo: post (imagen unica) o carousel (multiples)" },
        image_urls: {
          type: "array",
          items: { type: "string" },
          description: "URLs de las imagenes. 1 para post, 2-10 para carousel. Deben ser URLs publicas.",
        },
        caption: { type: "string", description: "Texto del post" },
        hashtags: { type: "string", description: "Hashtags separados por espacio" },
      },
      required: ["type", "image_urls", "caption"],
    },
  },
  {
    name: "stitch_design",
    description: "Generar una pantalla UI profesional con Google Stitch (IA de Google). Para webs, apps, landings, dashboards, formularios. Devuelve screenshot + HTML. Ideal cuando Pablo pide 'disena una web/app/landing de X'.",
    input_schema: {
      type: "object" as const,
      properties: {
        prompt: { type: "string", description: "Descripcion del diseno deseado en ingles. Se especifico: tipo de pagina, elementos, estilo, colores, sector." },
        device_type: { type: "string", enum: ["MOBILE", "DESKTOP", "TABLET", "AGNOSTIC"], description: "Dispositivo: MOBILE (default, ideal para preview), DESKTOP, TABLET, AGNOSTIC" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "stitch_edit",
    description: "Editar un diseno de Stitch existente con instrucciones de texto. Requiere project_id y screen_id del diseno previo.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "ID del proyecto de Stitch" },
        screen_id: { type: "string", description: "ID de la pantalla a editar" },
        edit_prompt: { type: "string", description: "Instrucciones de edicion en ingles (ej: 'change the color scheme to blue and add a contact form')" },
      },
      required: ["project_id", "screen_id", "edit_prompt"],
    },
  },
  {
    name: "stitch_variants",
    description: "Generar variantes creativas de un diseno de Stitch. Devuelve multiples versiones alternativas.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "ID del proyecto de Stitch" },
        screen_id: { type: "string", description: "ID de la pantalla base" },
        prompt: { type: "string", description: "Direccion creativa para las variantes" },
        variant_count: { type: "number", description: "Numero de variantes (1-5, default 3)" },
        creative_range: { type: "string", enum: ["REFINE", "EXPLORE", "REIMAGINE"], description: "REFINE (cambios sutiles), EXPLORE (variaciones moderadas), REIMAGINE (repensar completamente)" },
      },
      required: ["project_id", "screen_id", "prompt"],
    },
  },
  {
    name: "save_memory",
    description: "Guardar algo en la memoria persistente. Usa esto cuando Pablo te diga algo importante que debas recordar: preferencias, datos de su negocio, decisiones, datos de clientes, o cualquier cosa que te pida recordar.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: { type: "string", description: "El dato concreto a recordar. Se especifico y claro." },
        category: { type: "string", enum: ["pablo", "preference", "project", "client", "fact"], description: "Categoria: pablo (datos personales), preference (como le gusta trabajar), project (decisiones negocio), client (info clientes), fact (datos concretos)" },
        importance: { type: "number", description: "Importancia 1-10. 10 = critico, 5 = normal, 1 = trivial" },
        tags: { type: "array", items: { type: "string" }, description: "Tags para busqueda futura" },
      },
      required: ["content", "category"],
    },
  },
  {
    name: "recall_memory",
    description: "Buscar en la memoria persistente. Usa esto cuando necesites recordar algo que Pablo dijo antes, datos de un cliente, preferencias, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Que buscar en la memoria" },
        category: { type: "string", enum: ["pablo", "preference", "project", "client", "fact"], description: "Filtrar por categoria (opcional)" },
      },
      required: ["query"],
    },
  },
  {
    name: "self_reflect",
    description: "Reflexionar sobre tus memorias acumuladas y generar insights profundos. Usa esto cuando quieras entender patrones, conexiones entre clientes, tendencias del negocio, o cuando Pablo te pida que analices lo que has aprendido.",
    input_schema: {
      type: "object" as const,
      properties: {
        focus: { type: "string", description: "Area de reflexion: 'clients' (patrones entre clientes), 'pablo' (preferencias/estilo de trabajo), 'business' (estado y tendencias del negocio), 'content' (que contenido funciona mejor), 'general' (reflexion abierta)" },
        depth: { type: "string", enum: ["quick", "deep"], description: "quick: resumen rapido. deep: analisis profundo con conexiones y recomendaciones." },
      },
      required: ["focus"],
    },
  },
  {
    name: "consolidate_knowledge",
    description: "Consolidar y optimizar la red neuronal de memorias. Fusiona duplicados, actualiza importancias, genera meta-memorias con patrones detectados. Usar periodicamente o cuando Pablo lo pida.",
    input_schema: {
      type: "object" as const,
      properties: {
        action: { type: "string", enum: ["analyze", "merge_duplicates", "generate_insights", "full"], description: "analyze: ver estado actual. merge_duplicates: fusionar memorias similares. generate_insights: crear meta-memorias. full: todo el proceso." },
      },
      required: ["action"],
    },
  },
  {
    name: "creative_pipeline",
    description: "Pipeline creativo completo: genera imagen IA con Freepik + crea post con copy IA + opcionalmente publica. Todo en un paso. Para cuando Pablo dice 'hazme un post de X'.",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: { type: "string", description: "Tema del post (ej: 'tips para mejorar tu web', '5 errores SEO')" },
        platform: { type: "string", enum: ["instagram", "linkedin", "facebook", "twitter"], description: "Plataforma destino (default: instagram)" },
        image_style: { type: "string", enum: ["realism", "fluid", "zen", "flexible"], description: "Estilo de la imagen IA (default: realism)" },
        publish: { type: "boolean", description: "Publicar directamente en la plataforma (default: false, solo preview)" },
        brand_context: { type: "string", description: "Contexto de marca para personalizar (ej: nombre del cliente)" },
      },
      required: ["topic"],
    },
  },
];

// Tool execution
async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  const supabase = createServerSupabase();

  switch (name) {
    case "query_leads": {
      let query = supabase.from("leads").select("id, name, email, phone, business_name, score, status, source, created_at").order("created_at", { ascending: false });
      if (input.status) query = query.eq("status", input.status as string);
      if (input.min_score) query = query.gte("score", input.min_score as number);
      if (input.search) query = query.or(`name.ilike.%${input.search}%,email.ilike.%${input.search}%,business_name.ilike.%${input.search}%`);
      const { data, error } = await query.limit((input.limit as number) || 10);
      if (error) return `Error: ${error.message}`;
      if (!data?.length) return "No se encontraron leads con esos criterios.";
      return data.map((l) =>
        `- ${l.name}${l.business_name ? ` (${l.business_name})` : ""} | Score: ${l.score}/5 | Estado: ${l.status} | Fuente: ${l.source || "?"} | ${new Date(l.created_at).toLocaleDateString("es-ES")}${l.email ? ` | ${l.email}` : ""}${l.phone ? ` | ${l.phone}` : ""} | ID: ${l.id}`
      ).join("\n");
    }

    case "create_lead": {
      const { data, error } = await supabase.from("leads").insert({
        name: input.name as string,
        email: (input.email as string) || null,
        phone: (input.phone as string) || null,
        business_name: (input.business_name as string) || null,
        business_type: (input.business_type as string) || null,
        problem: (input.problem as string) || null,
        budget: (input.budget as string) || null,
        source: (input.source as string) || "telegram",
        score: (input.score as number) || 3,
        status: "new",
      }).select("id, name, score").single();
      if (error) return `Error creando lead: ${error.message}`;
      return `Lead creado: ${data.name} (Score: ${data.score}/5). ID: ${data.id}`;
    }

    case "generate_proposal": {
      const leadId = input.lead_id as string;
      const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
      if (!lead) return "Lead no encontrado con ese ID.";

      const SERVICE_CATALOG: Record<string, { name: string; price: number; type: string; timeline: string }> = {
        "web-corporativa": { name: "Web Corporativa", price: 497, type: "onetime", timeline: "5-10 dias" },
        "landing-page": { name: "Landing Page", price: 300, type: "onetime", timeline: "3-5 dias" },
        "ecommerce": { name: "E-commerce", price: 997, type: "onetime", timeline: "10-15 dias" },
        "seo": { name: "SEO Posicionamiento", price: 397, type: "monthly", timeline: "resultados en 60-90 dias" },
        "redes-sociales": { name: "Gestion Redes Sociales", price: 297, type: "monthly", timeline: "resultados en 30 dias" },
        "meta-ads": { name: "Meta Ads", price: 297, type: "monthly", timeline: "resultados en 7 dias" },
        "google-ads": { name: "Google Ads", price: 397, type: "monthly", timeline: "resultados en 14 dias" },
        "branding": { name: "Branding Completo", price: 497, type: "onetime", timeline: "7-10 dias" },
        "chatbot-whatsapp": { name: "ChatBot WhatsApp", price: 197, type: "monthly", timeline: "3-5 dias setup" },
      };

      const requestedServices = (input.services as string[]) || [];
      const sageRecs = (lead.sage_analysis as Record<string, unknown>)?.recommended_services as string[] || [];
      const serviceKeys = requestedServices.length > 0 ? requestedServices : sageRecs;

      const services: { name: string; price: number; type: string; timeline: string }[] = [];
      let totalOnetime = 0;
      let totalMonthly = 0;

      for (const key of serviceKeys) {
        const match = SERVICE_CATALOG[key] || Object.values(SERVICE_CATALOG).find(
          (s) => s.name.toLowerCase().includes(key.toLowerCase())
        );
        if (match) {
          services.push(match);
          if (match.type === "onetime") totalOnetime += match.price;
          else totalMonthly += match.price;
        }
      }

      // Generate with Claude
      let proposalContent = null;
      if (CLAUDE_API_KEY) {
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": CLAUDE_API_KEY,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 2000,
              messages: [{
                role: "user",
                content: `Genera una propuesta comercial para:
- Nombre: ${lead.name}
- Empresa: ${lead.business_name || "No especificado"}
- Problema: ${lead.problem || "No indicado"}
- Score: ${lead.score}/5
- Servicios: ${services.map((s) => s.name).join(", ") || "Por determinar"}
${input.custom_notes ? `- Notas de Pablo: ${input.custom_notes}` : ""}

Responde SOLO JSON:
{"title":"titulo","greeting":"saludo personalizado","diagnosis":["punto 1","punto 2","punto 3"],"solution":["paso 1","paso 2"],"timeline":[{"week":"Semana 1","tasks":"..."}],"deliverables":["entregable 1"],"guarantee":"garantia","cta":"siguiente paso"}`,
              }],
            }),
          });
          const data = await res.json();
          const text = data.content?.[0]?.text || "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) proposalContent = JSON.parse(jsonMatch[0]);
        } catch { /* continue without AI content */ }
      }

      const { data: proposal, error } = await supabase.from("proposals").insert({
        lead_id: leadId,
        brief_original: lead.problem || `Propuesta para ${lead.business_name || lead.name}`,
        sage_analysis: proposalContent || { title: `Propuesta para ${lead.business_name || lead.name}` },
        services_proposed: services.map((s) => ({ name: s.name, price: s.price, type: s.type })),
        total_onetime: totalOnetime,
        total_monthly: totalMonthly,
        status: "ready",
      }).select("id").single();

      if (error) return `Error creando propuesta: ${error.message}`;
      return `Propuesta generada para ${lead.name}.\nServicios: ${services.map((s) => `${s.name} (${s.price}EUR)`).join(", ")}\nTotal: ${totalOnetime}EUR unico + ${totalMonthly}EUR/mes\nID: ${proposal.id}\nURL: https://pacameagencia.com/propuesta/${proposal.id}\n\nPuedo enviarla por email si me dices.`;
    }

    case "query_clients": {
      let query = supabase.from("clients").select("id, name, business_name, plan, monthly_fee, status, email, phone, created_at").order("created_at", { ascending: false });
      if (input.status) query = query.eq("status", input.status as string);
      if (input.search) query = query.or(`name.ilike.%${input.search}%,business_name.ilike.%${input.search}%`);
      const { data, error } = await query.limit((input.limit as number) || 10);
      if (error) return `Error: ${error.message}`;
      if (!data?.length) return "No se encontraron clientes.";
      return data.map((c) =>
        `- ${c.business_name || c.name} | Plan: ${c.plan || "sin plan"} | ${c.monthly_fee || 0}EUR/mes | Estado: ${c.status}${c.email ? ` | ${c.email}` : ""} | ID: ${c.id}`
      ).join("\n");
    }

    case "query_proposals": {
      let query = supabase.from("proposals").select("id, lead_id, status, total_onetime, total_monthly, services_proposed, created_at, sent_at, viewed_at").order("created_at", { ascending: false });
      if (input.status) query = query.eq("status", input.status as string);
      if (input.lead_id) query = query.eq("lead_id", input.lead_id as string);
      const { data, error } = await query.limit((input.limit as number) || 10);
      if (error) return `Error: ${error.message}`;
      if (!data?.length) return "No se encontraron propuestas.";
      return data.map((p) => {
        const svcs = (p.services_proposed as Array<{ name: string }>) || [];
        return `- ${svcs.map((s) => s.name).join(", ") || "Sin servicios"} | ${p.total_onetime}EUR + ${p.total_monthly}EUR/mes | Estado: ${p.status} | ${new Date(p.created_at).toLocaleDateString("es-ES")} | ID: ${p.id}`;
      }).join("\n");
    }

    case "business_stats": {
      const [clients, leads, proposals, content, campaigns] = await Promise.all([
        supabase.from("clients").select("status, monthly_fee"),
        supabase.from("leads").select("status, score"),
        supabase.from("proposals").select("status"),
        supabase.from("content").select("status"),
        supabase.from("ad_campaigns").select("status, budget_spent"),
      ]);

      const activeClients = (clients.data || []).filter((c) => c.status === "active");
      const mrr = activeClients.reduce((sum, c) => sum + (Number(c.monthly_fee) || 0), 0);
      const allLeads = leads.data || [];
      const hotLeads = allLeads.filter((l) => l.score >= 4 && !["won", "lost"].includes(l.status));
      const allProposals = proposals.data || [];
      const pendingContent = (content.data || []).filter((c) => c.status === "pending_review");
      const activeCampaigns = (campaigns.data || []).filter((c) => c.status === "active");
      const totalAdSpend = (campaigns.data || []).reduce((sum, c) => sum + (Number(c.budget_spent) || 0), 0);

      return [
        `CLIENTES: ${activeClients.length} activos | MRR: ${mrr.toLocaleString("es-ES")}EUR`,
        `LEADS: ${allLeads.length} total | ${hotLeads.length} calientes (score>=4) | ${allLeads.filter((l) => l.status === "new").length} nuevos`,
        `PROPUESTAS: ${allProposals.length} total | ${allProposals.filter((p) => p.status === "ready").length} listas | ${allProposals.filter((p) => p.status === "sent").length} enviadas | ${allProposals.filter((p) => p.status === "accepted").length} aceptadas`,
        `CONTENIDO: ${pendingContent.length} pendiente de revision`,
        `ADS: ${activeCampaigns.length} campanas activas | ${totalAdSpend.toLocaleString("es-ES")}EUR gastado total`,
      ].join("\n");
    }

    case "manage_content": {
      const action = input.action as string;
      if (action === "list_pending") {
        const { data, error } = await supabase.from("content")
          .select("id, title, platform, content_type, body, client_id, created_at")
          .eq("status", "pending_review")
          .order("created_at", { ascending: false })
          .limit(5);
        if (error) return `Error: ${error.message}`;
        if (!data?.length) return "No hay contenido pendiente de revision.";
        return data.map((c) =>
          `- [${c.platform}/${c.content_type}] ${c.title || "Sin titulo"}\n  "${(c.body || "").slice(0, 100)}..."\n  ID: ${c.id}`
        ).join("\n\n");
      }
      if (action === "approve" && input.content_id) {
        const { error } = await supabase.from("content").update({ status: "approved" }).eq("id", input.content_id as string);
        if (error) return `Error: ${error.message}`;
        return "Contenido aprobado.";
      }
      if (action === "reject" && input.content_id) {
        const { error } = await supabase.from("content").update({
          status: "rejected",
          rejection_reason: (input.rejection_reason as string) || "Rechazado por Pablo",
        }).eq("id", input.content_id as string);
        if (error) return `Error: ${error.message}`;
        return "Contenido rechazado.";
      }
      return "Accion no reconocida. Usa: list_pending, approve, reject.";
    }

    case "query_campaigns": {
      let query = supabase.from("ad_campaigns")
        .select("id, campaign_name, platform, status, budget_daily, budget_total, budget_spent, performance, client_id")
        .order("created_at", { ascending: false });
      if (input.status) query = query.eq("status", input.status as string);
      if (input.client_id) query = query.eq("client_id", input.client_id as string);
      const { data, error } = await query.limit(10);
      if (error) return `Error: ${error.message}`;
      if (!data?.length) return "No se encontraron campanas.";
      return data.map((c) => {
        const perf = (c.performance || {}) as Record<string, number>;
        return `- ${c.campaign_name} [${c.platform}] | Estado: ${c.status} | Gastado: ${c.budget_spent}/${c.budget_total}EUR${perf.clicks ? ` | ${perf.clicks} clicks` : ""}${perf.conversions ? ` | ${perf.conversions} conv` : ""}${perf.roas ? ` | ROAS: ${perf.roas}x` : ""} | ID: ${c.id}`;
      }).join("\n");
    }

    case "update_lead": {
      const leadId = input.lead_id as string;
      const update: Record<string, unknown> = {};
      if (input.status) update.status = input.status;
      if (input.score) update.score = input.score;
      if (Object.keys(update).length === 0) return "Nada que actualizar.";
      update.updated_at = new Date().toISOString();
      const { error } = await supabase.from("leads").update(update).eq("id", leadId);
      if (error) return `Error: ${error.message}`;
      return `Lead ${leadId} actualizado: ${Object.entries(update).filter(([k]) => k !== "updated_at").map(([k, v]) => `${k}=${v}`).join(", ")}`;
    }

    case "send_proposal": {
      const proposalId = input.proposal_id as string;
      const { data: proposal } = await supabase
        .from("proposals")
        .select("*, leads(name, email, business_name)")
        .eq("id", proposalId)
        .single();
      if (!proposal) return "Propuesta no encontrada.";

      const lead = (proposal as Record<string, unknown>).leads as { name: string; email: string; business_name: string } | null;
      if (!lead?.email) return `El lead ${lead?.name || "?"} no tiene email. Necesito un email para enviar la propuesta.`;

      await supabase.from("proposals").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        preview_web_url: `https://pacameagencia.com/propuesta/${proposalId}`,
      }).eq("id", proposalId);

      // Send email via internal API
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
        await fetch(`${baseUrl}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: lead.email,
            subject: `${lead.name}, tu propuesta de PACAME esta lista`,
            template: "proposal",
            data: { proposal_id: proposalId, lead_name: lead.name },
          }),
        });
      } catch {
        // Email sending is non-blocking
      }

      return `Propuesta enviada a ${lead.name} (${lead.email}). URL: https://pacameagencia.com/propuesta/${proposalId}`;
    }

    case "generate_and_send_image": {
      const prompt = input.prompt as string;
      const size = (input.size as "1024x1024" | "1792x1024" | "1024x1792") || "1024x1024";
      const quality = (input.quality as "standard" | "hd") || "standard";
      const caption = (input.caption as string) || "";

      const imageUrl = await generateImage(prompt, { size, quality });
      if (!imageUrl) return "Error: no se pudo generar la imagen. Verifica que OPENAI_API_KEY este configurada.";

      const sent = await sendTelegramPhoto(imageUrl, caption);
      if (!sent) return "Imagen generada pero no se pudo enviar por Telegram.";

      return `Imagen generada y enviada por Telegram. Prompt: "${prompt.slice(0, 100)}..."`;
    }

    case "generate_carousel": {
      const slides = input.slides as Array<{ title: string; body?: string; type?: string; number?: string; icon?: string; stat?: string; statLabel?: string; items?: string[]; highlight?: string; bg_image?: string; badge?: string }>;
      const style = (input.style as string) || "dark";
      const colors = input.colors as { primary?: string; accent?: string; bg?: string } | undefined;
      const brandName = (input.brandName as string) || "PACAME";
      const handle = (input.handle as string) || "@pacameagencia";
      const caption = (input.caption as string) || "";

      if (!slides?.length) return "Error: no se proporcionaron slides.";
      if (slides.length > 15) return "Error: maximo 15 slides por carrusel.";

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
      let successCount = 0;

      await sendTelegram(`Generando carrusel de ${slides.length} slides (estilo: ${style})...`);

      for (let i = 0; i < slides.length; i++) {
        try {
          const res = await fetch(`${baseUrl}/api/carousel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slides, style, colors, brandName, handle, slideIndex: i }),
          });

          if (!res.ok) continue;

          const imageBuffer = Buffer.from(await res.arrayBuffer());
          const slideCaption = i === 0 && caption
            ? caption
            : `${i + 1}/${slides.length}`;

          await sendTelegramPhoto(imageBuffer, slideCaption);
          successCount++;
        } catch {
          // continue with next slide
        }
      }

      if (successCount === 0) return "Error: no se pudo generar ningun slide. Revisa los logs.";
      return `Carrusel enviado: ${successCount}/${slides.length} slides. Estilo: ${style}. Listos para descargar y subir a Instagram.`;
    }

    case "initiate_call": {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
      const cronSecret = process.env.CRON_SECRET;
      try {
        const res = await fetch(`${baseUrl}/api/calls`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
          },
          body: JSON.stringify({
            action: "initiate",
            phone_number: input.phone_number,
            lead_id: input.lead_id || undefined,
            purpose: input.purpose || "follow_up",
          }),
        });
        const data = await res.json();
        if (!res.ok) return `Error iniciando llamada: ${data.error || res.status}`;
        return `Llamada iniciada a ${input.phone_number}. SID: ${data.call_sid}. Estado: ${data.status}`;
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "send_email": {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
      try {
        const res = await fetch(`${baseUrl}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            to: input.to,
            subject: input.subject,
            body: input.body,
            cta: input.cta || undefined,
            cta_url: input.cta_url || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) return `Error enviando email: ${data.error || res.status}`;
        return `Email enviado a ${input.to}. Asunto: "${input.subject}". ID: ${data.email_id}`;
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "scrape_leads": {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
      const cronSecret = process.env.CRON_SECRET;
      try {
        const res = await fetch(`${baseUrl}/api/leadgen`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
          },
          body: JSON.stringify({
            action: "scrape",
            niche: input.niche,
            city: input.city,
            maxResults: input.max_results || 50,
          }),
        });
        const data = await res.json();
        if (!res.ok) return `Error scrapeando: ${data.error || res.status}`;
        return `Scraping iniciado: "${input.niche}" en ${input.city}. Run ID: ${data.runId}. Estado: ${data.status}. Usa check_scrape_results con este runId cuando quieras ver los resultados (tarda 1-3 min).`;
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "check_scrape_results": {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
      const cronSecret = process.env.CRON_SECRET;
      try {
        const res = await fetch(`${baseUrl}/api/leadgen`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
          },
          body: JSON.stringify({ action: "results", runId: input.run_id }),
        });
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error || res.status}`;
        if (data.status === "running") return "El scraping sigue en marcha. Prueba de nuevo en 1-2 minutos.";
        if (!data.leads?.length) return "Scraping completado pero no se encontraron resultados.";
        const summary = data.leads.slice(0, 10).map((l: { name: string; phone?: string; website?: string; rating?: number; reviews?: number }) =>
          `- ${l.name}${l.phone ? ` | ${l.phone}` : ""}${l.website ? ` | ${l.website}` : ""} | Rating: ${l.rating || "?"} (${l.reviews || 0} reviews)`
        ).join("\n");
        return `Encontrados ${data.total} negocios. Top 10:\n${summary}\n\nPuedo guardarlos como leads si quieres.`;
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "audit_website": {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
      const cronSecret = process.env.CRON_SECRET;
      try {
        const res = await fetch(`${baseUrl}/api/leadgen`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
          },
          body: JSON.stringify({ action: "audit", url: input.url }),
        });
        const data = await res.json();
        if (!res.ok) return `Error auditando: ${data.error || res.status}`;
        return `Auditoria de ${data.url}:\n- Score: ${data.score}/100\n- Velocidad: ${data.loadTime ? `${data.loadTime}ms` : "no medida"}\n- Oportunidad: ${data.opportunity}/10\n- Problemas: ${(data.issues || []).join(", ") || "ninguno detectado"}`;
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "generate_content": {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
      const cronSecret = process.env.CRON_SECRET;
      const contentType = input.type as string;
      try {
        const action = contentType === "calendar" ? "generate_calendar" : "generate_post";
        const res = await fetch(`${baseUrl}/api/content`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
          },
          body: JSON.stringify({
            action,
            platform: input.platform || "instagram",
            topic: input.topic,
            client_id: input.client_id || undefined,
            brand_context: input.brand_context || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) return `Error generando contenido: ${data.error || res.status}`;
        if (contentType === "calendar") {
          return `Calendario generado: ${data.posts_saved || 0} posts guardados. Tokens usados: ${data.tokens || 0}.`;
        }
        const post = data.post || {};
        return `Post generado:\n- Titulo: ${post.title || "sin titulo"}\n- Plataforma: ${post.platform || input.platform || "instagram"}\n- Contenido: ${(post.body || post.caption || "").slice(0, 300)}...\n\nEsta guardado como pendiente de revision.`;
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "publish_content": {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
      const cronSecret = process.env.CRON_SECRET;
      const action = input.action as string;
      try {
        const body = action === "publish_all_approved"
          ? { action: "publish_approved" }
          : { action: "publish", content_id: input.content_id, platform: input.platform || undefined };
        const res = await fetch(`${baseUrl}/api/social/publish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) return `Error publicando: ${data.error || res.status}`;
        if (action === "publish_all_approved") {
          return `Publicacion masiva: ${data.published || 0} publicados, ${data.failed || 0} fallidos.`;
        }
        return `Contenido publicado en ${data.platform || "red social"}. Metodo: ${data.method || "api"}.`;
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "trigger_agents": {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
      const cronSecret = process.env.CRON_SECRET;
      try {
        const body = input.agent ? { agent: input.agent } : {};
        const res = await fetch(`${baseUrl}/api/agents/cron`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) return `Error ejecutando agentes: ${data.error || res.status}`;
        return `Agentes ejecutados${input.agent ? ` (${input.agent})` : " (todos)"}. Resultado: ${JSON.stringify(data).slice(0, 500)}`;
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "nurture_lead": {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pacameagencia.com";
      const cronSecret = process.env.CRON_SECRET;
      try {
        const res = await fetch(`${baseUrl}/api/nurture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
          },
          body: JSON.stringify({
            action: "enqueue",
            lead_id: input.lead_id,
            sequence_id: input.sequence_id,
          }),
        });
        const data = await res.json();
        if (!res.ok) return `Error: ${data.error || res.status}`;
        return `Secuencia "${data.sequence}" iniciada para el lead. ${data.emails_total} emails programados. Primer email: "${data.first_email_subject}"`;
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "freepik_generate_image": {
      try {
        await sendTelegram("Generando imagen con Freepik Mystic...");
        const task = await generateMystic(input.prompt as string, {
          model: (input.model as MysticModel) || "realism",
          resolution: (input.resolution as "1k" | "2k" | "4k") || "2k",
          aspect_ratio: (input.aspect_ratio as "square_1_1") || "square_1_1",
        });
        const result = await waitForTask(`/ai/mystic/${task.task_id}`);
        if (result.status === "FAILED") return "Error: la generacion fallo. Intenta con otro prompt.";
        const urls = result.generated || [];
        if (urls.length > 0) {
          await sendTelegramPhoto(urls[0], `Freepik Mystic | ${(input.prompt as string).slice(0, 100)}`);
          return `Imagen generada con Mystic (${input.model || "realism"}). URL: ${urls[0]}`;
        }
        return "Imagen generada pero sin URL. Revisa el task_id: " + task.task_id;
      } catch (err) {
        return `Error Freepik Mystic: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "freepik_upscale": {
      try {
        await sendTelegram(`Escalando imagen ${input.scale_factor || "2x"}...`);
        // Fetch image and convert to base64
        const imgRes = await fetch(input.image_url as string);
        const imgBuf = Buffer.from(await imgRes.arrayBuffer());
        const base64 = imgBuf.toString("base64");
        const task = await upscaleImage(base64, {
          scale_factor: (input.scale_factor as "2x" | "4x" | "8x" | "16x") || "2x",
          optimized_for: (input.optimized_for as "standard") || "standard",
        });
        const result = await waitForTask(`/ai/image-upscaler/${task.task_id}`, 30);
        if (result.status === "FAILED") return "Error: el upscale fallo.";
        const urls = result.generated || [];
        if (urls.length > 0) {
          await sendTelegramPhoto(urls[0], `Upscale ${input.scale_factor || "2x"} completado`);
          return `Imagen escalada ${input.scale_factor || "2x"}. URL: ${urls[0]}`;
        }
        return "Upscale completado pero sin URL.";
      } catch (err) {
        return `Error Freepik Upscale: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "freepik_remove_background": {
      try {
        await sendTelegram("Quitando fondo...");
        const result = await removeBackground(input.image_url as string);
        if (result.high_resolution || result.url) {
          const url = result.high_resolution || result.url;
          await sendTelegramPhoto(url, "Fondo eliminado (PNG transparente)");
          return `Fondo eliminado. URLs (validas 5 min):\n- Alta res: ${result.high_resolution}\n- Preview: ${result.preview}`;
        }
        return "Fondo eliminado pero sin URL en la respuesta.";
      } catch (err) {
        return `Error Remove BG: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "freepik_image_to_video": {
      try {
        await sendTelegram(`Generando video de ${input.duration || "5"}s desde imagen...`);
        const task = await imageToVideo(input.image_url as string, {
          prompt: input.prompt as string,
          duration: (input.duration as "5" | "10") || "5",
          aspect_ratio: (input.aspect_ratio as "widescreen_16_9") || "widescreen_16_9",
        });
        // Videos take longer — poll with longer intervals
        const result = await waitForTask(`/ai/image-to-video/kling-v2-6-pro/${task.task_id}`, 36, 10000);
        if (result.status === "FAILED") return "Error: la generacion de video fallo.";
        const urls = result.generated || [];
        if (urls.length > 0) {
          await sendTelegramVideo(urls[0], `Video IA (${input.duration || "5"}s) — Freepik Kling 2.6 Pro`);
          return `Video generado y enviado (${input.duration || "5"}s). URL: ${urls[0]}`;
        }
        return `Video en proceso. Task ID: ${task.task_id}. Puede tardar unos minutos mas.`;
      } catch (err) {
        if (err instanceof Error && err.message.includes("timed out")) {
          return "El video esta tardando mas de lo esperado. Se esta generando en segundo plano. Prueba de nuevo en unos minutos.";
        }
        return `Error Freepik Video: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "freepik_search_stock": {
      const query = input.query as string;
      const count = Math.min((input.count as number) || 5, 20);
      try {
        const result = await searchStock(query, {
          per_page: count,
          order_by: "popular",
          content_type: (input.content_type as "photo") || undefined,
          orientation: (input.orientation as "horizontal") || undefined,
        });
        if (!result.data?.length) return `No se encontraron recursos para "${query}".`;
        const items = result.data.map((r, i) =>
          `${i + 1}. ${r.title} (${r.width}x${r.height}) | ${r.license} | ${r.content_type}\n   ${r.url}`
        ).join("\n");
        return `Encontrados ${result.meta.total} recursos para "${query}". Top ${result.data.length}:\n\n${items}`;
      } catch (err) {
        return `Error Freepik Stock: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "freepik_generate_icon": {
      try {
        await sendTelegram("Generando icono...");
        const task = await generateIcon(input.prompt as string, (input.style as "flat") || "flat");
        const result = await waitForTask(`/ai/text-to-icon/${task.task_id}`);
        if (result.status === "FAILED") return "Error generando icono.";
        const urls = result.generated || [];
        if (urls.length > 0) {
          await sendTelegramPhoto(urls[0], `Icono: ${(input.prompt as string).slice(0, 50)}`);
          return `Icono generado. URL: ${urls[0]}`;
        }
        return "Icono generado. Task ID: " + task.task_id;
      } catch (err) {
        return `Error Freepik Icon: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "instagram_insights": {
      try {
        if (!igIsConfigured()) return "Instagram no configurado. Necesito el OAuth access token. Ve a pacameagencia.com/api/instagram/callback para conectar la cuenta.";
        const includePosts = input.include_posts !== false;
        const insights = await igGetInsights();
        let msg = "";
        if (insights.success && insights.data) {
          msg = `INSTAGRAM INSIGHTS:\n- Seguidores: ${insights.data.followers}\n- Alcance: ${insights.data.reach}\n- Impresiones: ${insights.data.impressions}\n- Visitas perfil: ${insights.data.profileViews}`;
        } else {
          msg = `No se pudieron obtener insights: ${insights.error || "sin datos"}`;
        }
        if (includePosts) {
          const media = await igGetRecentMedia(10);
          if (media.success && media.posts?.length) {
            msg += "\n\nULTIMOS POSTS:";
            for (const p of media.posts) {
              msg += `\n- ${p.caption?.slice(0, 60) || "sin caption"} | ${p.likeCount} likes | ${p.commentsCount} comments | ${new Date(p.timestamp).toLocaleDateString("es-ES")}`;
            }
          }
        }
        return msg;
      } catch (err) {
        return `Error Instagram: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "instagram_publish": {
      try {
        if (!igIsConfigured()) return "Instagram no configurado. Necesito el OAuth access token.";
        const imageUrls = input.image_urls as string[];
        const caption = input.caption as string;
        const hashtags = (input.hashtags as string) || "";
        const type = input.type as string;

        if (type === "carousel" && imageUrls.length >= 2) {
          await sendTelegram(`Publicando carrusel de ${imageUrls.length} imagenes en Instagram...`);
          const result = await igPublishCarousel(
            imageUrls.map((url) => ({ imageUrl: url })),
            caption,
            hashtags
          );
          if (result.success) return `Carrusel publicado en Instagram. Post ID: ${result.postId}`;
          return `Error publicando carrusel: ${result.error}`;
        } else {
          if (!imageUrls[0]) return "Necesito al menos una URL de imagen.";
          await sendTelegram("Publicando en Instagram...");
          const result = await igPublishPost({ imageUrl: imageUrls[0], caption, hashtags });
          if (result.success) return `Post publicado en Instagram. Post ID: ${result.postId}`;
          return `Error publicando: ${result.error}`;
        }
      } catch (err) {
        return `Error Instagram Publish: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "stitch_design": {
      try {
        if (!isStitchConfigured()) return "Google Stitch no configurado. Necesito STITCH_API_KEY. Ve a stitch.withgoogle.com → Settings → API key.";
        await sendTelegram("Generando diseno con Google Stitch...");
        const result = await stitchGenerateDesign(input.prompt as string, {
          deviceType: (input.device_type as "MOBILE" | "DESKTOP" | "TABLET" | "AGNOSTIC") || "MOBILE",
        });
        if (!result.success) return `Error Stitch: ${result.error}`;
        if (result.imageUrl) {
          await sendTelegramPhoto(result.imageUrl, `Stitch Design | ${(input.prompt as string).slice(0, 80)}`);
        }
        return `Diseno generado con Google Stitch.\n- Screenshot: ${result.imageUrl || "no disponible"}\n- HTML: ${result.htmlUrl || "no disponible"}\n- Project: ${result.projectId}\n- Screen: ${result.screenId}\n\nPuedo editarlo (stitch_edit) o generar variantes (stitch_variants).`;
      } catch (err) {
        return `Error Stitch: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "stitch_edit": {
      try {
        if (!isStitchConfigured()) return "Google Stitch no configurado. Necesito STITCH_API_KEY.";
        await sendTelegram("Editando diseno con Stitch...");
        const result = await stitchEditDesign(
          input.project_id as string,
          input.screen_id as string,
          input.edit_prompt as string
        );
        if (!result.success) return `Error editando: ${result.error}`;
        if (result.imageUrl) {
          await sendTelegramPhoto(result.imageUrl, `Stitch Edit | ${(input.edit_prompt as string).slice(0, 80)}`);
        }
        return `Diseno editado.\n- Screenshot: ${result.imageUrl || "no disponible"}\n- Screen: ${result.screenId}`;
      } catch (err) {
        return `Error Stitch Edit: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "stitch_variants": {
      try {
        if (!isStitchConfigured()) return "Google Stitch no configurado. Necesito STITCH_API_KEY.";
        const count = (input.variant_count as number) || 3;
        await sendTelegram(`Generando ${count} variantes con Stitch...`);
        const result = await stitchGenerateVariants(
          input.project_id as string,
          input.screen_id as string,
          input.prompt as string,
          {
            variantCount: count,
            creativeRange: (input.creative_range as "REFINE" | "EXPLORE" | "REIMAGINE") || "EXPLORE",
          }
        );
        if (!result.success) return `Error variantes: ${result.error}`;
        if (result.variants) {
          for (let i = 0; i < result.variants.length; i++) {
            const v = result.variants[i];
            if (v.imageUrl) {
              await sendTelegramPhoto(v.imageUrl, `Variante ${i + 1}/${result.variants.length}`);
            }
          }
          return `${result.variants.length} variantes generadas. Screen IDs: ${result.variants.map((v) => v.screenId).join(", ")}`;
        }
        return "Variantes generadas pero sin resultados.";
      } catch (err) {
        return `Error Stitch Variants: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "creative_pipeline": {
      const topic = input.topic as string;
      const platform = (input.platform as string) || "instagram";
      const imageStyle = (input.image_style as string) || "realism";
      const shouldPublish = input.publish === true;
      const brandCtx = (input.brand_context as string) || "PACAME agencia digital";

      try {
        // Step 1: Generate copy with Claude
        await sendTelegram(`Pipeline creativo: generando copy para "${topic}"...`);
        const copyRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": CLAUDE_API_KEY!,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: `Genera un post de ${platform} sobre: "${topic}". Marca: ${brandCtx}.
Responde SOLO JSON:
{"caption":"texto del post (max 200 palabras, enganche + valor + CTA)","hashtags":"5-8 hashtags relevantes del nicho separados por espacio","image_prompt":"descripcion en INGLES de la imagen ideal para este post, estilo profesional, sin texto"}`,
            }],
          }),
        });
        const copyData = await copyRes.json();
        const copyText = copyData.content?.[0]?.text || "";
        const jsonMatch = copyText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return "Error: no se pudo generar el copy. Respuesta invalida de Claude.";
        const postData = JSON.parse(jsonMatch[0]) as { caption: string; hashtags: string; image_prompt: string };

        // Step 2: Generate image with Freepik Mystic
        await sendTelegram("Pipeline creativo: generando imagen con Freepik Mystic...");
        let imageUrl: string | null = null;
        try {
          const task = await generateMystic(postData.image_prompt, {
            model: imageStyle as MysticModel,
            resolution: "2k",
            aspect_ratio: platform === "instagram" ? "square_1_1" : "widescreen_16_9",
          });
          const result = await waitForTask(`/ai/mystic/${task.task_id}`, 24, 5000);
          if (result.status === "COMPLETED" && result.generated?.length) {
            imageUrl = result.generated[0];
          }
        } catch {
          // Freepik failed, try DALL-E
          imageUrl = await generateContentImage(postData.image_prompt, platform);
        }

        if (!imageUrl) return "Error: no se pudo generar la imagen. Ni Freepik ni DALL-E respondieron.";

        // Step 3: Send preview to Telegram
        const fullCaption = `${postData.caption}\n\n${postData.hashtags}`;
        await sendTelegramPhoto(imageUrl, `<b>Preview — ${platform}</b>\n\n${fullCaption.slice(0, 900)}`);

        // Step 4: Save to content table
        const supabase = createServerSupabase();
        const { data: saved } = await supabase.from("content").insert({
          title: topic,
          body: fullCaption,
          platform,
          content_type: "post",
          image_url: imageUrl,
          image_prompt: postData.image_prompt,
          status: shouldPublish ? "approved" : "pending_review",
        }).select("id").single();

        // Step 5: Publish if requested
        if (shouldPublish && igIsConfigured() && platform === "instagram") {
          const pubResult = await igPublishPost({ imageUrl, caption: postData.caption, hashtags: postData.hashtags });
          if (pubResult.success) {
            if (saved?.id) {
              await supabase.from("content").update({ status: "published", published_at: new Date().toISOString() }).eq("id", saved.id);
            }
            return `Post creado Y publicado en Instagram.\n- Caption: ${postData.caption.slice(0, 100)}...\n- Hashtags: ${postData.hashtags}\n- Post ID: ${pubResult.postId}\n- Imagen: Freepik Mystic (${imageStyle})`;
          }
          return `Post creado pero fallo la publicacion: ${pubResult.error}. La imagen y el copy estan listos — puedo reintentarlo.`;
        }

        return `Post creado y guardado como pendiente.\n- Caption: ${postData.caption.slice(0, 100)}...\n- Hashtags: ${postData.hashtags}\n- Imagen: Freepik Mystic\n- Plataforma: ${platform}\n${saved?.id ? `- ID: ${saved.id}` : ""}\n\nDime "publica" para publicarlo o "edita el copy" si quieres cambios.`;
      } catch (err) {
        return `Error en pipeline creativo: ${err instanceof Error ? err.message : "desconocido"}`;
      }
    }

    case "save_memory": {
      const content = input.content as string;
      const category = (input.category as string) || "fact";
      const importance = (input.importance as number) || 5;
      const tags = (input.tags as string[]) || [];
      return await saveMemoryEntry(content, category, importance, tags);
    }

    case "recall_memory": {
      const query = input.query as string;
      const category = input.category as string | undefined;
      return await searchMemories(query, category);
    }

    case "self_reflect": {
      return await neuralReflect(
        (input.focus as string) || "general",
        (input.depth as "quick" | "deep") || "quick"
      );
    }

    case "consolidate_knowledge": {
      return await neuralConsolidate((input.action as string) || "full");
    }

    default:
      return `Herramienta no reconocida: ${name}`;
  }
}

// Split long messages for Telegram (4096 char limit)
function splitMessage(text: string, maxLen = 4000): string[] {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      parts.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen / 2) splitAt = maxLen;
    parts.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  return parts;
}

// ═══════════════════════════════════════════════════════════
//  CONVERSATION MEMORY — Supabase-backed chat history + persistent memory
// ═══════════════════════════════════════════════════════════

const HISTORY_LIMIT = 40; // Last N messages loaded as context (doubled for real conversations)

type ClaudeMessage = {
  role: string;
  content: string | Array<{ type: string; tool_use_id?: string; content?: string; id?: string; name?: string; input?: unknown; text?: string }>;
};

// Track if we've already checked the memory table exists this process
let memoryTableMode: "bot_memory" | "config" | null = null;

/**
 * Check which memory storage is available.
 * Prefers bot_memory table, falls back to config table (key/value).
 */
async function getMemoryMode(): Promise<"bot_memory" | "config"> {
  if (memoryTableMode !== null) return memoryTableMode;
  try {
    const supabase = createServerSupabase();
    const { error } = await supabase.from("bot_memory").select("id").limit(1);
    // Table not found: PostgREST returns PGRST205, Postgres returns 42P01
    if (error && (error.code === "42P01" || error.code === "PGRST205" || error.message?.includes("not find"))) {
      memoryTableMode = "config";
      console.log("[Memory] bot_memory table not found, using config table as fallback.");
    } else {
      memoryTableMode = error ? "config" : "bot_memory";
    }
    return memoryTableMode;
  } catch {
    memoryTableMode = "config";
    return "config";
  }
}

/**
 * Load persistent memories about Pablo and the project.
 * Returns a formatted string to inject into the system prompt.
 * Works with bot_memory table OR config table fallback.
 */
async function loadMemories(): Promise<string> {
  try {
    const mode = await getMemoryMode();
    const supabase = createServerSupabase();

    if (mode === "config") {
      // Fallback: load memories from config table as JSON
      const { data } = await supabase
        .from("config")
        .select("value")
        .eq("key", "bot_memories")
        .single();

      if (!data?.value) return "";
      try {
        const memories = JSON.parse(data.value) as Array<{ category: string; content: string; importance: number }>;
        return formatMemories(memories);
      } catch {
        return "";
      }
    }

    // Primary: load from bot_memory table
    const { data, error } = await supabase
      .from("bot_memory")
      .select("id, category, content, importance, tags")
      .order("importance", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error || !data?.length) return "";
    return formatMemories(data);
  } catch (err) {
    console.error("[Memory] Error loading memories:", err);
    return "";
  }
}

/**
 * Format memories array into system prompt text.
 */
function formatMemories(data: Array<{ category: string; content: string; importance?: number }>): string {
  const grouped: Record<string, string[]> = {};
  for (const m of data) {
    const cat = m.category || "general";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m.content);
  }

  const categoryLabels: Record<string, string> = {
    pablo: "SOBRE PABLO (lo que se de ti)",
    preference: "TUS PREFERENCIAS (como te gusta trabajar)",
    project: "CONTEXTO DEL PROYECTO (decisiones, estado)",
    client: "SOBRE CLIENTES (lo que recuerdo)",
    fact: "DATOS IMPORTANTES",
    insight: "INSIGHTS NEURONALES (conexiones y patrones detectados)",
    general: "NOTAS GENERALES",
  };

  const sections: string[] = [];
  for (const [cat, items] of Object.entries(grouped)) {
    const label = categoryLabels[cat] || cat.toUpperCase();
    sections.push(`${label}:\n${items.map((i) => `- ${i}`).join("\n")}`);
  }
  return sections.join("\n\n");
}

/**
 * Save a memory to persistent storage.
 * Uses bot_memory table if available, otherwise config table as JSON.
 */
async function saveMemoryEntry(
  content: string,
  category: string = "fact",
  importance: number = 5,
  tags: string[] = []
): Promise<string> {
  try {
    const mode = await getMemoryMode();
    const supabase = createServerSupabase();

    if (mode === "config") {
      // Fallback: store in config table as JSON array
      const { data: existing } = await supabase
        .from("config")
        .select("value")
        .eq("key", "bot_memories")
        .single();

      let memories: Array<{ category: string; content: string; importance: number; tags: string[]; created_at: string }> = [];
      if (existing?.value) {
        try { memories = JSON.parse(existing.value); } catch { memories = []; }
      }

      // Check for duplicates
      const duplicate = memories.find((m) => m.content.slice(0, 50) === content.slice(0, 50) && m.category === category);
      if (duplicate) {
        duplicate.content = content;
        duplicate.importance = importance;
        duplicate.tags = tags;
      } else {
        memories.push({ category, content, importance, tags, created_at: new Date().toISOString() });
      }

      // Keep max 200 memories, sorted by importance (expanded for neural network)
      memories.sort((a, b) => b.importance - a.importance);
      if (memories.length > 200) memories = memories.slice(0, 200);

      const { error } = await supabase.from("config").upsert({
        key: "bot_memories",
        value: JSON.stringify(memories),
        description: "Persistent bot memories (auto-managed)",
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

      if (error) return `Error guardando memoria: ${error.message}`;
      return `Memoria guardada (${category}): "${content.slice(0, 80)}..."`;
    }

    // Primary: bot_memory table
    const { data: existingMem } = await supabase
      .from("bot_memory")
      .select("id, content")
      .eq("category", category)
      .ilike("content", `%${content.slice(0, 50)}%`)
      .limit(3);

    if (existingMem?.length) {
      const { error } = await supabase
        .from("bot_memory")
        .update({
          content,
          importance,
          tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingMem[0].id);
      if (error) return `Error actualizando memoria: ${error.message}`;
      return `Memoria actualizada (${category}): "${content.slice(0, 80)}..."`;
    }

    const { error } = await supabase.from("bot_memory").insert({
      category,
      content,
      importance,
      tags,
      source: "conversation",
    });

    if (error) return `Error guardando memoria: ${error.message}`;
    return `Memoria guardada (${category}): "${content.slice(0, 80)}..."`;
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : "desconocido"}`;
  }
}

/**
 * Search memories by query.
 */
async function searchMemories(query: string, category?: string): Promise<string> {
  try {
    const mode = await getMemoryMode();
    const supabase = createServerSupabase();

    if (mode === "config") {
      const { data } = await supabase
        .from("config")
        .select("value")
        .eq("key", "bot_memories")
        .single();

      if (!data?.value) return `No encontre memorias sobre "${query}".`;
      try {
        const memories = JSON.parse(data.value) as Array<{ category: string; content: string; importance: number }>;
        // Search by individual words for better matching
        const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
        const matches = memories.filter((m) => {
          const contentLower = m.content.toLowerCase();
          const matchContent = words.some((w) => contentLower.includes(w));
          const matchCategory = !category || m.category === category;
          return matchContent && matchCategory;
        });
        if (!matches.length) return `No encontre memorias sobre "${query}".`;
        return matches.map((m) => `[${m.category}] (importancia ${m.importance}/10) ${m.content}`).join("\n");
      } catch {
        return `No encontre memorias sobre "${query}".`;
      }
    }

    // Primary: bot_memory table — search by individual words
    const words = query.split(/\s+/).filter((w) => w.length > 2);
    const searchWord = words[0] || query; // Use first meaningful word for ilike
    let q = supabase
      .from("bot_memory")
      .select("category, content, importance, tags, created_at")
      .order("importance", { ascending: false });

    if (category) q = q.eq("category", category);
    q = q.ilike("content", `%${searchWord}%`);

    const { data, error } = await q.limit(10);
    if (error) return `Error buscando: ${error.message}`;
    if (!data?.length) return `No encontre memorias sobre "${query}".`;

    return data.map((m) =>
      `[${m.category}] (importancia ${m.importance}/10) ${m.content}`
    ).join("\n");
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : "desconocido"}`;
  }
}

/**
 * Load recent conversation history from Supabase.
 * Returns messages in Claude API format (alternating user/assistant).
 */
async function loadHistory(): Promise<ClaudeMessage[]> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("conversations")
      .select("direction, message, created_at")
      .eq("channel", "telegram")
      .or("sender.eq.pablo,sender.eq.DIOS")
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    if (error || !data?.length) return [];

    // Reverse to chronological order and convert to Claude format
    const history: ClaudeMessage[] = [];
    for (const row of data.reverse()) {
      const role = row.direction === "inbound" ? "user" : "assistant";
      // Prevent consecutive same-role messages (Claude API requires alternation)
      if (history.length > 0 && history[history.length - 1].role === role) {
        // Merge consecutive same-role messages instead of dropping them
        const last = history[history.length - 1];
        if (typeof last.content === "string") {
          last.content = last.content + "\n" + row.message;
        }
        continue;
      }
      history.push({ role, content: row.message });
    }

    // Ensure history starts with "user" (Claude requirement)
    while (history.length > 0 && history[0].role !== "user") {
      history.shift();
    }
    // Ensure history ends with "assistant" (so current user msg follows properly)
    while (history.length > 0 && history[history.length - 1].role !== "assistant") {
      history.pop();
    }

    return history;
  } catch (err) {
    console.error("[Telegram Memory] Error loading history:", err);
    return [];
  }
}

/**
 * Save a message to conversation history.
 */
async function saveMessage(direction: "inbound" | "outbound", message: string): Promise<void> {
  try {
    const supabase = createServerSupabase();
    await supabase.from("conversations").insert({
      channel: "telegram",
      direction,
      sender: direction === "inbound" ? "pablo" : "DIOS",
      message: message.slice(0, 8000), // Increased from 4000 for richer context
      message_type: "text",
      mode: "auto",
    });
  } catch (err) {
    console.error("[Telegram Memory] Error saving message:", err);
  }
}

/**
 * Auto-extract and save memories from a conversation turn.
 * Enhanced with connection detection — builds neural links between memories.
 * Uses Claude Haiku for cheap background analysis.
 */
async function extractAndSaveMemories(userMessage: string, assistantResponse: string): Promise<void> {
  if (!CLAUDE_API_KEY) return;
  // Only analyze substantial conversations (skip short ones)
  if (userMessage.length < 20 && assistantResponse.length < 50) return;

  try {
    // Load existing memories for connection detection
    const existingMemories = await loadMemories();
    const existingContext = existingMemories
      ? `\nMEMORIAS EXISTENTES (detecta conexiones con estas):\n${existingMemories.slice(0, 1500)}`
      : "";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: `Eres la red neuronal de PACAME. Analiza esta conversacion y extrae conocimiento.

TAREA 1 — HECHOS NUEVOS: Extrae datos concretos que valga la pena recordar a largo plazo.
TAREA 2 — CONEXIONES: Si detectas que algo se relaciona con memorias existentes, crea un "insight" que conecte ambos datos.
TAREA 3 — PATRONES: Si ves un patron que se repite (ej: Pablo siempre pide X antes de Y), guardalo como preference.

Categorias:
- pablo: datos personales, gustos, forma de trabajar
- preference: como le gusta que le contesten, patrones de comportamiento
- project: decisiones de negocio, estado de proyectos
- client: info sobre clientes especificos
- fact: datos concretos (numeros, fechas, URLs)
- insight: conexiones entre datos, patrones detectados, meta-conocimiento
${existingContext}

Pablo dijo: "${userMessage.slice(0, 600)}"
Asistente respondio: "${assistantResponse.slice(0, 600)}"

Responde SOLO JSON array. Si no hay nada nuevo, responde [].
Formato: [{"content":"dato concreto o insight","category":"pablo|preference|project|client|fact|insight","importance":1-10,"tags":["tag1"]}]`,
        }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return;

    const memories = JSON.parse(jsonMatch[0]) as Array<{
      content: string;
      category: string;
      importance: number;
      tags: string[];
    }>;

    for (const mem of memories) {
      if (mem.content && mem.content.length > 5) {
        await saveMemoryEntry(
          mem.content,
          mem.category || "fact",
          Math.min(Math.max(mem.importance || 5, 1), 10),
          mem.tags || []
        );
      }
    }

    // Track conversation count for periodic consolidation
    await incrementConversationCount();
  } catch {
    // Silent — memory extraction is best-effort, never blocks the conversation
  }
}

// ═══════════════════════════════════════════════════════════
//  RED NEURONAL — Self-reflection, consolidation, neural growth
// ═══════════════════════════════════════════════════════════

/** Track conversation count for periodic consolidation */
async function incrementConversationCount(): Promise<void> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("config")
      .select("value")
      .eq("key", "neural_state")
      .single();

    let state = { conversation_count: 0, last_consolidation: "", insights_generated: 0 };
    if (data?.value) {
      try { state = JSON.parse(data.value); } catch { /* use default */ }
    }

    state.conversation_count = (state.conversation_count || 0) + 1;

    // Auto-consolidate every 15 conversations
    if (state.conversation_count % 15 === 0 && CLAUDE_API_KEY) {
      neuralConsolidate("full").catch(() => {}); // Background, non-blocking
      state.last_consolidation = new Date().toISOString();
    }

    await supabase.from("config").upsert({
      key: "neural_state",
      value: JSON.stringify(state),
      description: "Neural network state tracker",
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
  } catch {
    // Silent
  }
}

/**
 * Neural self-reflection — analyze accumulated memories and generate insights.
 * The bot "thinks" about what it knows and finds patterns.
 */
async function neuralReflect(focus: string, depth: "quick" | "deep"): Promise<string> {
  if (!CLAUDE_API_KEY) return "Error: necesito CLAUDE_API_KEY para reflexionar.";

  try {
    const memories = await loadMemories();
    if (!memories || memories.length < 50) return "Aun no tengo suficientes memorias para reflexionar. Necesito mas conversaciones.";

    const focusPrompts: Record<string, string> = {
      clients: "Analiza los patrones entre los clientes mencionados. Que tipo de negocio nos busca? Que servicios piden mas? Hay patrones en los problemas que traen? Que podemos aprender para vender mejor?",
      pablo: "Analiza todo lo que sabes sobre Pablo. Como prefiere trabajar? Que le importa? Que patrones tiene en sus decisiones? Como puedo ser mas util para el?",
      business: "Analiza el estado del negocio PACAME. Como van los leads? Los clientes? Los ingresos? Que tendencias detectas? Que riesgos u oportunidades ves?",
      content: "Analiza que tipo de contenido se ha creado y que resultados ha dado. Que funciona? Que no? Hay patrones en lo que Pablo pide o aprueba?",
      general: "Reflexiona sobre TODO lo que sabes. Que patrones generales ves? Que conexiones entre datos no son obvias? Que insights profundos puedes generar?",
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: depth === "deep" ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001",
        max_tokens: depth === "deep" ? 1500 : 800,
        messages: [{
          role: "user",
          content: `Eres la red neuronal de PACAME agencia digital. Reflexiona sobre tus memorias acumuladas.

MEMORIAS ACTUALES:
${memories.slice(0, 3000)}

TAREA: ${focusPrompts[focus] || focusPrompts.general}

Responde en DOS partes:
1. REFLEXION: Tu analisis en texto natural (max 500 palabras). Se concreto, con datos.
2. NUEVOS INSIGHTS (JSON): Insights que vale la pena guardar permanentemente.

Formato parte 2:
INSIGHTS_JSON: [{"content":"insight concreto","importance":7,"tags":["tag1"]}]

Si no hay insights nuevos, pon INSIGHTS_JSON: []`,
        }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || "No pude reflexionar.";

    // Extract and save insights
    const insightsMatch = text.match(/INSIGHTS_JSON:\s*(\[[\s\S]*?\])/);
    if (insightsMatch) {
      try {
        const insights = JSON.parse(insightsMatch[1]) as Array<{
          content: string;
          importance: number;
          tags: string[];
        }>;
        for (const ins of insights) {
          if (ins.content) {
            await saveMemoryEntry(ins.content, "insight", ins.importance || 7, ins.tags || ["neural", "reflection"]);
          }
        }
      } catch { /* parsing failed, no problem */ }
    }

    // Return just the reflection text (without the JSON part)
    const reflectionText = text.replace(/INSIGHTS_JSON:[\s\S]*$/, "").trim();
    return reflectionText || text;
  } catch (err) {
    return `Error en reflexion: ${err instanceof Error ? err.message : "desconocido"}`;
  }
}

/**
 * Neural consolidation — merge duplicates, update importances, generate meta-memories.
 * Like defragmenting the brain.
 */
async function neuralConsolidate(action: string): Promise<string> {
  if (!CLAUDE_API_KEY) return "Error: necesito CLAUDE_API_KEY para consolidar.";

  try {
    const memories = await loadMemories();
    if (!memories || memories.length < 30) return "Pocas memorias para consolidar. Sigue conversando y vuelve luego.";

    const mode = await getMemoryMode();
    const supabase = createServerSupabase();

    if (action === "analyze") {
      // Just report the current state
      let count = 0;
      const categories: Record<string, number> = {};

      if (mode === "config") {
        const { data } = await supabase.from("config").select("value").eq("key", "bot_memories").single();
        if (data?.value) {
          const mems = JSON.parse(data.value) as Array<{ category: string }>;
          count = mems.length;
          for (const m of mems) {
            categories[m.category] = (categories[m.category] || 0) + 1;
          }
        }
      } else {
        const { data } = await supabase.from("bot_memory").select("category");
        count = data?.length || 0;
        for (const m of (data || [])) {
          categories[m.category] = (categories[m.category] || 0) + 1;
        }
      }

      const { data: stateData } = await supabase.from("config").select("value").eq("key", "neural_state").single();
      const state = stateData?.value ? JSON.parse(stateData.value) : { conversation_count: 0 };

      return `RED NEURONAL PACAME:
- Total memorias: ${count}
- Categorias: ${Object.entries(categories).map(([k, v]) => `${k}(${v})`).join(", ")}
- Conversaciones procesadas: ${state.conversation_count || 0}
- Ultima consolidacion: ${state.last_consolidation || "nunca"}
- Insights generados: ${state.insights_generated || 0}
- Modo almacenamiento: ${mode}`;
    }

    // For merge/insights/full — use Claude to analyze and consolidate
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        messages: [{
          role: "user",
          content: `Eres el motor de consolidacion de la red neuronal de PACAME.

MEMORIAS ACTUALES:
${memories.slice(0, 3000)}

TAREA ${action === "merge_duplicates" ? "MERGE" : action === "generate_insights" ? "INSIGHTS" : "FULL"}:

${action === "merge_duplicates" || action === "full" ? `
1. DUPLICADOS: Identifica memorias duplicadas o muy similares. Para cada grupo, genera UNA memoria consolidada que combine la info.
` : ""}
${action === "generate_insights" || action === "full" ? `
2. INSIGHTS: Genera 2-5 meta-memorias que conecten datos existentes. Busca:
   - Patrones de comportamiento de Pablo
   - Tendencias en el tipo de clientes/servicios
   - Conexiones no obvias entre datos
   - Predicciones basadas en lo acumulado
` : ""}
${action === "full" ? `
3. IMPORTANCIAS: Sugiere cambios de importancia para memorias que han demostrado ser mas/menos relevantes.
` : ""}

Responde JSON:
{
  "merged": [{"old_contents": ["texto1", "texto2"], "new": {"content": "texto consolidado", "category": "cat", "importance": 8, "tags": ["t1"]}}],
  "insights": [{"content": "insight", "category": "insight", "importance": 7, "tags": ["neural"]}],
  "importance_updates": [{"content_start": "primeros 30 chars de la memoria", "new_importance": 8}],
  "summary": "resumen de cambios realizados"
}`,
        }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return "No se pudo consolidar. Formato de respuesta invalido.";

    const result = JSON.parse(jsonMatch[0]) as {
      merged?: Array<{ new: { content: string; category: string; importance: number; tags: string[] } }>;
      insights?: Array<{ content: string; category: string; importance: number; tags: string[] }>;
      summary?: string;
    };

    let changes = 0;

    // Save merged memories
    if (result.merged) {
      for (const m of result.merged) {
        if (m.new?.content) {
          await saveMemoryEntry(m.new.content, m.new.category || "fact", m.new.importance || 5, m.new.tags || []);
          changes++;
        }
      }
    }

    // Save new insights
    if (result.insights) {
      for (const ins of result.insights) {
        if (ins.content) {
          await saveMemoryEntry(ins.content, "insight", ins.importance || 7, ins.tags || ["neural", "consolidation"]);
          changes++;
        }
      }
    }

    // Update neural state
    const { data: stateData } = await supabase.from("config").select("value").eq("key", "neural_state").single();
    const state = stateData?.value ? JSON.parse(stateData.value) : { conversation_count: 0, insights_generated: 0 };
    state.last_consolidation = new Date().toISOString();
    state.insights_generated = (state.insights_generated || 0) + (result.insights?.length || 0);
    await supabase.from("config").upsert({
      key: "neural_state",
      value: JSON.stringify(state),
      description: "Neural network state tracker",
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    return `Consolidacion completada: ${changes} cambios.\n${result.summary || "Red neuronal actualizada."}`;
  } catch (err) {
    return `Error consolidando: ${err instanceof Error ? err.message : "desconocido"}`;
  }
}

/**
 * Seed initial project knowledge as dynamic memories.
 * Runs ONCE — checks if already seeded before inserting.
 */
async function seedProjectKnowledge(): Promise<void> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("config")
      .select("value")
      .eq("key", "knowledge_seeded")
      .single();

    if (data?.value === "true") return; // Already seeded

    // Seed comprehensive memories about current state
    const seedMemories = [
      { content: "Pablo Calleja es el CEO y fundador de PACAME agencia digital. Emprendedor, desarrollador web, gestiona redes sociales. Trabaja desde Espana.", category: "pablo", importance: 10, tags: ["fundador", "ceo"] },
      { content: "Pablo prefiere comunicacion directa, sin humo. Le gusta que las cosas se ejecuten sin preguntarle confirmacion. Nunca delegarle tareas.", category: "preference", importance: 10, tags: ["comunicacion", "autonomia"] },
      { content: "PACAME es una agencia digital con 10 agentes IA + 120 subespecialistas. Resuelve problemas digitales para PYMEs en Espana. Tagline: Tu equipo digital. Sin limites.", category: "project", importance: 10, tags: ["agencia", "mision"] },
      { content: "Stack: Next.js 15, React 19, TypeScript, Supabase, Stripe (pagos live), Claude API, Vercel, VPS Hostinger. Todo en produccion.", category: "project", importance: 9, tags: ["tech", "stack"] },
      { content: "Servicios PACAME: Web 497EUR, Landing 300EUR, Ecommerce 997EUR, SEO 397EUR/mes, RRSS 297EUR/mes, Meta Ads 297EUR/mes, Google Ads 397EUR/mes, Branding 497EUR, ChatBot 197EUR/mes.", category: "project", importance: 10, tags: ["precios", "servicios"] },
      { content: "Dominio: pacameagencia.com. Email: hola@pacameagencia.com. WhatsApp: +34 722 669 381. DNS en Hostinger.", category: "fact", importance: 9, tags: ["contacto", "dominio"] },
      { content: "Telegram Bot webhook esta en Vercel: /api/telegram/webhook. NO usar telegramTrigger de n8n. Bot tiene memoria persistente en Supabase.", category: "fact", importance: 8, tags: ["telegram", "infra"] },
      { content: "APIs activas en produccion: Claude, Stripe, Apify (scraping), Resend (email), Vapi (llamadas IA), Telegram, OpenAI (Whisper+DALL-E), Freepik Suite (imagenes IA), Google Stitch (diseno UI), Gemini.", category: "fact", importance: 9, tags: ["apis", "integraciones"] },
      { content: "Instagram API configurada parcialmente. Pendiente OAuth callback para access token. WhatsApp Business API pendiente.", category: "project", importance: 7, tags: ["apis", "pendiente"] },
      { content: "VPS Hostinger 72.62.185.125 — corre n8n (automaciones), voice server. Subdominios: n8n.pacameagencia.com, api.pacameagencia.com, voice.pacameagencia.com.", category: "fact", importance: 8, tags: ["infra", "vps"] },
      { content: "Pipeline lead gen: Apify scraping Google Maps → auto-audit web → scoring 1-100 → outreach personalizado via Copy. Metricas: scrape→qualify 50%, email→open 40%, reply 5%, call→close 30%.", category: "project", importance: 9, tags: ["leads", "pipeline"] },
      { content: "Carruseles Instagram: Motor v3 con glass cards, gradientes, 10 tipos de slide, 10 paletas. Calidad top agencia. PACAME branding por defecto.", category: "fact", importance: 7, tags: ["contenido", "carruseles"] },
      { content: "Agentes: Nova (branding), Atlas (SEO), Nexus (ads/growth), Pixel (frontend), Core (backend), Pulse (RRSS), Sage (estrategia), Copy (textos), Lens (analytics), DIOS (orquestacion).", category: "project", importance: 10, tags: ["equipo", "agentes"] },
      { content: "4 problemas que PACAME resuelve: 1) Adquisicion (Atlas+Nexus), 2) Conversion (Nexus+Pixel), 3) Marca (Nova+Copy), 4) Producto/Operacion (Core+Pixel).", category: "project", importance: 9, tags: ["framework", "ventas"] },
      { content: "Marca PACAME: Electric Violet #7C3AED, gradiente #7C3AED→#4338CA→#06B6D4, Space Grotesk (titulos), Inter (body), dark mode #0D0D0D. Arquetipo: Mago + Rebelde.", category: "fact", importance: 8, tags: ["marca", "identidad"] },
      { content: "Red neuronal activada: el bot aprende de cada conversacion, detecta conexiones entre memorias, genera insights automaticamente, y consolida conocimiento cada 15 conversaciones.", category: "project", importance: 8, tags: ["neural", "aprendizaje"] },
    ];

    for (const mem of seedMemories) {
      await saveMemoryEntry(mem.content, mem.category, mem.importance, mem.tags);
    }

    // Mark as seeded
    await supabase.from("config").upsert({
      key: "knowledge_seeded",
      value: "true",
      description: "Flag: initial project knowledge has been seeded into bot memories",
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    console.log("[Neural] Project knowledge seeded successfully — 16 base memories.");
  } catch (err) {
    console.error("[Neural] Error seeding knowledge:", err);
  }
}

/**
 * Process a natural language message from Pablo via Telegram.
 * Uses Claude with tool_use to understand intent and execute actions.
 * Loads conversation history for context (memory/brain).
 */
export async function processMessage(userMessage: string): Promise<void> {
  if (!CLAUDE_API_KEY) {
    await sendTelegram("Error: CLAUDE_API_KEY no configurada.");
    return;
  }

  try {
    // Save incoming message to history + seed knowledge on first run
    await saveMessage("inbound", userMessage);
    seedProjectKnowledge().catch(() => {}); // Background, runs once

    // Cerebro neural: routeInput devuelve agente + skill + memorias/discoveries
    // semánticas. Se ejecuta en paralelo con el histórico clásico.
    const neuralRoute = routeInput({
      input: userMessage,
      source: "webhook",
      channel: "telegram",
    }).catch(() => null);

    // Load conversation history + persistent memories in parallel
    const [history, memories, route] = await Promise.all([
      loadHistory(),
      loadMemories(),
      neuralRoute,
    ]);

    // Build dynamic system prompt with deep knowledge + memories
    const memoryBlock = memories
      ? `\n\n═══════════════════════════════════════════════════
MI MEMORIA PERSISTENTE (lo que recuerdo de conversaciones anteriores)
═══════════════════════════════════════════════════
${memories}

RED NEURONAL — INSTRUCCIONES DE APRENDIZAJE CONTINUO:
- Usa esta informacion para dar respuestas personalizadas y contextuales.
- Si Pablo menciona algo importante (preferencias, datos de clientes, decisiones), usa save_memory para guardarlo.
- Si necesitas recordar algo especifico, usa recall_memory para buscarlo.
- NUNCA digas "no tengo memoria" o "no recuerdo" — BUSCA primero con recall_memory.
- Detecta CONEXIONES entre memorias: si un cliente se parece a otro, si un patron se repite, guardalo como insight.
- Cuando acumules suficiente info sobre un tema, usa self_reflect para generar insights profundos.
- Aprende continuamente. Cada conversacion te hace mas util. Eres una red neuronal que crece.`
      : `\n\nMEMORIA: Aun no tengo memorias guardadas. Empezare a aprender sobre Pablo y el proyecto a medida que hablemos. Usa save_memory cuando detectes info importante.`;

    // Bloque de cerebro neural: agente PACAME elegido + contexto semántico
    const brainBlock = route ? `

═══════════════════════════════════════════════════
CEREBRO NEURAL — CONTEXTO SEMANTICO (red pgvector)
═══════════════════════════════════════════════════
Agente sugerido para esta peticion: ${String(route.agent).toUpperCase()}
${route.skill ? `Skill mas relevante: ${route.skill.label} (similarity ${route.skill.similarity.toFixed(2)})` : ''}
${route.context ? route.context : ''}

Instrucciones:
- Usa el agente sugerido como base de tu persona (ademas de DIOS).
- Si el skill sugerido es relevante, aplicalo.
- Respeta tono PACAME: directo, cercano, tutear, frases cortas, cierre con proximo paso.
- Si generas algo nuevo y util, lanza DISCOVERY: <insight> al final.
` : '';

    const systemWithMemory = SYSTEM_PROMPT + PROJECT_KNOWLEDGE + memoryBlock + brainBlock;

    // Build messages array: history + current message
    const messages: ClaudeMessage[] = [
      ...history,
      { role: "user", content: userMessage },
    ];

    // Track the final assistant response for saving to history
    let finalResponse = "";

    // Loop for multi-turn tool use (max 5 rounds — increased for memory operations)
    for (let round = 0; round < 5; round++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 3000,
          system: systemWithMemory,
          tools: TOOLS,
          messages,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        await sendTelegram(`Error Claude API (${res.status}): ${errText.slice(0, 200)}`);
        return;
      }

      const data = await res.json();
      const content = data.content || [];

      // Check if there are tool calls
      const toolCalls = content.filter((c: { type: string }) => c.type === "tool_use");
      const textParts = content.filter((c: { type: string }) => c.type === "text");

      if (toolCalls.length === 0) {
        // No tool calls — send the text response
        const responseText = textParts.map((t: { text: string }) => t.text).join("\n") || "...";
        finalResponse += responseText;
        const parts = splitMessage(responseText);
        for (const part of parts) {
          await sendTelegram(part);
        }
        // Save assistant response to history
        await saveMessage("outbound", finalResponse);

        // Auto-extract memories in background (non-blocking)
        extractAndSaveMemories(userMessage, finalResponse).catch(() => {});
        return;
      }

      // Execute ONLY the first tool call per round (prevent runaway parallel calls)
      const toolToRun = toolCalls[0];
      // Build content with only the first tool call + any text
      const filteredContent = [
        ...textParts,
        toolToRun,
      ];
      messages.push({ role: "assistant", content: filteredContent });

      // Capture any text before tool execution
      const preToolText = textParts.map((t: { text: string }) => t.text).join("\n");
      if (preToolText) finalResponse += preToolText + "\n";

      const result = await executeTool(toolToRun.name, toolToRun.input as Record<string, unknown>);

      // Save tool execution to history for richer context
      await saveMessage("outbound", `[Tool: ${toolToRun.name}] ${result.slice(0, 500)}`);

      messages.push({
        role: "user",
        content: [{
          type: "tool_result" as const,
          tool_use_id: toolToRun.id,
          content: result,
        }],
      });
    }

    // If we exhausted rounds, send what we have
    const exhaustedMsg = "He ejecutado varias acciones. Revisa el dashboard para ver los resultados.";
    await sendTelegram(exhaustedMsg);
    await saveMessage("outbound", finalResponse || exhaustedMsg);

    // Auto-extract memories even on exhausted rounds
    extractAndSaveMemories(userMessage, finalResponse || exhaustedMsg).catch(() => {});
  } catch (err) {
    console.error("[Telegram Assistant] Error:", err);
    await sendTelegram(`Error procesando mensaje: ${err instanceof Error ? err.message : "desconocido"}`);
  }
}
