import type { ServiceDelivery } from "./types";
import { CopyHeroCTADelivery } from "./services/copy-hero-cta";
import { PostInstagramDelivery } from "./services/post-instagram";
import { FaviconPackDelivery } from "./services/favicon-pack";
import { SEOAuditPDFDelivery } from "./services/seo-audit-pdf";

/**
 * Registry of all service delivery implementations.
 * The orchestrator (/api/deliveries/start) dispatches by service_slug.
 *
 * To add a new product:
 *   1. Create a class in ./services/<slug>.ts extending BaseDelivery
 *   2. Import + register here
 *   3. Insert the product row in service_catalog
 */
export const DELIVERY_REGISTRY: Record<string, ServiceDelivery> = {
  "copy-hero-cta": new CopyHeroCTADelivery(),
  "post-instagram": new PostInstagramDelivery(),
  "favicon-pack": new FaviconPackDelivery(),
  "seo-audit-pdf": new SEOAuditPDFDelivery(),
  // Sprint 3: logo-express, landing-1page
};

export function getDelivery(slug: string): ServiceDelivery | null {
  return DELIVERY_REGISTRY[slug] || null;
}

export function listDeliverySlugs(): string[] {
  return Object.keys(DELIVERY_REGISTRY);
}
