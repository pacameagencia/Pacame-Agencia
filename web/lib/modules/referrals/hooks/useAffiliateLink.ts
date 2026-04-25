"use client";

import { useCallback, useMemo, useState } from "react";

export function useAffiliateLink(code: string, baseUrl?: string, urlParam: string = "ref") {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    const origin =
      baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
    return `${origin}/?${urlParam}=${encodeURIComponent(code)}`;
  }, [code, baseUrl, urlParam]);

  const copy = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [url]);

  return { url, copy, copied };
}
