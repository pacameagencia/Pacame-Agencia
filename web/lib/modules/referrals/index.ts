export { loadReferralConfig, REF_COOKIE_NAME } from "./config";
export type { ReferralConfig, AttributionMode } from "./config";

export { setReferralsAdapter, getReferralsAdapter } from "./adapters";
export type { ReferralsAdapter, AuthedUser } from "./adapters";

export { getAuthedUser } from "./session";

export {
  readRefCookie,
  readRefCookieFromRequest,
  writeRefCookieOnResponse,
  clearRefCookieOnResponse,
} from "./cookie";
export type { RefCookieValue } from "./cookie";

export { resolveAttribution } from "./attribution";
export type { AttributionResult, AffiliateRow } from "./attribution";

export {
  extractIp,
  fingerprint,
  checkVisitFraud,
  ipConversionCapExceeded,
  isBotUserAgent,
} from "./fraud";

export {
  attachReferralToCheckoutSession,
  processCheckoutSession,
  processInvoicePaid,
  processRefundClawback,
} from "./stripe";
export type { CheckoutSessionInput } from "./stripe";

export {
  getDefaultCampaign,
  getCampaignById,
  getOrCreateAffiliate,
  getAffiliateById,
  getAffiliateByCode,
  listBrands,
  getBrandBySlug,
  getBrandById,
  listBrandProducts,
  getBrandProductByKey,
  resolveProductForAffiliate,
  getAffiliateBrandIds,
} from "./db";
export type { Campaign, Affiliate, Brand, BrandProduct } from "./db";

export { loadAffiliateStats } from "./stats";
export type { AffiliateStats } from "./stats";

// Components/hooks: import these from `@/lib/modules/referrals/client`
// from Client Components, NOT from this barrel — this file pulls in
// server-only code (next/headers, service-role supabase) and breaks
// when imported transitively from a 'use client' tree.
