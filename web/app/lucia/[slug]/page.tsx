/**
 * /lucia/[slug] — Landing programática SEO. Renderiza variantes definidas en
 * lib/lucia/landing-variants.ts. Cada slug es una página única para una
 * keyword distinta (vs-chatgpt, para-autonomos, para-mayores, que-es).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getVariant, listVariantSlugs } from "@/lib/lucia/landing-variants";
import ReferralCapture from "../ReferralCapture";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  return listVariantSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const v = getVariant(slug);
  if (!v) return { title: "PACAME GPT" };
  const url = `https://pacameagencia.com/lucia/${slug}`;
  return {
    title: v.title,
    description: v.description,
    keywords: v.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: v.title,
      description: v.description,
      url,
      type: "website",
      locale: "es_ES",
      siteName: "PACAME GPT",
    },
    twitter: { card: "summary_large_image", title: v.title, description: v.description },
    robots: { index: true, follow: true },
  };
}

export default async function VariantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const v = getVariant(slug);
  if (!v) notFound();

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "PACAME", item: "https://pacameagencia.com" },
      { "@type": "ListItem", position: 2, name: "PACAME GPT", item: "https://pacameagencia.com/lucia" },
      { "@type": "ListItem", position: 3, name: v.title, item: `https://pacameagencia.com/lucia/${slug}` },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: v.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4efe3",
        color: "#1a1813",
        fontFamily: "var(--font-instrument-sans), system-ui, sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <ReferralCapture />

      {/* Hero */}
      <section style={{ maxWidth: 880, margin: "0 auto", padding: "72px 24px 32px", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            background: "rgba(232,183,48,0.18)",
            color: "#9b7714",
            padding: "5px 14px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: 22,
          }}
        >
          {v.hero.kicker}
        </span>
        <h1
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "clamp(36px, 5.5vw, 60px)",
            fontWeight: 500,
            letterSpacing: "-0.025em",
            margin: "0 0 18px",
            lineHeight: 1.05,
          }}
        >
          {v.hero.headline}
        </h1>
        <p style={{ fontSize: "clamp(16px, 1.5vw, 19px)", color: "#3a362c", lineHeight: 1.55, maxWidth: 640, margin: "0 auto" }}>
          {v.hero.sub}
        </p>
        <div style={{ marginTop: 28 }}>
          <Link
            href="/pacame-gpt/login"
            style={{
              background: "#1a1813",
              color: "#f4efe3",
              padding: "14px 26px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
            }}
          >
            {v.cta.primary} →
          </Link>
          <p style={{ fontSize: 13, color: "#6e6858", marginTop: 12 }}>{v.cta.subtext}</p>
        </div>
      </section>

      {/* Frictions */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 60px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 18,
          }}
        >
          {v.pains.map((p, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(26,24,19,0.08)",
                borderRadius: 16,
                padding: 22,
              }}
            >
              <div style={{ color: "#9c3e24", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                ✗ {p.bad}
              </div>
              <div style={{ color: "#555f28", fontSize: 14, lineHeight: 1.5 }}>✓ {p.good}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 60px" }}>
        <h2
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "clamp(24px, 3vw, 32px)",
            fontWeight: 500,
            margin: "0 0 22px",
            textAlign: "center",
          }}
        >
          Preguntas frecuentes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {v.faq.map((f, i) => (
            <details
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(26,24,19,0.08)",
                borderRadius: 14,
                padding: "14px 18px",
              }}
            >
              <summary style={{ fontWeight: 600, fontSize: 15, cursor: "pointer", listStyle: "none" }}>
                {f.q}
              </summary>
              <p style={{ fontSize: 14, color: "#3a362c", lineHeight: 1.55, marginTop: 10 }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: "linear-gradient(135deg, #b54e30 0%, #9c3e24 100%)",
          color: "#f9f5ea",
          padding: "56px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "clamp(28px, 4vw, 38px)",
            fontWeight: 500,
            margin: "0 0 12px",
          }}
        >
          ¿Lo probamos?
        </h2>
        <p style={{ fontSize: 16, opacity: 0.92, marginBottom: 22 }}>{v.cta.subtext}</p>
        <Link
          href="/pacame-gpt/login"
          style={{
            background: "#f9f5ea",
            color: "#7a2e18",
            padding: "16px 28px",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
          }}
        >
          {v.cta.primary} →
        </Link>
      </section>

      <footer
        style={{
          padding: "32px 24px",
          textAlign: "center",
          color: "#6e6858",
          fontSize: 13,
        }}
      >
        <p style={{ margin: "0 0 6px" }}>
          <Link href="/lucia" style={{ color: "#9c3e24" }}>← Volver a PACAME GPT</Link>
        </p>
      </footer>
    </main>
  );
}
