"use client";

import { useEffect, useState } from "react";
import { Tabs } from "./Tabs";

export type ContentAsset = {
  id: string;
  type: string;
  category: string | null;
  title: string;
  description: string | null;
  body: string | null;
  preview_url: string | null;
  download_url: string | null;
  mime_type: string | null;
  bytes: number | null;
  tags: string[];
  downloads: number;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  banner: "Banners",
  post: "Posts",
  email: "Emails",
  video: "Vídeos",
  script: "Scripts",
  copy: "Copy",
  template: "Plantillas",
  other: "Otros",
};

export function AffiliateContentLibrary() {
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referrals/content", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Error");
        return r.json() as Promise<{ assets: ContentAsset[] }>;
      })
      .then((j) => setAssets(j.assets))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink/60">Cargando biblioteca…</p>;
  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!assets.length) {
    return (
      <p className="rounded-md border border-dashed border-ink/20 p-6 text-sm text-ink/60">
        Aún no hay material disponible. Vuelve pronto: estamos preparando banners,
        copy de email y posts listos para que vendas más fácil a tu comunidad.
      </p>
    );
  }

  const grouped = new Map<string, ContentAsset[]>();
  for (const a of assets) {
    const list = grouped.get(a.type) ?? [];
    list.push(a);
    grouped.set(a.type, list);
  }

  const tabItems = [
    { id: "all", label: "Todos", count: assets.length },
    ...Array.from(grouped.entries()).map(([type, list]) => ({
      id: type,
      label: TYPE_LABELS[type] ?? type,
      count: list.length,
    })),
  ];

  return (
    <Tabs items={tabItems}>
      {(active) => (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(active === "all" ? assets : grouped.get(active) ?? []).map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      )}
    </Tabs>
  );
}

function AssetCard({ asset }: { asset: ContentAsset }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!asset.body) return;
    await navigator.clipboard.writeText(asset.body);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const download = async () => {
    const r = await fetch("/api/referrals/content/track-download", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ asset_id: asset.id }),
    });
    if (!r.ok) return;
    const data = (await r.json()) as { download_url: string | null };
    if (data.download_url) window.open(data.download_url, "_blank");
  };

  return (
    <article className="flex flex-col rounded-md border border-ink/10 bg-paper p-4">
      {asset.preview_url && (
        <img
          src={asset.preview_url}
          alt=""
          className="mb-3 h-32 w-full rounded-sm object-cover"
        />
      )}
      <div className="mb-1 flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-ink">{asset.title}</h4>
        <span className="text-xs uppercase tracking-wide text-ink/50">{asset.type}</span>
      </div>
      {asset.description && (
        <p className="mb-3 text-xs text-ink/60">{asset.description}</p>
      )}
      {asset.body && (
        <pre className="mb-3 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-sm bg-ink/5 p-2 text-xs text-ink">
          {asset.body}
        </pre>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        {asset.body && (
          <button
            type="button"
            onClick={copy}
            className="rounded-sm border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5"
          >
            {copied ? "Copiado" : "Copiar texto"}
          </button>
        )}
        {asset.download_url && (
          <button
            type="button"
            onClick={download}
            className="rounded-sm bg-terracotta-500 px-3 py-1.5 text-xs font-medium text-paper hover:bg-terracotta-600"
          >
            Descargar
          </button>
        )}
      </div>
      {asset.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {asset.tags.map((t) => (
            <span key={t} className="rounded-sm bg-ink/5 px-1.5 py-0.5 text-[10px] uppercase text-ink/60">
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
