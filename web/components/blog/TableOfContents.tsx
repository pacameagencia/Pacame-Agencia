"use client";

import { useEffect, useState } from "react";
import type { TocHeading } from "@/lib/blog-utils";

interface TableOfContentsProps {
  headings: TocHeading[];
  accentColor?: string;
}

/**
 * TOC sticky que resalta la seccion visible en pantalla.
 */
export default function TableOfContents({
  headings,
  accentColor = "#D4A574",
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!headings.length) return;

    // Observer que marca el heading visible en el primer tercio del viewport
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        )[0];
        setActiveId(top.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav
      aria-label="Indice del articulo"
      className="text-sm font-body"
    >
      <p className="uppercase tracking-[0.2em] text-[11px] text-olympus-gold/70 font-medium mb-4">
        En este articulo
      </p>
      <ol className="space-y-2 border-l border-white/[0.06]">
        {headings.map((h) => {
          const isActive = activeId === h.id;
          return (
            <li key={h.id} className={h.level === 3 ? "ml-3" : ""}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(h.id);
                  if (!el) return;
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${h.id}`);
                }}
                className="block -ml-px pl-4 py-1 border-l-2 transition-colors"
                style={{
                  borderColor: isActive ? accentColor : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                }}
              >
                <span className="hover:text-pacame-white/80 transition-colors block">
                  {h.text}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
