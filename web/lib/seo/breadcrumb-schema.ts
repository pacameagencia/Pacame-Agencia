/**
 * PACAME — Breadcrumb Schema builder.
 *
 * Usage:
 *   buildBreadcrumbSchema([
 *     { name: "Inicio", url: "https://pacameagencia.com/" },
 *     { name: "Servicios", url: "https://pacameagencia.com/servicios" },
 *     { name: "SEO", url: "https://pacameagencia.com/servicios/seo" },
 *   ])
 */

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
