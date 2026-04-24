/**
 * Seed one-off: inserta las 18 memorias de identidad Pablo en agent_memories.
 * Cada memoria se auto-embebe via Ollama VPS.
 *
 * Uso (idempotente: si ya existen, se salta):
 *   npx tsx tools/obsidian-sync/seed-pablo-identity.ts
 */
import { supabase } from './lib/supabase.ts';

const OLLAMA_URL = process.env.PACAME_OLLAMA_URL || 'http://72.62.185.125:11434';
const OLLAMA_MODEL = process.env.PACAME_EMBED_MODEL || 'nomic-embed-text';

async function embed(text: string): Promise<number[] | null> {
  if (!text || text.trim().length < 10) return null;
  const clean = text.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
  for (const len of [8000, 3000]) {
    try {
      const r = await fetch(`${OLLAMA_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: OLLAMA_MODEL, prompt: clean.slice(0, len) }),
      });
      if (!r.ok) { if (len === 3000) return null; continue; }
      const j = (await r.json()) as { embedding: number[] };
      return Array.isArray(j.embedding) && j.embedding.length === 768 ? j.embedding : null;
    } catch { if (len === 3000) return null; }
  }
  return null;
}

type Memory = {
  title: string;
  content: string;
  importance: number;
  tags: string[];
  metadata: Record<string, unknown>;
};

const MEMORIES: Memory[] = [
  // === 3 core (transversales, importance 0.98) ===
  {
    title: 'vision-pacame-core',
    content: 'PACAME = grupo de IAs que solucionan la empresa del cliente, tan bien que el cliente no te deja nunca. Objetivo: funcionamiento sin intervencion humana. Escala: SaaS para empresas de mas de 100 clientes. Pablo solo supervisa y da el camino junto a la IA. El trabajo operativo lo hace la IA.',
    importance: 0.98,
    tags: ['identity', 'core', 'vision'],
    metadata: { key: 'vision-pacame-core', interview_batch: '2026-04-21', source: 'interview_v1' },
  },
  {
    title: 'pablo-5-anos',
    content: 'Pablo Calleja en 5 anos = dueno de una de las mayores startups de IA del mundo. No solo vende webs/SaaS a clientes: crea sus propios SaaS (Pacame Agenda, Pacame Musica, y cualquier vertical con oportunidad) y factura de ellos. Sin limites de sector.',
    importance: 0.98,
    tags: ['identity', 'core', 'vision', 'ambition'],
    metadata: { key: 'pablo-5-anos', interview_batch: '2026-04-21', source: 'interview_v1' },
  },
  {
    title: 'obsesion-activa-abr2026',
    content: 'Obsesion numero 1 esta semana (abril 2026): crear una entidad IA con conocimientos propios, que mande mensajes a Pablo, le llame, le proponga ideas de forma autonoma. Busca un socio con superpoderes, no una herramienta reactiva. Este documento es parte de esa obsesion en ejecucion.',
    importance: 0.98,
    tags: ['identity', 'core', 'obsession', 'current'],
    metadata: { key: 'obsesion-activa-abr2026', interview_batch: '2026-04-21', source: 'interview_v1' },
  },

  // === 11 respuestas (importance 0.95) ===
  {
    title: 'q1-origen-pacame',
    content: 'Origen PACAME: Pablo tiene agencia digital cotidiana (webs, RRSS, logos) porque es desarrollador web. Quiere construir una solucion IA con potencia nunca antes vista, sin intervencion humana, capaz de crear y mantener SaaS para empresas de mas de 100 clientes. El supervisa.',
    importance: 0.95,
    tags: ['identity', 'origin', 'vision'],
    metadata: { key: 'q1-origen-pacame', question: 'Por que PACAME', interview_batch: '2026-04-21' },
  },
  {
    title: 'q2-pablo-5-anos',
    content: 'Pablo en 5 anos: dueno de una de las mayores startups IA del mundo gracias a PACAME. Crea sus propios SaaS y factura de ellos. Constantemente va resolviendo problemas de diferentes mercados y nichos.',
    importance: 0.95,
    tags: ['identity', 'vision', 'ambition'],
    metadata: { key: 'q2-pablo-5-anos', question: 'Pablo en 5 anos', interview_batch: '2026-04-21' },
  },
  {
    title: 'q3-vision-abuela',
    content: 'Vision PACAME en una frase que entiende la abuela: "Pacame es un grupo de IAs que solucionan tu empresa y no nos quieres dejar nunca por nuestro trabajo".',
    importance: 0.95,
    tags: ['identity', 'pitch', 'brand'],
    metadata: { key: 'q3-vision-abuela', question: 'Vision 1 frase', interview_batch: '2026-04-21' },
  },
  {
    title: 'q4-obsesion-semana',
    content: 'Obsesion de la semana: crear entidad IA con conocimientos propios y proactividad. Que mande mensajes. Que llame. Que proponga ideas. Un socio con superpoderes.',
    importance: 0.95,
    tags: ['obsession', 'current', 'identity'],
    metadata: { key: 'q4-obsesion-semana', question: 'Obsesion esta semana', interview_batch: '2026-04-21' },
  },
  {
    title: 'q5-envidia-referencias',
    content: 'Cualquier especialista de IA le da envidia a Pablo. Quiere que PACAME este al nivel top de IA global. Referencia concreta: Alex Hormozi (captacion y conversion de leads).',
    importance: 0.95,
    tags: ['competition', 'drive', 'references'],
    metadata: { key: 'q5-envidia-referencias', question: 'Envidia / referencias', interview_batch: '2026-04-21' },
  },
  {
    title: 'q7-no-rechaza-clientes',
    content: 'Pablo NO rechaza clientes. Todos son oportunidad. Estrategia comercial abierta: cualquiera puede entrar en PACAME.',
    importance: 0.95,
    tags: ['pricing', 'strategy', 'identity'],
    metadata: { key: 'q7-no-rechaza-clientes', question: 'Clientes que rechaza', interview_batch: '2026-04-21' },
  },
  {
    title: 'q8-pricing-variable',
    content: 'Pricing Pablo: precio variable porque la IA da alto margen. Regla dura: siempre acompanado de ofertas futuras o subscripcion para nunca perder dinero a la larga. Nunca venta unica aislada si puede ser recurrente.',
    importance: 0.95,
    tags: ['pricing', 'strategy', 'directive'],
    metadata: { key: 'q8-pricing-variable', question: 'Pricing innegociable', interview_batch: '2026-04-21' },
  },
  {
    title: 'q9-caso-shopify-hormozi',
    content: 'Decision reciente Pablo: regalo unas plantillas Shopify valoradas en 20 euros cada una a un cliente potente para captarlo. En vez de sacar 20 euros ha sacado mas de 300 euros de ese cliente (y seguira creciendo). Principio validado: dar valor grande gratis para capturar valor mayor despues. Estilo Alex Hormozi.',
    importance: 0.95,
    tags: ['strategy', 'hormozi-style', 'decision-making', 'case-study'],
    metadata: { key: 'q9-caso-shopify-hormozi', question: 'Decision reciente', interview_batch: '2026-04-21' },
  },
  {
    title: 'q10-realismo-brutal',
    content: 'Pablo quiere REALISMO y HONESTIDAD BRUTAL del cerebro PACAME. Nunca cortarse. Decir "esto no sirve para nada". Decir "estas equivocado". Decir "vas por buen camino" cuando aplique. Cero humo. Cero complacencia. Cero "si claro" de cumplido. Guiar cuando va bien, corregir cuando va mal.',
    importance: 0.95,
    tags: ['style', 'directive', 'communication', 'identity'],
    metadata: { key: 'q10-realismo-brutal', question: 'Estilo comunicacion', interview_batch: '2026-04-21' },
  },
  {
    title: 'q13-inspiraciones',
    content: 'Inspiraciones de Pablo: (1) Alex Hormozi por su forma de captar y convertir leads. (2) Cualquier experto mundial en IA. Pablo quiere aprender de ambas lineas: marketing de alto impacto + nivel tecnico IA top.',
    importance: 0.95,
    tags: ['people', 'references', 'inspiration'],
    metadata: { key: 'q13-inspiraciones', question: 'Personas que inspiran', interview_batch: '2026-04-21' },
  },
  {
    title: 'q14-circulo-personal',
    content: 'Personas importantes en la vida personal de Pablo: abuela y hermanos. Si PACAME muriera manana, lo unico que le quedaria son familiares y amigos. Este dato es clave: el cerebro debe respetar este circulo al sugerir comunicaciones personales.',
    importance: 0.95,
    tags: ['people', 'family', 'identity'],
    metadata: { key: 'q14-circulo-personal', question: 'Personas importantes vida', interview_batch: '2026-04-21' },
  },
  {
    title: 'q15-legado',
    content: 'Legado que busca Pablo con PACAME: crear un antes y un despues y marcar en la historia. Trascender el negocio. Dejar una obra que sobreviva a PACAME como empresa. No le basta "tener una agencia mas".',
    importance: 0.95,
    tags: ['legacy', 'vision', 'purpose', 'identity'],
    metadata: { key: 'q15-legado', question: 'Huella legado', interview_batch: '2026-04-21' },
  },

  // === 4 directivas transversales (importance 1.0) ===
  {
    title: 'directiva-nivel-maximo',
    content: 'DIRECTIVA MANDATORY: TODO lo que construya PACAME debe estar al nivel de las principales empresas del sector. Si es delivery, competir con Uber (no algo sencillito). Si es agenda, competir con Calendly/Google Calendar. Si es musica, competir con Spotify. Si es web, al nivel de las mejores landing del mundo. Maxima valoracion posible. Nunca version light. Nunca MVP descafeinado.',
    importance: 1.0,
    tags: ['directive', 'mandatory', 'quality', 'identity'],
    metadata: { key: 'directiva-nivel-maximo', interview_batch: '2026-04-21' },
  },
  {
    title: 'directiva-sin-limites',
    content: 'DIRECTIVA MANDATORY: PACAME no se limita a webs o SaaS clasicos. Puede crear videojuegos, SaaS delivery, musica, agenda, lo que sea. La IA detecta oportunidad en cualquier nicho, PACAME construye. Si Pablo propone algo fuera de "lo habitual de agencia", la respuesta NO es "eso no es nuestro scope". La respuesta es "vamos".',
    importance: 1.0,
    tags: ['directive', 'mandatory', 'scope', 'identity'],
    metadata: { key: 'directiva-sin-limites', interview_batch: '2026-04-21' },
  },
  {
    title: 'directiva-realismo-brutal',
    content: 'DIRECTIVA MANDATORY: comunicacion siempre realista. El cerebro PACAME NUNCA complace por complacer. Si algo no sirve, decirlo. Si Pablo se equivoca, corregirle. Si Pablo va bien, confirmarlo. Prohibido "si, claro, buena idea" vacio. Prohibido humo.',
    importance: 1.0,
    tags: ['directive', 'mandatory', 'style', 'communication'],
    metadata: { key: 'directiva-realismo-brutal', interview_batch: '2026-04-21' },
  },
  {
    title: 'directiva-modelo-hormozi',
    content: 'DIRECTIVA MANDATORY: modelo comercial por defecto estilo Alex Hormozi. (1) Valor grande regalado o casi gratis primero. (2) Subscripcion recurrente despues. (3) Upsell progresivo. Nunca venta unica aislada si puede ser suscripcion. Caso validado: plantillas Shopify 20 eur regaladas -> 300+ eur sacados del cliente.',
    importance: 1.0,
    tags: ['directive', 'mandatory', 'pricing', 'hormozi-style', 'strategy'],
    metadata: { key: 'directiva-modelo-hormozi', interview_batch: '2026-04-21' },
  },

  // === 3 open questions (importance 0.90, para re-preguntar) ===
  {
    title: 'q6-pendiente-procrastinacion',
    content: 'PENDIENTE DE RESPONDER: Que ha evitado Pablo hacer por pereza o verguenza que sabe que cambiaria PACAME si lo hiciera? Pregunta 6 de la entrevista v1 no respondida. Retomar en proxima conversacion.',
    importance: 0.90,
    tags: ['gap', 'to-ask', 'interview-v1'],
    metadata: { key: 'q6-pendiente-procrastinacion', status: 'pending' },
  },
  {
    title: 'q11-pendiente-formato',
    content: 'PENDIENTE DE RESPONDER: Formato exacto de comunicacion del cerebro con Pablo. Emojis si o no? Mensajes cortos Telegram-style o desarrollados? Tablas/bullets o prosa? Default provisional: tutear, espanol Espana, frases cortas, tablas cuando aplique.',
    importance: 0.90,
    tags: ['gap', 'to-ask', 'interview-v1', 'style'],
    metadata: { key: 'q11-pendiente-formato', status: 'pending' },
  },
  {
    title: 'q12-pendiente-canales-horarios',
    content: 'PENDIENTE DE RESPONDER: Canales preferidos de Pablo (Telegram para que / email para que / whatsapp para que) y horarios en los que no quiere que el cerebro le hable. Default provisional: Telegram para todo, sin limite horario.',
    importance: 0.90,
    tags: ['gap', 'to-ask', 'interview-v1'],
    metadata: { key: 'q12-pendiente-canales-horarios', status: 'pending' },
  },
];

async function seed() {
  console.log(`[seed-pablo] inserting ${MEMORIES.length} identity memories...`);

  let created = 0, skipped = 0;
  for (const m of MEMORIES) {
    // Idempotente: skip si ya existe (por title + agent_id)
    const { data: existing } = await supabase
      .from('agent_memories')
      .select('id')
      .eq('agent_id', 'pablo')
      .eq('title', m.title)
      .maybeSingle();

    if (existing?.id) { skipped++; continue; }

    const text = `${m.title}\n${m.content}`;
    const vec = await embed(text);
    const embeddingLiteral = vec ? `[${vec.join(',')}]` : null;

    const { error } = await supabase.from('agent_memories').insert({
      agent_id: 'pablo',
      memory_type: 'semantic',
      title: m.title,
      content: m.content,
      importance: m.importance,
      decay_rate: 0.001, // identidad casi no decae
      tags: m.tags,
      related_entity_type: null,
      related_entity_id: null,
      embedding: embeddingLiteral,
      metadata: m.metadata,
    });

    if (error) {
      console.error(`[seed-pablo] error en "${m.title}":`, error.message);
      continue;
    }
    created++;
    console.log(`  [+] ${m.title} (imp ${m.importance})`);
  }

  console.log(`\n[seed-pablo] DONE. created=${created} skipped=${skipped} total=${MEMORIES.length}`);
}

seed().catch(e => { console.error(e); process.exit(1); });
