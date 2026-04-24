/**
 * Update de identidad Pablo: corrige/añade memorias según clarificación
 * del 2026-04-21 tarde.
 * - Reemplaza `vision-pacame-core` con la visión real (rueda de servicios)
 * - Añade `negocio-multi-tipo`, `doble-monetizacion`, `facturacion-minima`
 * - Añade directiva `directiva-deteccion-oportunidades`
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

const UPDATES: Array<{ mode: 'update' | 'insert'; memory: Memory }> = [
  // CORRECCIÓN de vision-pacame-core (antes solo decía SaaS)
  {
    mode: 'update',
    memory: {
      title: 'vision-pacame-core',
      content: 'PACAME es una RUEDA DE SERVICIOS que se compenetran. Crea TODO TIPO de negocio online (web nicho con publicidad, SaaS, infoproducto, ecommerce, affiliate, marketplace, videojuego, delivery, app movil, agenda, etc.) con la IA. Doble monetizacion por molde: (1) se lo vendemos a un cliente y (2) creamos el nuestro del mismo tipo y facturamos directo. La IA opera sin intervencion humana. Pablo solo supervisa y da el camino. Escala: empresas de 100+ clientes. Aunque no vendamos siempre, conseguimos facturar con los negocios propios. Ejemplos: web nicho comida de moda que vive de publicidad, SaaS para servicio especifico con mucha demanda.',
      importance: 1.0,
      tags: ['identity', 'core', 'vision', 'directive'],
      metadata: { key: 'vision-pacame-core', revision: '2026-04-21-tarde', source: 'clarification_v2' },
    },
  },

  // NUEVA: doble monetización
  {
    mode: 'insert',
    memory: {
      title: 'directiva-doble-monetizacion',
      content: 'DIRECTIVA MANDATORY: por cada tipo de negocio online que PACAME construye, aplicamos DOBLE MONETIZACION. (1) Lo vendemos como servicio al cliente (se lo entregamos como solucion operativa). (2) Creamos una version nuestra del mismo tipo y facturamos directamente (publicidad, subscripcion, transacciones). El activo es el MOLDE: una vez construido, se replica. Asi aunque no vendamos mucho en un periodo, siempre facturamos desde los negocios propios.',
      importance: 1.0,
      tags: ['directive', 'mandatory', 'strategy', 'monetization'],
      metadata: { key: 'directiva-doble-monetizacion', source: 'clarification_v2' },
    },
  },

  // NUEVA: todo tipo de negocio
  {
    mode: 'insert',
    memory: {
      title: 'directiva-todo-tipo-negocio',
      content: 'DIRECTIVA MANDATORY: PACAME no construye solo SaaS. Construye TODO tipo de negocio online que tenga demanda y permita facturar. Lista no exhaustiva: webs nicho (vivos de publicidad Adsense/MediaVine), SaaS verticales, infoproductos, ecommerce especializados, affiliate sites, marketplaces, mini apps moviles, videojuegos casual, sistemas de delivery, plataformas de agenda, generadores, comparadores, herramientas, etc. El criterio es: hay demanda + se puede monetizar + PACAME puede construirlo con IA.',
      importance: 1.0,
      tags: ['directive', 'mandatory', 'scope'],
      metadata: { key: 'directiva-todo-tipo-negocio', source: 'clarification_v2' },
    },
  },

  // NUEVA: facturación mínima
  {
    mode: 'insert',
    memory: {
      title: 'directiva-facturacion-minima-1000',
      content: 'DIRECTIVA MANDATORY: toda oportunidad de negocio que PACAME detecte o proponga debe tener potencial minimo de 1.000 EUR. Las oportunidades por debajo de 1k eur se descartan de entrada. Aspiracion: cada vez mas alta (de 1k a 5k a 10k a 50k EUR). El cerebro debe filtrar activamente.',
      importance: 1.0,
      tags: ['directive', 'mandatory', 'pricing', 'opportunity-filter'],
      metadata: { key: 'directiva-facturacion-minima-1000', source: 'clarification_v2' },
    },
  },

  // NUEVA: detección activa
  {
    mode: 'insert',
    memory: {
      title: 'directiva-deteccion-oportunidades',
      content: 'DIRECTIVA MANDATORY: los agentes PACAME NO esperan a que Pablo pida ideas. Escanean activamente el dia a dia (tendencias Google Trends, epocas/estacionalidad, eventos, noticias, movimientos competencia, redes sociales, Product Hunt, Reddit, TikTok, Twitter) y detectan oportunidades de venta concretas. Cada oportunidad detectada se guarda como agent_discovery con tipo opportunity y se notifica a Pablo por Telegram si supera el filtro de 1000 EUR potencial.',
      importance: 1.0,
      tags: ['directive', 'mandatory', 'proactive', 'opportunity-detection'],
      metadata: { key: 'directiva-deteccion-oportunidades', source: 'clarification_v2' },
    },
  },

  // NUEVA: ejemplos concretos para anclar
  {
    mode: 'insert',
    memory: {
      title: 'ejemplos-negocios-pacame',
      content: 'Ejemplos concretos de negocios que PACAME debe saber construir (Pablo los cito directamente): (1) Web nicho de comida de moda que factura por publicidad. (2) SaaS para un servicio muy especifico con mucha demanda. (3) Un millon de ideas mas en esa linea. Cada una debe poder facturar minimo 1k EUR/mes y escalar. La IA construye, PACAME factura.',
      importance: 0.95,
      tags: ['identity', 'examples', 'vision'],
      metadata: { key: 'ejemplos-negocios-pacame', source: 'clarification_v2' },
    },
  },

  // NUEVA: proactividad del cerebro
  {
    mode: 'insert',
    memory: {
      title: 'directiva-cerebro-proactivo',
      content: 'DIRECTIVA MANDATORY: el cerebro PACAME funciona 24/7 sin depender de que Pablo encienda el PC. Telegram, detectores, crons, agentes: todo vive en Vercel + VPS Hostinger. Si algo muere cuando Pablo apaga el PC, es bug a reportar y arreglar. Los agentes escanean, descubren, facturan, se comunican entre si y con Pablo SOLOS. Pablo solo supervisa y da direccion.',
      importance: 1.0,
      tags: ['directive', 'mandatory', 'infra', 'proactive'],
      metadata: { key: 'directiva-cerebro-proactivo', source: 'clarification_v2' },
    },
  },
];

async function run() {
  console.log(`[update-pablo] ${UPDATES.length} updates...`);
  for (const u of UPDATES) {
    const m = u.memory;
    const text = `${m.title}\n${m.content}`;
    const vec = await embed(text);
    const embLit = vec ? `[${vec.join(',')}]` : null;

    if (u.mode === 'update') {
      const { error } = await supabase
        .from('agent_memories')
        .update({
          content: m.content,
          importance: m.importance,
          tags: m.tags,
          embedding: embLit,
          metadata: m.metadata,
        })
        .eq('agent_id', 'pablo')
        .eq('title', m.title);
      console.log(`  [~] ${m.title}`, error ? 'ERR ' + error.message : 'updated');
    } else {
      // upsert-ish: si ya existe, actualiza; si no, inserta
      const { data: existing } = await supabase
        .from('agent_memories')
        .select('id')
        .eq('agent_id', 'pablo')
        .eq('title', m.title)
        .maybeSingle();
      if (existing?.id) {
        await supabase
          .from('agent_memories')
          .update({ content: m.content, importance: m.importance, tags: m.tags, embedding: embLit, metadata: m.metadata })
          .eq('id', existing.id);
        console.log(`  [~] ${m.title} updated`);
      } else {
        const { error } = await supabase.from('agent_memories').insert({
          agent_id: 'pablo',
          memory_type: 'semantic',
          title: m.title,
          content: m.content,
          importance: m.importance,
          decay_rate: 0.001,
          tags: m.tags,
          embedding: embLit,
          metadata: m.metadata,
        });
        console.log(`  [+] ${m.title}`, error ? 'ERR ' + error.message : 'inserted');
      }
    }
  }
  console.log('[update-pablo] DONE');
}

run().catch(e => { console.error(e); process.exit(1); });
