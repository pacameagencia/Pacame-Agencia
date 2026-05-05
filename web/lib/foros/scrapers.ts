/**
 * Foros scrapers · 5 fuentes paralelas.
 *
 * Reddit:        API JSON pública (sin auth) · gratis · cap 60 req/min
 * Forobeta:      Apify apify/web-scraper · subforos paginados
 * Twitter/X:     Apify apidojo/twitter-scraper · queries intent
 * IndieHackers:  Apify scraper questions+comments
 * Quora:         Apify scraper preguntas hispanas
 *
 * Output normalizado: ScrapedItem[] (mismo shape para todas las plataformas).
 * Caller (endpoint scrape worker) hace upsert en `foros_opportunities` con
 * `thread_url` UNIQUE (idempotente).
 */

import { getLogger } from "@/lib/observability/logger";

const APIFY_KEY = process.env.APIFY_API_KEY;
const APIFY_BASE = "https://api.apify.com/v2/acts";

export interface ScrapedItem {
  platform: "reddit" | "forobeta" | "twitter" | "indiehackers" | "quora";
  source_key: string;                // subreddit, subforo, query
  thread_url: string;
  thread_title: string;
  thread_body: string;
  author_username: string;
  author_authority: number;          // karma, followers, posts
  posted_at: string | null;          // ISO
  reach_proxy: number;               // upvotes + replies/views proxy
  competition_count: number;         // ya respuestas/comments
}

// ─── Apify helper ──────────────────────────────────────────────

async function callApify(actorId: string, input: unknown, timeoutSec = 180): Promise<unknown[]> {
  if (!APIFY_KEY) throw new Error("APIFY_API_KEY missing");
  const url = `${APIFY_BASE}/${actorId}/run-sync-get-dataset-items?token=${APIFY_KEY}&timeout=${timeoutSec}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`apify ${actorId} ${r.status}: ${text.slice(0, 200)}`);
  }
  const items = await r.json();
  return Array.isArray(items) ? items : [];
}

// ─── 1. Reddit (API JSON pública sin auth) ─────────────────────

interface RedditPost {
  data: {
    id: string;
    permalink: string;
    title: string;
    selftext: string;
    author: string;
    score: number;
    num_comments: number;
    created_utc: number;
  };
}

export async function scrapeReddit(
  subreddits: string[],
  maxAgeHours = 48,
  limitPerSub = 25
): Promise<ScrapedItem[]> {
  const log = getLogger();
  const items: ScrapedItem[] = [];
  const cutoffSec = Date.now() / 1000 - maxAgeHours * 3600;

  for (const sub of subreddits) {
    try {
      // Reddit JSON API · sort=new para freshness
      const r = await fetch(
        `https://www.reddit.com/r/${encodeURIComponent(sub)}/new.json?limit=${limitPerSub}`,
        { headers: { "User-Agent": "darkroom-foros-bot/0.1 by pacame" } }
      );
      if (!r.ok) {
        log.warn({ sub, status: r.status }, "[reddit-scraper] HTTP error");
        continue;
      }
      const data = (await r.json()) as { data?: { children?: RedditPost[] } };
      const posts = data.data?.children ?? [];
      for (const p of posts) {
        if (p.data.created_utc < cutoffSec) continue;
        items.push({
          platform: "reddit",
          source_key: sub,
          thread_url: `https://www.reddit.com${p.data.permalink}`,
          thread_title: p.data.title,
          thread_body: p.data.selftext || "",
          author_username: p.data.author,
          author_authority: 0, // se enriquece después si necesario (saving API call)
          posted_at: new Date(p.data.created_utc * 1000).toISOString(),
          reach_proxy: (p.data.score || 0) + (p.data.num_comments || 0),
          competition_count: p.data.num_comments || 0,
        });
      }
      // Rate limit · 1s entre subreddits
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      log.warn({ sub, err: err instanceof Error ? err.message : String(err) }, "[reddit-scraper] error");
    }
  }
  return items;
}

// ─── 2. Forobeta (Apify web-scraper) ───────────────────────────

export async function scrapeForobeta(subforos: string[], maxResults = 30): Promise<ScrapedItem[]> {
  const log = getLogger();
  const items: ScrapedItem[] = [];
  for (const subforo of subforos) {
    try {
      const startUrl = `https://forobeta.com/forums/${subforo}/`;
      const data = await callApify("apify~web-scraper", {
        startUrls: [{ url: startUrl }],
        maxRequestsPerCrawl: maxResults,
        pageFunction: `async function pageFunction(context) {
          const $ = context.jQuery;
          const results = [];
          $('.structItem--thread').each(function() {
            const $el = $(this);
            const $title = $el.find('.structItem-title a');
            const url = 'https://forobeta.com' + $title.attr('href');
            const title = $title.text().trim();
            const author = $el.find('.structItem-parts .username').first().text().trim();
            const replies = parseInt($el.find('.structItem-cell--meta dl:contains("Respuestas") dd').text(), 10) || 0;
            const views = parseInt($el.find('.structItem-cell--meta dl:contains("Visitas") dd').text(), 10) || 0;
            results.push({ url, title, author, replies, views });
          });
          return results;
        }`,
      });
      for (const raw of data as Array<{
        url: string; title: string; author: string; replies: number; views: number;
      }>) {
        items.push({
          platform: "forobeta",
          source_key: subforo,
          thread_url: raw.url,
          thread_title: raw.title || "",
          thread_body: "",                          // Forobeta scraper aquí solo lista threads · body se podría scrape on-demand si match intent
          author_username: raw.author || "",
          author_authority: 0,
          posted_at: null,
          reach_proxy: (raw.views || 0) + (raw.replies || 0) * 5,
          competition_count: raw.replies || 0,
        });
      }
    } catch (err) {
      log.warn({ subforo, err: err instanceof Error ? err.message : String(err) }, "[forobeta-scraper] error");
    }
  }
  return items;
}

// ─── 3. Twitter/X (Apify apidojo/twitter-scraper) ──────────────

export async function scrapeTwitter(queries: string[], maxAgeHours = 48): Promise<ScrapedItem[]> {
  const log = getLogger();
  const items: ScrapedItem[] = [];
  const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;

  for (const query of queries) {
    try {
      const data = await callApify("apidojo~twitter-scraper", {
        searchTerms: [query],
        maxItems: 20,
        sort: "Latest",
        tweetLanguage: "es",
      });
      for (const raw of data as Array<{
        url: string; text: string; author?: { userName?: string; followers?: number };
        createdAt: string; likeCount?: number; replyCount?: number; viewCount?: number;
      }>) {
        const t = Date.parse(raw.createdAt || "");
        if (Number.isFinite(t) && t < cutoffMs) continue;
        items.push({
          platform: "twitter",
          source_key: query.slice(0, 60),
          thread_url: raw.url,
          thread_title: (raw.text || "").slice(0, 200),
          thread_body: raw.text || "",
          author_username: raw.author?.userName || "",
          author_authority: raw.author?.followers || 0,
          posted_at: raw.createdAt || null,
          reach_proxy: (raw.likeCount || 0) + (raw.replyCount || 0) + Math.floor((raw.viewCount || 0) / 100),
          competition_count: raw.replyCount || 0,
        });
      }
    } catch (err) {
      log.warn({ query, err: err instanceof Error ? err.message : String(err) }, "[twitter-scraper] error");
    }
  }
  return items;
}

// ─── 4. IndieHackers (Apify) ───────────────────────────────────

export async function scrapeIndieHackers(maxAgeHours = 72): Promise<ScrapedItem[]> {
  const log = getLogger();
  const items: ScrapedItem[] = [];
  const cutoffMs = Date.now() - maxAgeHours * 3600 * 1000;
  try {
    // Genérico · web-scraper sobre /questions
    const data = await callApify("apify~web-scraper", {
      startUrls: [{ url: "https://www.indiehackers.com/questions" }],
      maxRequestsPerCrawl: 30,
      pageFunction: `async function pageFunction(context) {
        const $ = context.jQuery;
        const results = [];
        $('article.feed-item, .post').each(function() {
          const $el = $(this);
          const $a = $el.find('a[href*="/post/"]').first();
          if (!$a.length) return;
          const href = $a.attr('href');
          const url = href.startsWith('http') ? href : 'https://www.indiehackers.com' + href;
          const title = $a.text().trim();
          const author = $el.find('.author, [data-author]').first().text().trim();
          const upvotes = parseInt($el.find('.upvotes, .vote-count').first().text(), 10) || 0;
          const comments = parseInt($el.find('.comment-count').first().text(), 10) || 0;
          results.push({ url, title, author, upvotes, comments });
        });
        return results;
      }`,
    });
    for (const raw of data as Array<{
      url: string; title: string; author: string; upvotes: number; comments: number;
    }>) {
      items.push({
        platform: "indiehackers",
        source_key: "questions-recent",
        thread_url: raw.url,
        thread_title: raw.title || "",
        thread_body: "",
        author_username: raw.author || "",
        author_authority: 0,
        posted_at: null,
        reach_proxy: (raw.upvotes || 0) + (raw.comments || 0) * 3,
        competition_count: raw.comments || 0,
      });
    }
  } catch (err) {
    log.warn({ err: err instanceof Error ? err.message : String(err) }, "[indiehackers-scraper] error");
  }
  // cutoffMs no aplicado aquí porque IH no expone fecha en feed · OK (filtra dedup later)
  void cutoffMs;
  return items;
}

// ─── 5. Quora (Apify) ──────────────────────────────────────────

export async function scrapeQuora(queries: string[]): Promise<ScrapedItem[]> {
  const log = getLogger();
  const items: ScrapedItem[] = [];
  for (const query of queries) {
    try {
      const data = await callApify("apify~web-scraper", {
        startUrls: [{ url: `https://es.quora.com/search?q=${encodeURIComponent(query)}` }],
        maxRequestsPerCrawl: 15,
        pageFunction: `async function pageFunction(context) {
          const $ = context.jQuery;
          const results = [];
          $('a[href*="/search/"], a.q-link--icon, .question_link').each(function() {
            const $a = $(this);
            const href = $a.attr('href');
            if (!href || !href.includes('/')) return;
            const url = href.startsWith('http') ? href : 'https://es.quora.com' + href;
            const title = $a.text().trim();
            if (title.length < 15) return;
            results.push({ url, title });
          });
          return results;
        }`,
      });
      for (const raw of data as Array<{ url: string; title: string }>) {
        items.push({
          platform: "quora",
          source_key: query.slice(0, 60),
          thread_url: raw.url,
          thread_title: raw.title || "",
          thread_body: "",
          author_username: "",
          author_authority: 0,
          posted_at: null,
          reach_proxy: 0,
          competition_count: 0,
        });
      }
    } catch (err) {
      log.warn({ query, err: err instanceof Error ? err.message : String(err) }, "[quora-scraper] error");
    }
  }
  return items;
}
