const WIKILINK = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;

export function extractWikilinks(body: string): string[] {
  const out = new Set<string>();
  for (const m of body.matchAll(WIKILINK)) {
    const target = m[1].trim();
    if (target) out.add(target);
  }
  return [...out];
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\- _]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}
