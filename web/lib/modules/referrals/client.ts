/**
 * Client-safe entry point for the referrals module.
 *
 * Use this from Client Components and pages to avoid pulling in server-only
 * dependencies (next/headers, supabase server client, etc.).
 */

export { Tabs } from "./components/Tabs";
export type { TabItem } from "./components/Tabs";
export { StatusPill } from "./components/StatusPill";
export { SparkChart } from "./components/SparkChart";
export type { SparkPoint } from "./components/SparkChart";
export { AffiliateContentLibrary } from "./components/AffiliateContentLibrary";
export type { ContentAsset } from "./components/AffiliateContentLibrary";
export { ReferralLinkCard } from "./components/ReferralLinkCard";
export { AffiliateDashboard } from "./components/AffiliateDashboard";
export { ReferralTrackerProvider } from "./components/ReferralTrackerProvider";
export { useAffiliateLink } from "./hooks/useAffiliateLink";
export { useReferralTracker } from "./hooks/useReferralTracker";
