"use client";

import { useEffect } from "react";

/**
 * Mounts once per page load. If the URL contains `?ref=CODE` (or the
 * configured param), POSTs it to /api/referrals/track so the server can
 * validate the affiliate, register a visit, and write the cookie.
 */
export function useReferralTracker(urlParam: string = "ref") {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get(urlParam);
    if (!ref) return;

    const controller = new AbortController();
    fetch("/api/referrals/track", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ref,
        path: window.location.pathname,
        utm: {
          source: params.get("utm_source") || undefined,
          medium: params.get("utm_medium") || undefined,
          campaign: params.get("utm_campaign") || undefined,
        },
        referer: document.referrer || undefined,
      }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      /* swallow — never break the page for tracking */
    });

    return () => controller.abort();
  }, [urlParam]);
}
