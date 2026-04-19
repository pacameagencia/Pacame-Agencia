// Utilidades puras para el blog: parse de headings, slugify y reading time.

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Slugify basico compatible con IDs de anchor.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita diacriticos
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Extrae headings nivel 2 y 3 del markdown ligero usado en los posts.
 * Devuelve array ordenado con IDs unicos para el TOC.
 */
export function extractHeadings(markdown: string): TocHeading[] {
  const seen = new Map<string, number>();
  const headings: TocHeading[] = [];

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    let level: 2 | 3 | null = null;
    let text = "";

    if (line.startsWith("### ")) {
      level = 3;
      text = line.slice(4).trim();
    } else if (line.startsWith("## ")) {
      level = 2;
      text = line.slice(3).trim();
    }

    if (level === null) continue;

    const base = slugify(text) || `section-${headings.length + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * Calcula minutos de lectura estimados a 200 palabras/minuto.
 */
export function readingTimeMinutes(text: string): number {
  const words = text
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
