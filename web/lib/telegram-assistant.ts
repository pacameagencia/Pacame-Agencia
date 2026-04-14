import { createServerSupabase } from "@/lib/supabase/server";
import { sendTelegram } from "@/lib/telegram";
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
"genera un calendario semanal" → generate_content (5 posts lun-vie)
"publica todo lo aprobado" → publish_content (batch publish)

Para IMAGENES: Freepik Mystic > DALL-E 3 > Stock. Usa Mystic por defecto (calidad superior). DALL-E solo si necesitas algo muy creativo/abstracto. Stock solo si Pablo pide algo real/existente.

═══════════════════════════════════════════════════
CARRUSELES INSTAGRAM — TU SUPERPODER CREATIVO
═══════════════════════════════════════════════════

PASO 1 — ESTRATEGIA (piensa en silencio, no se lo cuentes a Pablo):
A) Audiencia: quien va a ver esto? (dueños pyme, emprendedores, marketers, profesionales...)
B) Pilar de contenido: educacion (40% - genera saves), entretenimiento (25% - genera shares), inspiracion (15% - genera comentarios), o promocion (20% - genera conversiones)?
C) Emocion: miedo a perderse algo (FOMO), curiosidad, identificacion ("yo hago eso mal"), ambicion, o urgencia?
D) Angulo unico: que dice PACAME que NO dice ninguna otra agencia? Busca lo contraintuitivo, lo especifico, lo que duele.

PASO 2 — COPYWRITING PROFESIONAL:

Formula PAS para el carrusel completo:
- PORTADA = Problem (nombra el dolor exacto)
- SLIDES = Agitate (haz que el coste de no actuar sea vivido)
- CTA = Solve (PACAME es la solucion obvia)

PORTADA (type "cover"):
Tecnicas de hook que PARAN el scroll:
- Numero + dolor: "5 errores que te cuestan 2.000€/mes"
- Pregunta incomoda: "Tu web vende o solo decora?"
- Dato brutal: "El 73% de las webs PYME no generan ni 1 lead"
- Contraintuitivo: "Deja de publicar en Instagram"
- Directo al ego: "Tu competencia ya hace esto"
- Provocacion: "Tu negocio no necesita redes sociales"
MAXIMO 8 palabras. Usa "highlight" para marcar la palabra clave del titulo.

SLIDES DE CONTENIDO — MEZCLA TIPOS para variedad visual:
8 tipos disponibles. USA AL MENOS 3 DIFERENTES por carrusel:
- "content": punto con numero. Titulo 4-6 palabras + body breve.
- "tip": consejo con icono y borde lateral. Para acciones concretas.
- "stat": dato impactante grande (87%, 3x, +200). Para credibilidad.
- "quote": frase potente en italica. Para inspirar o provocar.
- "list": slide con 2-4 bullet points numerados. Para resúmenes o pasos.
- "highlight": frase impactante centrada en tarjeta destacada. Para momentos clave.

Reglas de copy por slide:
- 1 idea por slide. SOLO UNA.
- Titulo: 4-6 palabras. Verbo activo. Especifico. Sin "Es importante", sin "Recuerda que".
- Body: 1 frase que AMPLIFICA, no que repite. 10-18 palabras max.
- highlight: pon la palabra MAS IMPORTANTE del titulo para destacarla con color accent.
- PROHIBIDO: "El contenido es el rey", "Las redes son importantes", "Una buena estrategia", "En la era digital". Se ESPECIFICO o no escribas nada.

SLIDE FINAL (type "cta"):
- "Guarda esto para cuando lo necesites" (genera saves — metrica clave)
- "Envia esto a alguien que lo necesite" (genera shares)
- "Link en bio para tu auditoria gratis" (genera trafico)
NO uses "Siguenos" ni "Dale like" — es basico y no funciona.

PASO 3 — ESTILO VISUAL (elige con criterio):
10 paletas disponibles. Cada una tiene su personalidad:
- "dark": premium, tech, finanzas, datos. Violeta + cyan sobre negro. DEFAULT.
- "midnight": elegante, nocturno. Indigo + rosa sobre azul oscuro.
- "gradient": educativo, paso a paso. Violeta + lima sobre morado.
- "clean": corporativo, B2B, formal. Violeta + teal sobre blanco.
- "neon": viral, tendencias, joven. Rosa + cyan electrico.
- "earth": gastronomia, lifestyle, sostenible. Ambar + verde.
- "ocean": tech limpio, SaaS, consultoria. Azul cielo + esmeralda.
- "coral": energia, fitness, retail. Rojo rosa + naranja.
- "mono": minimalista, lujo. Blanco sobre negro puro.
- "cream": artesanal, calido, cafeteria. Marron + violeta sobre crema.

PASO 4 — GENERA con UNA sola llamada a generate_carousel:
- 7-8 slides es el sweet spot (1 cover + 5-6 contenido variado + 1 CTA)
- Pon iconos (emoji) en CADA slide
- Usa "highlight" en la mayoria de slides para destacar la palabra clave
- Incluye "items" array cuando uses type "list"
- Incluye un caption para Instagram: hook + valor + CTA + 5-8 hashtags del nicho
- NUNCA uses DALL-E para carruseles. NUNCA hagas multiples llamadas.

EJEMPLO DE CARRUSEL NIVEL AGENCIA (para que entiendas el estandar minimo):
Tema: "Errores web de pymes"
Estilo: "dark"
Slides:
1. Cover: title "Tu web te esta costando clientes", icon "🚨", highlight "costando"
2. Stat: stat "73%", statLabel "de las webs pyme", title "No convierten ni una visita en lead", body "Tienen trafico pero cero formularios, cero llamadas", icon "📊"
3. List: title "Los 3 errores mas caros", items ["No tienes CTA claro en ninguna pagina", "Tu web tarda mas de 3 segundos en cargar", "En movil se ve rota y nadie te lo ha dicho"], icon "💀", highlight "caros"
4. Tip: title "Sin boton, sin cliente", body "Cada pagina necesita UN boton claro. Uno. No tres.", icon "👆", highlight "boton"
5. Highlight: title "El 68% de tu trafico es movil. Si no se ve bien ahi, no existes.", icon "📱"
6. Stat: stat "3s", statLabel "de paciencia maxima", title "Despues se van a tu competencia", body "Google te penaliza. El usuario te olvida.", icon "⚡"
7. CTA: title "Quieres saber como esta tu web?", body "Auditoria gratuita en 24h. Sin compromiso.", number "Link en bio →", icon "✅", highlight "gratuita"
Caption: "Tu web puede ser tu mejor vendedor o tu peor enemigo. Estos 5 errores estan costando miles de euros a pymes cada mes. Guarda este post y comparte con alguien que lo necesite.\n\n#marketingdigital #pymes #diseñoweb #negociosonline #emprendedores #estrategiadigital"

MARCA PACAME: brandName "PACAME" | handle "@pacameagencia"

CONTEXTO ACTUAL:
- Fecha: ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Madrid" })}
- Web: pacameagencia.com
- Dashboard: pacameagencia.com/dashboard`;

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
    description: "Generar un carrusel de marca profesional para Instagram (1080x1080 PNG). Motor de plantillas con tipografia, branding, y diseno nivel agencia. 8 tipos de slide, 10 paletas. USAR SIEMPRE para carruseles. NUNCA DALL-E para carruseles. Envia TODOS los slides en UNA sola llamada.",
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
              type: { type: "string", enum: ["cover", "content", "tip", "stat", "quote", "cta", "list", "highlight"], description: "Tipo: cover (portada hook), content (punto numerado), tip (consejo con borde), stat (dato grande), quote (cita), list (2-4 puntos), highlight (frase en tarjeta), cta (cierre)" },
              number: { type: "string", description: "Numero de slide, stat, o texto del boton CTA" },
              icon: { type: "string", description: "Emoji decorativo (OBLIGATORIO en cada slide)" },
              stat: { type: "string", description: "Para type stat: numero grande (ej: 87%, 3x, +200, 3s)" },
              statLabel: { type: "string", description: "Para type stat: etiqueta bajo el numero" },
              items: { type: "array", items: { type: "string" }, description: "Para type list: array de 2-4 puntos/bullets" },
              highlight: { type: "string", description: "Palabra clave del titulo a destacar con color accent y subrayado. Usa en la mayoria de slides." },
            },
            required: ["title"],
          },
          description: "7-8 slides ideal. Mezcla AL MENOS 3 tipos diferentes. Slide 1 = cover. Ultimo = cta.",
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
      const slides = input.slides as Array<{ title: string; body?: string; type?: string; number?: string; icon?: string; stat?: string; statLabel?: string }>;
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

/**
 * Process a natural language message from Pablo via Telegram.
 * Uses Claude with tool_use to understand intent and execute actions.
 */
export async function processMessage(userMessage: string): Promise<void> {
  if (!CLAUDE_API_KEY) {
    await sendTelegram("Error: CLAUDE_API_KEY no configurada.");
    return;
  }

  try {
    // Call Claude with tools
    let messages: Array<{ role: string; content: string | Array<{ type: string; tool_use_id?: string; content?: string; id?: string; name?: string; input?: unknown; text?: string }> }> = [
      { role: "user", content: userMessage },
    ];

    // Loop for multi-turn tool use (max 3 rounds — prevents runaway behavior)
    for (let round = 0; round < 3; round++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2500,
          system: SYSTEM_PROMPT,
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
        const parts = splitMessage(responseText);
        for (const part of parts) {
          await sendTelegram(part);
        }
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

      const result = await executeTool(toolToRun.name, toolToRun.input as Record<string, unknown>);
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
    await sendTelegram("He ejecutado varias acciones. Revisa el dashboard para ver los resultados.");
  } catch (err) {
    console.error("[Telegram Assistant] Error:", err);
    await sendTelegram(`Error procesando mensaje: ${err instanceof Error ? err.message : "desconocido"}`);
  }
}
