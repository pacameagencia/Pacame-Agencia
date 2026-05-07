import type { Metadata } from "next";

import { services } from "@/lib/data/services";

/**
 * Layout específico para la ruta (storybook) — añade Schema.org JSON-LD
 * con Organization + 5 Service[] + WebSite + BreadcrumbList.
 *
 * Hereda fonts/header/footer del layout root.
 */

export const metadata: Metadata = {
  title: "PACAME — Tu agencia de IA",
  description:
    "Agencia digital que resuelve problemas reales para PYMEs en España. Web, SEO, redes, ads y branding orquestados por agentes de IA supervisados por humanos. Pide tu auditoría 15 min.",
  alternates: { canonical: "https://pacameagencia.com/" },
  openGraph: {
    title: "PACAME — Tu agencia de IA",
    description:
      "5 servicios, 1 transformación. Pide tu auditoría 15 min.",
    type: "website",
    url: "https://pacameagencia.com/",
    siteName: "PACAME",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "PACAME — Tu agencia de IA",
    description: "5 servicios, 1 transformación. Pide tu auditoría 15 min.",
  },
};

interface JsonLdItem {
  "@type": string;
  [key: string]: unknown;
}

function buildJsonLd(): JsonLdItem[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "PACAME",
      url: "https://pacameagencia.com",
      logo: "https://pacameagencia.com/logo.png",
      sameAs: [
        "https://www.instagram.com/pacamespain",
        "https://www.linkedin.com/company/pacame",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "PACAME",
      url: "https://pacameagencia.com",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://pacameagencia.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    ...services.slice(0, 5).map((service) => ({
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.name,
      description: service.description,
      provider: {
        "@type": "Organization",
        name: "PACAME",
        url: "https://pacameagencia.com",
      },
      areaServed: { "@type": "Country", name: "España" },
      category: service.category,
    })),
  ];
}

export default function StorybookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = buildJsonLd();

  return (
    <>
      {jsonLd.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      {children}
    </>
  );
}
