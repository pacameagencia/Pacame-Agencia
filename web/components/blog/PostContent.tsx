import type { ReactNode } from "react";
import { extractHeadings, slugify } from "@/lib/blog-utils";

interface PostContentProps {
  markdown: string;
}

/**
 * Renderer server-side para el markdown ligero que usamos en los posts.
 * Soporta: ## ### (con IDs para anchors), parrafos, **bold**, - listas,
 * tablas basicas | col | y --- separadores.
 * No depende de ninguna libreria — suficiente para el contenido actual.
 */
export default function PostContent({ markdown }: PostContentProps) {
  const lines = markdown.split("\n");
  const nodes: ReactNode[] = [];
  // Mantenemos los mismos IDs que genera extractHeadings para que el TOC enlaze
  const knownHeadings = extractHeadings(markdown);
  const headingIds: Record<string, string[]> = {};
  for (const h of knownHeadings) {
    const arr = headingIds[h.text] ?? [];
    arr.push(h.id);
    headingIds[h.text] = arr;
  }

  let listBuffer: string[] = [];
  let tableBuffer: string[] = [];

  function flushList() {
    if (listBuffer.length === 0) return;
    nodes.push(
      <ul
        key={`ul-${nodes.length}`}
        className="list-disc pl-6 space-y-2 my-5 marker:text-accent-gold/70"
      >
        {listBuffer.map((item, i) => (
          <li
            key={i}
            className="text-ink/75 font-body leading-relaxed"
          >
            {renderInline(item)}
          </li>
        ))}
      </ul>,
    );
    listBuffer = [];
  }

  function flushTable() {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer
      .map((r) =>
        r
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim()),
      )
      .filter((r) => r.length > 0);
    // Primera fila header, segunda separador, resto body
    const [header, , ...body] = rows;
    if (!header || body.length === 0) {
      tableBuffer = [];
      return;
    }
    nodes.push(
      <div
        key={`tbl-${nodes.length}`}
        className="my-8 overflow-x-auto rounded-xl border border-ink/[0.06]"
      >
        <table className="w-full text-sm font-body">
          <thead className="bg-white/[0.02]">
            <tr>
              {header.map((h, i) => (
                <th
                  key={i}
                  className="text-left px-4 py-3 text-accent-gold font-heading font-medium text-xs uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, r) => (
              <tr
                key={r}
                className="border-t border-white/[0.04] hover:bg-white/[0.01]"
              >
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className="px-4 py-3 text-ink/70"
                  >
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    tableBuffer = [];
  }

  // Counters para generar IDs consistentes con extractHeadings
  const idUsage = new Map<string, number>();
  function nextIdFor(text: string): string {
    const base = slugify(text) || "section";
    const used = idUsage.get(base) ?? 0;
    idUsage.set(base, used + 1);
    return used === 0 ? base : `${base}-${used}`;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (line.startsWith("|")) {
      flushList();
      tableBuffer.push(line);
      continue;
    } else {
      flushTable();
    }

    if (line.startsWith("### ")) {
      flushList();
      const text = line.slice(4).trim();
      const id = nextIdFor(text);
      nodes.push(
        <h3
          key={`h3-${i}`}
          id={id}
          className="font-heading font-semibold text-lg md:text-xl text-ink mt-10 mb-3 scroll-mt-32"
        >
          {text}
        </h3>,
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      const text = line.slice(3).trim();
      const id = nextIdFor(text);
      nodes.push(
        <h2
          key={`h2-${i}`}
          id={id}
          className="font-heading font-bold text-2xl md:text-3xl text-ink mt-14 mb-5 scroll-mt-32"
        >
          {text}
        </h2>,
      );
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuffer.push(line.slice(2));
      continue;
    } else if (listBuffer.length > 0 && line === "") {
      // Mantenemos el buffer hasta encontrar no-lista; ignoramos line vacia intermedia
      continue;
    } else {
      flushList();
    }

    if (line.startsWith("---")) {
      nodes.push(
        <hr
          key={`hr-${i}`}
          className="border-0 h-px bg-gradient-to-r from-transparent via-accent-gold/20 to-transparent my-12"
        />,
      );
      continue;
    }

    if (line === "") {
      continue;
    }

    nodes.push(
      <p
        key={`p-${i}`}
        className="text-ink/75 font-body text-base md:text-lg leading-relaxed my-5"
      >
        {renderInline(line)}
      </p>,
    );
  }

  flushList();
  flushTable();

  return <div>{nodes}</div>;
}

/**
 * Renderiza negritas **foo** como <strong>. Se mantiene deliberadamente minimal.
 */
function renderInline(text: string): ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, j) =>
    j % 2 === 1 ? (
      <strong key={j} className="text-ink font-semibold">
        {part}
      </strong>
    ) : (
      <span key={j}>{part}</span>
    ),
  );
}
