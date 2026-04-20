/**
 * JSON-LD Organization schema site-wide.
 * Se inyecta desde el root layout.
 */
export default function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://pacameagencia.com/#organization",
        name: "PACAME",
        alternateName: "PACAME Agencia",
        url: "https://pacameagencia.com",
        logo: {
          "@type": "ImageObject",
          url: "https://pacameagencia.com/opengraph-image",
          width: 1200,
          height: 630,
        },
        description:
          "Plataforma de servicios digitales con IA para PYMEs. Marketplace con 24+ productos, apps productizadas (reservas online, asistente WhatsApp IA), 4 planes mensuales. Entregados por agentes IA con supervision humana.",
        email: "hola@pacameagencia.com",
        telephone: "+34 722 669 381",
        address: {
          "@type": "PostalAddress",
          addressCountry: "ES",
        },
        founder: {
          "@type": "Person",
          name: "Pablo Calleja",
        },
        foundingDate: "2026",
        sameAs: [
          "https://www.linkedin.com/company/pacame-agencia",
          "https://instagram.com/pacameagencia",
          "https://twitter.com/pacameagencia",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "Customer Service",
          email: "hola@pacameagencia.com",
          telephone: "+34 722 669 381",
          availableLanguage: ["Spanish", "English"],
          areaServed: ["ES", "LATAM"],
        },
        areaServed: {
          "@type": "Place",
          name: "Spain, LATAM",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://pacameagencia.com/#website",
        url: "https://pacameagencia.com",
        name: "PACAME — Plataforma de servicios digitales IA",
        publisher: { "@id": "https://pacameagencia.com/#organization" },
        inLanguage: "es-ES",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://pacameagencia.com/buscar?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
