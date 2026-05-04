/**
 * DarkRoom · Renderer de documento legal.
 *
 * Estilo dark minimalista. Renderiza un título + fecha + secciones numeradas.
 * Server component (no client-side, no JS shipped al usuario).
 */

import type { ReactNode } from "react";

const STYLE = {
  h1: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    margin: "0 0 8px",
  } as const,
  metaLine: {
    color: "#71717A",
    fontSize: 13,
    margin: "0 0 32px",
  } as const,
  intro: {
    color: "#D4D4D8",
    fontSize: 15,
    marginBottom: 28,
  } as const,
  h2: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: 18,
    fontWeight: 600,
    margin: "32px 0 12px",
    color: "#F5F5F0",
  } as const,
  h3: {
    fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontSize: 15,
    fontWeight: 600,
    margin: "20px 0 8px",
    color: "#F5F5F0",
  } as const,
  p: {
    margin: "0 0 12px",
    color: "#D4D4D8",
  } as const,
  ul: {
    margin: "0 0 12px",
    paddingLeft: 22,
    color: "#D4D4D8",
  } as const,
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    margin: "12px 0 20px",
    fontSize: 14,
  } as const,
  th: {
    textAlign: "left" as const,
    padding: "8px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    color: "#A1A1AA",
    fontWeight: 600,
  } as const,
  td: {
    padding: "8px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    color: "#D4D4D8",
    verticalAlign: "top" as const,
  } as const,
  code: {
    fontFamily:
      '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
    fontSize: 13,
    background: "rgba(255,255,255,0.06)",
    padding: "1px 6px",
    borderRadius: 4,
  } as const,
};

interface LegalDocumentProps {
  title: string;
  /** Fecha o "Versión X · entrada en vigor pendiente" */
  meta: string;
  /** Párrafo introductorio antes de las secciones. */
  intro?: ReactNode;
  /** Hijos (las secciones JSX). Usar <LegalSection> para coherencia. */
  children: ReactNode;
}

export default function LegalDocument({ title, meta, intro, children }: LegalDocumentProps) {
  return (
    <article>
      <h1 style={STYLE.h1}>{title}</h1>
      <p style={STYLE.metaLine}>{meta}</p>
      {intro ? <div style={STYLE.intro}>{intro}</div> : null}
      {children}
    </article>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: number | string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 style={STYLE.h2}>
        {number}. {title}
      </h2>
      {children}
    </section>
  );
}

export function LegalSubsection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 style={STYLE.h3}>
        {number} {title}
      </h3>
      {children}
    </section>
  );
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p style={STYLE.p}>{children}</p>;
}

export function LegalUL({ children }: { children: ReactNode }) {
  return <ul style={STYLE.ul}>{children}</ul>;
}

export function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <table style={STYLE.table}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={STYLE.th}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} style={STYLE.td}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LegalCode({ children }: { children: ReactNode }) {
  return <code style={STYLE.code}>{children}</code>;
}
