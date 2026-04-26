/**
 * PACAME — Service & Offer Schema builders.
 */

import { PACAME_ORG } from "./organization-schema";

export interface ServiceSchemaInput {
  name: string;
  description: string;
  url: string;
  serviceType: string;
  priceFrom: number;
  priceCurrency?: string;
  areaServed?: string | string[];
  category?: string;
  imageUrl?: string;
}

export function buildServiceSchema(input: ServiceSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: input.url,
    serviceType: input.serviceType,
    image: input.imageUrl,
    category: input.category,
    provider: { "@id": `${PACAME_ORG.url}#organization` },
    areaServed: input.areaServed
      ? Array.isArray(input.areaServed)
        ? input.areaServed.map((a) => ({ "@type": "AdministrativeArea", name: a }))
        : { "@type": "Country", name: input.areaServed }
      : { "@type": "Country", name: "España" },
    offers: {
      "@type": "Offer",
      price: input.priceFrom,
      priceCurrency: input.priceCurrency || "EUR",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "PriceSpecification",
        price: input.priceFrom,
        priceCurrency: input.priceCurrency || "EUR",
        valueAddedTaxIncluded: false,
      },
    },
  };
}

export interface ProductPlanInput {
  name: string;
  description: string;
  url: string;
  price: number;
  priceCurrency?: string;
  imageUrl?: string;
  highlights?: string[];
}

export function buildProductPlanSchema(input: ProductPlanInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.imageUrl,
    brand: { "@type": "Brand", name: "PACAME" },
    additionalProperty: input.highlights?.map((h) => ({
      "@type": "PropertyValue",
      name: "highlight",
      value: h,
    })),
    offers: {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.priceCurrency || "EUR",
      availability: "https://schema.org/InStock",
      seller: { "@id": `${PACAME_ORG.url}#organization` },
    },
  };
}
