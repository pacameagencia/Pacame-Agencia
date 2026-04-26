/**
 * PACAME — LocalBusiness schema for programmatic city pages.
 */

import { PACAME_ORG } from "./organization-schema";

export interface CityPageInput {
  city: string;
  region: string;
  postalCode?: string;
  url: string;
  description: string;
  imageUrl?: string;
}

export function buildLocalBusinessSchema(input: CityPageInput) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${input.url}#localbusiness`,
    name: `PACAME · Agencia digital en ${input.city}`,
    description: input.description,
    url: input.url,
    image: input.imageUrl,
    parentOrganization: { "@id": `${PACAME_ORG.url}#organization` },
    address: {
      "@type": "PostalAddress",
      addressLocality: input.city,
      addressRegion: input.region,
      addressCountry: "ES",
      ...(input.postalCode ? { postalCode: input.postalCode } : {}),
    },
    areaServed: {
      "@type": "City",
      name: input.city,
    },
    priceRange: "€€",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "19:00",
    },
    telephone: PACAME_ORG.contactPoint.telephone,
    email: PACAME_ORG.contactPoint.email,
  };
}
