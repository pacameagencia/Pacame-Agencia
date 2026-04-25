"use client";

import { useEffect, useState } from "react";

const TYPES = ["banner", "post", "email", "video", "script", "copy", "template", "other"] as const;
type AssetType = (typeof TYPES)[number];

type Asset = {
  id: string;
  type: AssetType;
  category: string | null;
  title: string;
  description: string | null;
  body: string | null;
  preview_url: string | null;
  download_url: string | null;
  mime_type: string | null;
  bytes: number | null;
  tags: string[];
  active: boolean;
  views: number;
  downloads: number;
  created_at: string;
};

const empty = {
  type: "email" as AssetType,
  category: "",
  title: "",
  description: "",
  body: "",
  preview_url: "",
  download_url: "",
  tags: "",
};

export default function ContentAdminPage() {
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/referrals/admin/content", { credentials: "include" });
    if (r.ok) {
      const j = (await r.json()) as { assets: Asset[] };
      setItems(j.assets);
      setError(null);
    } else {
      setError("Error cargando assets");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        category: form.category || null,
        description: form.description || null,
        body: form.body || null,
        preview_url: form.preview_url || null,
        download_url: form.download_url || null,
      };
      const init = editingId
        ? {
            method: "PATCH",
            body: JSON.stringify({ id: editingId, ...payload }),
          }
        : { method: "POST", body: JSON.stringify(payload) };
      const r = await fetch("/api/referrals/admin/content", {
        ...init,
        credentials: "include",
        headers: { "content-type": "application/json" },
      });
      if (!r.ok) throw new Error((await r.json()).error || "Error");
      setShowForm(false);
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (asset: Asset) => {
    await fetch("/api/referrals/admin/content", {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: asset.id, active: !asset.active }),
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Borrar definitivamente este asset?")) return;
    await fetch(`/api/referrals/admin/content?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    await load();
  };

  const startEdit = (a: Asset) => {
    setEditingId(a.id);
    setForm({
      type: a.type,
      category: a.category ?? "",
      title: a.title,
      description: a.description ?? "",
      body: a.body ?? "",
      preview_url: a.preview_url ?? "",
      download_url: a.download_url ?? "",
      tags: a.tags.join(", "),
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-ink/60">{items.length} assets en biblioteca.</p>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(empty);
            setShowForm(true);
          }}
          className="rounded-sm bg-terracotta-500 px-3 py-1.5 text-sm font-medium text-paper hover:bg-terracotta-600"
        >
          + Nuevo asset
        </button>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      {showForm && (
        <div className="rounded-md border border-ink/10 bg-paper p-4">
          <h3 className="mb-3 text-sm font-medium text-ink">
            {editingId ? "Editar asset" : "Nuevo asset"}
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as AssetType })}
              className="rounded-sm border border-ink/15 px-3 py-1.5 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              placeholder="Categoría (opcional)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-sm border border-ink/15 px-3 py-1.5 text-sm"
            />
            <input
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-sm border border-ink/15 px-3 py-1.5 text-sm md:col-span-2"
            />
            <input
              placeholder="Descripción corta"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-sm border border-ink/15 px-3 py-1.5 text-sm md:col-span-2"
            />
            <textarea
              placeholder="Cuerpo / texto que el afiliado va a copiar (asunto, body de email, post completo…)"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="min-h-[140px] rounded-sm border border-ink/15 px-3 py-1.5 text-sm font-mono md:col-span-2"
            />
            <input
              placeholder="Preview URL (imagen)"
              value={form.preview_url}
              onChange={(e) => setForm({ ...form, preview_url: e.target.value })}
              className="rounded-sm border border-ink/15 px-3 py-1.5 text-sm"
            />
            <input
              placeholder="Download URL (archivo)"
              value={form.download_url}
              onChange={(e) => setForm({ ...form, download_url: e.target.value })}
              className="rounded-sm border border-ink/15 px-3 py-1.5 text-sm"
            />
            <input
              placeholder="Tags (separadas por coma)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="rounded-sm border border-ink/15 px-3 py-1.5 text-sm md:col-span-2"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={saving || !form.title}
              className="rounded-sm bg-terracotta-500 px-4 py-1.5 text-sm font-medium text-paper disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-sm border border-ink/15 px-4 py-1.5 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink/60">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink/20 p-6 text-sm text-ink/60">
          Aún no hay assets. Crea el primero para que tus afiliados tengan material.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <div
              key={a.id}
              className={
                "rounded-md border p-4 " +
                (a.active ? "border-ink/10 bg-paper" : "border-ink/5 bg-ink/[0.02] opacity-60")
              }
            >
              {a.preview_url && (
                <img
                  src={a.preview_url}
                  alt=""
                  className="mb-2 h-28 w-full rounded-sm object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium text-ink">{a.title}</h4>
                <span className="text-xs uppercase tracking-wide text-ink/50">{a.type}</span>
              </div>
              {a.description && <p className="mt-1 text-xs text-ink/60">{a.description}</p>}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink/60">
                <span>{a.views} views</span>
                <span>{a.downloads} downloads</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(a)}
                  className="rounded-sm border border-ink/15 px-2 py-1 text-xs"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(a)}
                  className="rounded-sm border border-ink/15 px-2 py-1 text-xs"
                >
                  {a.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="rounded-sm border border-rose-300 px-2 py-1 text-xs text-rose-700"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
