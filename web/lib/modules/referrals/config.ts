export type AttributionMode = "last_click" | "first_click";

export type ReferralConfig = {
  tenantId: string;
  cookieName: string;
  cookieDays: number;
  urlParam: string;
  commissionPercent: number;
  maxCommissionMonths: number;
  attribution: AttributionMode;
  approvalDays: number;
  ipConversionCap24h: number;
  visitRateLimitPerHour: number;
};

export const REF_COOKIE_NAME = "pacame_ref";

export function loadReferralConfig(overrides: Partial<ReferralConfig> = {}): ReferralConfig {
  return {
    tenantId: process.env.REFERRAL_TENANT_ID || "pacame",
    cookieName: REF_COOKIE_NAME,
    cookieDays: numFromEnv("REFERRAL_COOKIE_DAYS", 30),
    urlParam: process.env.REFERRAL_URL_PARAM || "ref",
    commissionPercent: numFromEnv("REFERRAL_COMMISSION_PERCENT", 20),
    maxCommissionMonths: numFromEnv("REFERRAL_MAX_MONTHS", 12),
    attribution: (process.env.REFERRAL_ATTRIBUTION as AttributionMode) || "last_click",
    approvalDays: numFromEnv("REFERRAL_APPROVAL_DAYS", 30),
    ipConversionCap24h: numFromEnv("REFERRAL_IP_CONVERSION_CAP_24H", 5),
    visitRateLimitPerHour: numFromEnv("REFERRAL_VISIT_RATE_LIMIT_PER_HOUR", 20),
    ...overrides,
  };
}

function numFromEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
