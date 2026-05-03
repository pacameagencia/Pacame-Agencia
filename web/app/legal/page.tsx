/**
 * DarkRoom · /legal — hub de documentación legal.
 *
 * Página simple con los 4 documentos legales sin teasers, sin marketing,
 * sin destacar ninguno. Diseño funcional minimalista. Cumple
 * `strategy/darkroom/proteccion-identidad.md` regla 3 (no señalizar).
 */

import { ensureDarkRoomHost } from "@/lib/darkroom/host-guard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Información legal · DarkRoom",
  description: "Documentación legal de DarkRoom.",
};

const SECTIONS: Array<{ slug: string; title: string }> = [
  { slug: "terminos", title: "Términos y condiciones de uso" },
  { slug: "privacidad", title: "Política de privacidad" },
  { slug: "cookies", title: "Política de cookies" },
  { slug: "aviso-legal", title: "Aviso legal" },
];

export default async function LegalHubPage() {
  await ensureDarkRoomHost();

  return (
    <article>
      <h1
        style={{
          fontFamily:
            '"Space Grotesk", Inter, system-ui, sans-serif',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          marginBottom: 12,
        }}
      >
        Información legal
      </h1>
      <p style={{ color: "#A1A1AA", marginBottom: 36, fontSize: 15 }}>
        Documentación legal de DarkRoom.
      </p>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
        }}
      >
        {SECTIONS.map((s) => (
          <li
            key={s.slug}
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "16px 0",
            }}
          >
            <a
              href={`/legal/${s.slug}`}
              style={{
                color: "#F5F5F0",
                textDecoration: "none",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{s.title}</span>
              <span style={{ color: "#52525B", fontSize: 13 }}>→</span>
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
