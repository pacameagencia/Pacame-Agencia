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

export { extractIp, fingerprint, checkVisitFraud, ipConversionCapExceeded } from "./fraud";

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
} from "./db";
export type { Campaign, Affiliate } from "./db";

export { loadAffiliateStats } from "./stats";
export type { AffiliateStats } from "./stats";

export { Tabs } from "./components/Tabs";
export type { TabItem } from "./components/Tabs";
export { StatusPill } from "./components/StatusPill";
export { SparkChart } from "./components/SparkChart";
export type { SparkPoint } from "./components/SparkChart";
export { AffiliateContentLibrary } from "./components/AffiliateContentLibrary";
export type { ContentAsset } from "./components/AffiliateContentLibrary";
