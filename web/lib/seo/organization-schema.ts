/**
 * PACAME — Organization Schema.org
 *
 * Single source of truth for the Organization JSON-LD that goes in <head> globally.
 * Slots for awards / memberOf / hasCredential are filled when verifications land.
 */

export const PACAME_ORG = {
  name: "PACAME",
  legalName: "PACAME Agencia",
  url: "https://pacameagencia.com",
  logo: "https://pacameagencia.com/icon.png",
  ogImage: "https://pacameagencia.com/generated/optimized/og/home.webp",
  description:
    "Agencia digital española con 7 agentes IA especializados liderados por humanos. Web, SEO, redes, ads y branding desde 300 €. PYMEs en toda España.",
  founder: {
    name: "Pablo Calleja",
    jobTitle: "CEO y Director editorial",
    url: "https://pacameagencia.com/sobre-pablo",
  },
  foundingDate: "2026-01-01",
  numberOfEmployees: "7+",
  address: {
    streetAddress: "Madrid",
    addressLocality: "Madrid",
    addressRegion: "Comunidad de Madrid",
    addressCountry: "ES",
    postalCode: "28001",
  },
  contactPoint: {
    telephone: "+34-722-669-381",
    contactType: "customer service",
    email: "hola@pacameagencia.com",
    areaServed: "ES",
    availableLanguage: ["Spanish", "Catalan", "English"],
  },
  sameAs: [
    "https://www.linkedin.com/company/pacameagencia",
    "https://www.instagram.com/pacameagencia",
    "https://twitter.com/pacameagencia",
    "https://github.com/pacameagencia",
    "https://wa.me/34722669381",
  ],
  /** Slots — only emitted when status === "verified" */
  pendingVerifications: [
    { name: "Sequra", logo: "/logos/associations/sequra.svg", status: "pending" as const },
    { name: "ICEX", logo: "/logos/associations/icex.svg", status: "pending" as const },
    { name: "Cámara de Madrid", logo: "/logos/associations/camara.svg", status: "pending" as const },
    { name: "Stripe Verified Partner", logo: "/logos/partners/stripe.svg", status: "pending" as const },
    { name: "Google Partner", logo: "/logos/partners/google.svg", status: "pending" as const },
    { name: "Meta Business Partner", logo: "/logos/partners/meta.svg", status: "pending" as const },
  ],
  verifiedAwards: [] as Array<{ name: string; year: string; url?: string }>,
  verifiedMemberships: [] as Array<{ name: string; url?: string }>,
  verifiedCredentials: [] as Array<{ name: string; url?: string }>,
};

export interface OrganizationSchemaOptions {
  includeFounder?: boolean;
  includeContactPoint?: boolean;
}

export function buildOrganizationSchema(opts: OrganizationSchemaOptions = {}) {
  const includeFounder = opts.includeFounder ?? true;
  const includeContactPoint = opts.includeContactPoint ?? true;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${PACAME_ORG.url}#organization`,
    name: PACAME_ORG.name,
    legalName: PACAME_ORG.legalName,
    url: PACAME_ORG.url,
    logo: PACAME_ORG.logo,
    image: PACAME_ORG.ogImage,
    description: PACAME_ORG.description,
    foundingDate: PACAME_ORG.foundingDate,
    address: {
      "@type": "PostalAddress",
      ...PACAME_ORG.address,
    },
    sameAs: PACAME_ORG.sameAs,
  };

  if (includeFounder) {
    schema.founder = {
      "@type": "Person",
      name: PACAME_ORG.founder.name,
      jobTitle: PACAME_ORG.founder.jobTitle,
      url: PACAME_ORG.founder.url,
    };
  }

  if (includeContactPoint) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      ...PACAME_ORG.contactPoint,
    };
  }

  if (PACAME_ORG.verifiedAwards.length) {
    schema.award = PACAME_ORG.verifiedAwards.map((a) => a.name);
  }

  if (PACAME_ORG.verifiedMemberships.length) {
    schema.memberOf = PACAME_ORG.verifiedMemberships.map((m) => ({
      "@type": "Organization",
      name: m.name,
      ...(m.url ? { url: m.url } : {}),
    }));
  }

  if (PACAME_ORG.verifiedCredentials.length) {
    schema.hasCredential = PACAME_ORG.verifiedCredentials.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.name,
      ...(c.url ? { url: c.url } : {}),
    }));
  }

  return schema;
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${PACAME_ORG.url}#website`,
    url: PACAME_ORG.url,
    name: PACAME_ORG.name,
    description: PACAME_ORG.description,
    inLanguage: "es-ES",
    publisher: { "@id": `${PACAME_ORG.url}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${PACAME_ORG.url}/buscar?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
