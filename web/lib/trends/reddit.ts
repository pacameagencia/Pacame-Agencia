/**
 * Reddit scraper (JSON público, sin auth).
 * Recoge top posts de subreddits españoles últimos 7 días.
 *
 * Útil para detectar:
 * - Qué discute el público español esta semana
 * - Dolor real (posts quejándose, buscando soluciones)
 * - Nichos emergentes (temas nuevos recurrentes)
 */

export interface RedditPost {
  subreddit: string;
  title: string;
  url: string;
  permalink: string;
  ups: number;
  numComments: number;
  createdUtc: number;
  selftext?: string;
  author?: string;
}

const UA = 'PACAME-opportunity-scanner/1.0 (+https://pacameagencia.com)';

/**
 * Fetch top posts de un subreddit.
 * @param subreddit  ej 'spain', 'EmprendedoresES', 'askspain'
 * @param t          ventana temporal: 'day', 'week', 'month'
 */
export async function redditTop(
  subreddit: string,
  t: 'day' | 'week' | 'month' = 'week',
  limit = 15
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=${t}&limit=${limit}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal });
    clearTimeout(timeout);
    if (!r.ok) return [];
    const json = await r.json() as { data?: { children?: Array<{ data: RedditPost }> } };
    const children = json?.data?.children ?? [];
    return children.map(c => ({ ...c.data, subreddit }));
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

/**
 * Top combinado de varios subreddits españoles relevantes.
 */
export async function redditSpainWeekly(): Promise<RedditPost[]> {
  const subreddits = ['spain', 'askspain', 'EmprendedoresES', 'espanol', 'podemos', 'Madrid'];
  const results = await Promise.allSettled(
    subreddits.map(s => redditTop(s, 'week', 10))
  );
  const posts: RedditPost[] = [];
  for (const r of results) if (r.status === 'fulfilled') posts.push(...r.value);
  return posts
    .filter(p => p.ups >= 50) // filtro ruido
    .sort((a, b) => b.ups - a.ups);
}

/**
 * Extrae tópicos relevantes del título del post (rough heurística).
 * Se usa para agrupar discusiones relacionadas.
 */
export function extractTopics(posts: RedditPost[]): Array<{ topic: string; count: number; samplePosts: RedditPost[] }> {
  const topicMap = new Map<string, RedditPost[]>();

  // Palabras clave (lowercase, sin acentos) que sugieren oportunidad de negocio
  const signalKeywords = [
    'comprar', 'vender', 'precio', 'alquiler', 'trabajo', 'empleo', 'paro',
    'hipoteca', 'piso', 'comunidad', 'seguro', 'mutua', 'impuesto', 'autonomo',
    'negocio', 'empresa', 'startup', 'emprender', 'inversion', 'ahorro',
    'formacion', 'curso', 'oposicion', 'master', 'academia', 'universidad',
    'salud', 'dentista', 'psicologo', 'dieta', 'fitness', 'gimnasio',
    'viaje', 'hotel', 'vuelo', 'vacaciones', 'turismo',
    'movil', 'coche', 'app', 'software', 'ia', 'chatgpt', 'claude',
    'moda', 'ropa', 'belleza', 'cosmetica',
    'bebe', 'mascota', 'perro', 'gato',
    'restaurante', 'comida', 'receta', 'delivery',
    'musica', 'videojuego', 'streaming', 'netflix', 'spotify',
  ];

  for (const p of posts) {
    const lowered = p.title.toLowerCase();
    const norm = lowered
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    for (const kw of signalKeywords) {
      if (norm.includes(kw)) {
        if (!topicMap.has(kw)) topicMap.set(kw, []);
        topicMap.get(kw)!.push(p);
      }
    }
  }

  return Array.from(topicMap.entries())
    .map(([topic, samplePosts]) => ({ topic, count: samplePosts.length, samplePosts: samplePosts.slice(0, 3) }))
    .filter(t => t.count >= 1)
    .sort((a, b) => b.count - a.count);
}
