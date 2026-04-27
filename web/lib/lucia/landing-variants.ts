/**
 * Variantes de landing para /lucia/[slug] (SEO programático).
 * Cada slug es una página optimizada para una keyword distinta y un perfil
 * concreto. Comparten layout pero el copy es 100% específico.
 */

export interface LandingVariant {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  hero: { kicker: string; headline: string; sub: string };
  pains: { bad: string; good: string }[];
  cta: { primary: string; subtext: string };
  faq: { q: string; a: string }[];
}

export const VARIANTS: Record<string, LandingVariant> = {
  "vs-chatgpt": {
    slug: "vs-chatgpt",
    title: "PACAME GPT vs ChatGPT · ¿Cuál es mejor para España?",
    description:
      "Comparativa honesta entre PACAME GPT (Lucía) y ChatGPT para usuarios españoles. Idioma, voz, factura, pricing, soporte. ¿Cuál te conviene?",
    keywords: [
      "pacame gpt vs chatgpt",
      "alternativa chatgpt español",
      "chatgpt en español alternativa",
      "comparar chatgpt y otros chatbots españoles",
    ],
    hero: {
      kicker: "Comparativa honesta",
      headline: "PACAME GPT vs ChatGPT, sin humo.",
      sub: "Para un español de a pie, ¿cuál tiene más sentido? Lo desgranamos punto por punto.",
    },
    pains: [
      { bad: "ChatGPT escribe en spanglish raro", good: "Lucía habla castellano de calle real." },
      { bad: "Pricing 23€/mes en USD", good: "9,90€/mes con factura española." },
      { bad: "Voz con acento inglés", good: "Voz Lucía castellana nativa." },
      { bad: "Hay que aprender a hacer prompts", good: "4 botones grandes con plantillas." },
      { bad: "Tickets de soporte en inglés", good: "WhatsApp humano en España." },
    ],
    cta: {
      primary: "Probar Lucía 14 días gratis",
      subtext: "Sin tarjeta. Si no te convence, te quedas en la versión gratis.",
    },
    faq: [
      {
        q: "¿Tiene Lucía la misma potencia que ChatGPT?",
        a: "Lucía usa modelos de IA top-tier (Claude Sonnet por debajo). Para tareas cotidianas en español, va a la altura. Para investigación científica avanzada o código complejo, ChatGPT puede tener ventaja en algunos casos puntuales.",
      },
      {
        q: "¿Puedo seguir usando ChatGPT y Lucía a la vez?",
        a: "Claro. Lucía es para tu día a día en español. Si tienes ChatGPT Plus para casos puntuales, no te molesta nada usar ambas.",
      },
      {
        q: "¿Mis datos viajan a EE.UU.?",
        a: "Lucía corre en infraestructura europea. Tus conversaciones se guardan en servidores EU.",
      },
    ],
  },
  "para-autonomos": {
    slug: "para-autonomos",
    title: "Lucía: la IA española para autónomos · PACAME GPT",
    description:
      "Eres autónomo en España y quieres una IA que te entienda. Lucía te ayuda con clientes, facturas, emails y RRSS. Factura española, deducible.",
    keywords: [
      "ia para autonomos",
      "chatgpt autonomos españa",
      "asistente ia autonomos",
      "ia para freelance español",
    ],
    hero: {
      kicker: "Para autónomos en España",
      headline: "Tu mano derecha digital, en castellano.",
      sub: "Te redacta emails a clientes, presupuestos, posts para Instagram, respuestas a Hacienda. En tu idioma, con factura deducible.",
    },
    pains: [
      { bad: "Pierdes tardes redactando emails y propuestas", good: "Lucía te lo escribe en 30 segundos." },
      { bad: "Te lías con el lenguaje formal de Hacienda", good: "Te lo traduce al humano y al revés." },
      { bad: "Sin tiempo para redes sociales", good: "Te genera 5 posts a la semana en tu tono." },
      { bad: "Pricing en USD sin factura", good: "9,90€/mes con factura española deducible." },
      { bad: "Falta de tiempo es tu mayor problema", good: "Recuperas 2-3 horas a la semana, mínimo." },
    ],
    cta: {
      primary: "Probar 14 días gratis",
      subtext: "Sin tarjeta. Factura española al pasar a Premium. Deducible al 100%.",
    },
    faq: [
      {
        q: "¿La factura me sirve para deducir?",
        a: "Sí, recibes factura española con tu NIF cada mes. Si Lucía la usas para tu actividad profesional, se desgrava al 100%.",
      },
      {
        q: "¿Puedo escribir mensajes en mi tono y que Lucía los aprenda?",
        a: "Sí. Cuanto más le des contexto al inicio de cada conversación (tu sector, tu tono), mejor te imita. En el plan Premium las conversaciones se mantienen para que no tengas que repetir.",
      },
      {
        q: "¿Funciona con WhatsApp Business?",
        a: "Lucía te redacta los mensajes para que los copies y pegues. Integración directa con WhatsApp Business está en roadmap.",
      },
    ],
  },
  "para-mayores": {
    slug: "para-mayores",
    title: "IA fácil para mayores en español · PACAME GPT con Lucía",
    description:
      "Lucía es la IA más fácil de usar en español. Habla, ella te contesta. Botones grandes, voz castellana, todo claro. Pensada para abuelos también.",
    keywords: [
      "ia para mayores",
      "chatgpt facil español",
      "asistente voz español mayores",
      "ia para abuelos",
    ],
    hero: {
      kicker: "Sencilla de verdad",
      headline: "Una IA que entendería tu abuela.",
      sub: "Pulsas un botón, hablas, y Lucía te contesta con voz humana en castellano. Sin liar, sin jerga, sin inglés.",
    },
    pains: [
      { bad: "Las apps modernas son un lío", good: "4 botones grandes y un chat sencillo." },
      { bad: "Los asistentes hablan raro", good: "Voz castellana nativa, clara y cercana." },
      { bad: "Inglés en todas partes", good: "Todo en español de España." },
      { bad: "Miedo a equivocarse", good: "Lucía te explica con paciencia, sin prisa." },
      { bad: "Suscripciones liosas", good: "9,90€/mes claritos, sin letra pequeña." },
    ],
    cta: {
      primary: "Probar gratis ahora",
      subtext: "Sin tarjeta. Lo abres en el móvil y a hablar.",
    },
    faq: [
      {
        q: "¿Es fácil de usar en el móvil?",
        a: "Sí. Está pensada para móvil primero. Pulsas el botón grande, hablas, y Lucía te contesta. Si prefieres escribir, también puedes.",
      },
      {
        q: "¿Cuesta mucho aprenderlo?",
        a: "Cero. Si sabes mandar un WhatsApp, sabes usar Lucía. Si te lías, mándale un mensaje pidiendo ayuda y te lo explica con paciencia.",
      },
      {
        q: "¿Y si me equivoco al pagar?",
        a: "Tienes 14 días gratis para probarla. Si no te gusta, no pagas nada. Y si te suscribes, te das de baja en un click.",
      },
    ],
  },
  "que-es": {
    slug: "que-es",
    title: "¿Qué es PACAME GPT? · Lucía, la IA española",
    description:
      "PACAME GPT (Lucía) es un asistente IA en español de España. Te ayuda con emails, traducciones, ideas, planificación y más. Hecho en España por PACAME.",
    keywords: [
      "que es pacame gpt",
      "que es lucia ia",
      "asistente ia que es",
      "para que sirve chatgpt en español",
    ],
    hero: {
      kicker: "En 1 minuto",
      headline: "¿Qué es PACAME GPT?",
      sub: "Una IA española que te ayuda con cualquier movida del día a día. Como ChatGPT pero pensada para el que vive en España.",
    },
    pains: [
      { bad: "ChatGPT está bien pero te cobra en USD", good: "Lucía cobra en euros, factura española." },
      { bad: "Habla mezclando inglés y español", good: "Lucía solo castellano, sin spanglish." },
      { bad: "Hay que saber prompting", good: "Botones de tarea pre-rellenados, escribes y listo." },
      { bad: "Suena a manual americano", good: "Suena a colega española de 35 años." },
      { bad: "Sin soporte humano cercano", good: "WhatsApp directo con PACAME en España." },
    ],
    cta: {
      primary: "Probar Lucía gratis",
      subtext: "14 días sin tarjeta. Después gratis o Premium 9,90€/mes.",
    },
    faq: [
      {
        q: "¿Para qué sirve concretamente?",
        a: "Para redactar emails y mensajes, traducir, resumir textos, generar ideas, planificar la semana, pedir explicaciones de cualquier tema, escribir copy para tu negocio, hacer la lista de la compra. Lo que se te ocurra.",
      },
      {
        q: "¿Quién está detrás de Lucía?",
        a: "PACAME, una agencia digital española liderada por Pablo Calleja. La supervisamos y afinamos cada semana con feedback real de usuarios.",
      },
      {
        q: "¿Cómo empiezo?",
        a: "Pulsas 'Empezar 14 días gratis', pones tu email y una contraseña, y ya. Sin tarjeta, sin compromiso.",
      },
    ],
  },
};

export function listVariantSlugs(): string[] {
  return Object.keys(VARIANTS);
}

export function getVariant(slug: string): LandingVariant | null {
  return VARIANTS[slug] || null;
}
