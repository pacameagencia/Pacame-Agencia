"use client";

import { useAffiliateLink } from "../hooks/useAffiliateLink";

type Props = {
  code: string;
  urlParam?: string;
  baseUrl?: string;
  description?: string;
};

export function ReferralLinkCard({
  code,
  urlParam = "ref",
  baseUrl,
  description = "Gana 20% de comisión durante 12 meses por cada cliente que pague.",
}: Props) {
  const { url, copy, copied } = useAffiliateLink(code, baseUrl, urlParam);

  return (
    <div className="rounded-md border border-ink/10 bg-paper p-4">
      <h3 className="text-sm font-medium text-ink">Tu enlace de referido</h3>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={url}
          aria-label="Enlace de referido"
          className="flex-1 rounded-sm border border-ink/15 bg-paper px-3 py-2 font-mono text-xs text-ink"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-sm bg-terracotta-500 px-4 py-2 text-sm font-medium text-paper transition hover:bg-terracotta-600"
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink/60">{description}</p>
    </div>
  );
}
